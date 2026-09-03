import http from 'node:http';
import { performance } from 'node:perf_hooks';
import { Controller, Get, Module } from '@nestjs/common';
import Fastify from 'fastify';
import { createApp } from '../dist/index.js';

const durationMs = Number.parseInt(process.env.BENCHMARK_DURATION_MS ?? '5000', 10);
const concurrency = Number.parseInt(process.env.BENCHMARK_CONNECTIONS ?? '100', 10);

class BenchController {
  hello() {
    return { hello: 'world' };
  }
}
Controller()(BenchController);
Get('/hello')(
  BenchController.prototype,
  'hello',
  Object.getOwnPropertyDescriptor(BenchController.prototype, 'hello'),
);

class BenchModule {}
Module({ controllers: [BenchController] })(BenchModule);

const raw = Fastify({ logger: false });
raw.get('/hello', async () => ({ hello: 'world' }));
await raw.listen({ host: '127.0.0.1', port: 0 });

const minimal = await createApp({
  rootModule: BenchModule,
  preset: 'minimal',
  validation: false,
  shutdownHooks: false,
  observability: { logger: false },
  nest: { logger: false },
});
await minimal.listen({ host: '127.0.0.1', port: 0 });

const secure = await createApp({
  rootModule: BenchModule,
  preset: 'secure',
  validation: false,
  shutdownHooks: false,
  security: { rateLimit: { max: 100_000_000, timeWindow: '1 minute' } },
  observability: { logger: false },
  nest: { logger: false },
});
await secure.listen({ host: '127.0.0.1', port: 0 });

try {
  const targets = [
    ['Fastify raw', raw.server.address().port],
    ['@authuser/nest minimal', minimal.getHttpServer().address().port],
    ['@authuser/nest secure', secure.getHttpServer().address().port],
  ];
  const results = [];
  for (const [name, port] of targets) {
    await runLoad(port, 500, Math.min(concurrency, 20));
    const result = await runLoad(port, durationMs, concurrency);
    results.push({ name, ...result });
  }
  console.table(results);
} finally {
  await Promise.all([raw.close(), minimal.close(), secure.close()]);
}

async function runLoad(port, testDurationMs, connections) {
  const agent = new http.Agent({ keepAlive: true, maxSockets: connections });
  const deadline = performance.now() + testDurationMs;
  const latencies = [];
  let requests = 0;
  let errors = 0;
  const startedAt = performance.now();

  await Promise.all(Array.from({ length: connections }, async () => {
    while (performance.now() < deadline) {
      const requestStartedAt = performance.now();
      try {
        await request(port, agent);
        requests += 1;
        if (latencies.length < 100_000) latencies.push(performance.now() - requestStartedAt);
      } catch {
        errors += 1;
      }
    }
  }));

  agent.destroy();
  const elapsedSeconds = (performance.now() - startedAt) / 1_000;
  latencies.sort((left, right) => left - right);
  return {
    'requests/s': Math.round(requests / elapsedSeconds),
    'p50 ms': percentile(latencies, 0.5).toFixed(2),
    'p99 ms': percentile(latencies, 0.99).toFixed(2),
    errors,
  };
}

function request(port, agent) {
  return new Promise((resolve, reject) => {
    const outgoing = http.get({ host: '127.0.0.1', port, path: '/hello', agent }, (response) => {
      response.resume();
      response.once('end', response.statusCode === 200 ? resolve : reject);
    });
    outgoing.once('error', reject);
  });
}

function percentile(values, quantile) {
  if (values.length === 0) return 0;
  return values[Math.min(values.length - 1, Math.floor(values.length * quantile))];
}
