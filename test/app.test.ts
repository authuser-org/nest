import { BadRequestException, Body, Controller, Get, Logger, Module, Post, QueryMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { configureHttpApp, createApp } from '../src/index.js';

class TestController {
  hello(): { hello: string } {
    return { hello: 'world' };
  }

  fail(): never {
    throw new BadRequestException('Invalid input');
  }

  search(): { supported: boolean } {
    return { supported: true };
  }

  boom(): never {
    throw new Error('Database password must never reach the client');
  }

  echo(input: unknown): unknown {
    return input;
  }

  async slow(): Promise<{ completed: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { completed: true };
  }
}
Controller()(TestController);
applyGet(TestController, 'hello', '/hello');
applyGet(TestController, 'fail', '/fail');
applyRoute(QueryMethod('/search'), TestController, 'search');
applyGet(TestController, 'boom', '/boom');
applyRoute(Post('/echo'), TestController, 'echo');
Body()(TestController.prototype, 'echo', 0);
applyGet(TestController, 'slow', '/slow');

class TestModule {}
Module({ controllers: [TestController] })(TestModule);

let app: NestFastifyApplication | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
  vi.restoreAllMocks();
});

describe('createApp', () => {
  it('configures an existing Nest Fastify application', async () => {
    app = await NestFactory.create<NestFastifyApplication>(
      TestModule,
      new FastifyAdapter({ logger: false }),
      { logger: false },
    );
    await configureHttpApp(app, {
      preset: 'minimal',
      health: true,
      observability: { requestIdResponseHeader: 'x-correlation-id' },
    });
    await app.init();

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-correlation-id']).toBe('req-1');
  });

  it('serves Nest routes, health and OpenAPI without extra setup', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'secure',
      health: true,
      openApi: { enabled: true, ui: true, bearerAuth: true },
      observability: { logger: false },
    });
    await app.init();

    const hello = await app.inject({ method: 'GET', url: '/hello' });
    const health = await app.inject({ method: 'GET', url: '/health' });
    const spec = await app.inject({ method: 'GET', url: '/openapi.json' });
    const docs = await app.inject({ method: 'GET', url: '/docs/' });

    expect(hello.statusCode).toBe(200);
    expect(hello.json()).toEqual({ hello: 'world' });
    expect(health.json()).toEqual({ status: 'ok' });
    expect(spec.json().paths['/hello']).toBeDefined();
    expect(spec.json().components.securitySchemes.bearer).toBeDefined();
    expect(docs.statusCode).toBe(200);
    expect(docs.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('can render Fastify request logs with the standard Nest logger', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    app = await createApp({
      rootModule: TestModule,
      preset: 'minimal',
      observability: { loggerFormat: 'nest', requestLogging: true },
    });
    await app.init();

    const response = await app.inject({ method: 'GET', url: '/hello' });

    expect(response.statusCode).toBe(200);
    expect(log.mock.calls.some(([message]) => (
      typeof message === 'string' && message.includes('incoming request — GET /hello')
    ))).toBe(true);
    expect(log.mock.calls.some(([message]) => (
      typeof message === 'string' && message.includes('request completed — status=200')
    ))).toBe(true);
    log.mockRestore();
  });

  it('uses secure headers, bounded bodies and safe error responses', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'secure',
      network: { bodyLimit: 16 },
      security: { cors: { origin: ['https://app.example.com'] } },
      observability: { logger: false },
    });
    await app.init();

    const response = await app.inject({ method: 'GET', url: '/fail', headers: { 'x-request-id': 'test-123' } });
    expect(response.statusCode).toBe(400);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-request-id']).toBe('test-123');
    expect(response.json()).toMatchObject({ message: 'Invalid input', requestId: 'test-123' });

    const preflight = await app.inject({
      method: 'OPTIONS',
      url: '/hello',
      headers: {
        origin: 'https://app.example.com',
        'access-control-request-method': 'PUT',
      },
    });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('https://app.example.com');
    expect(preflight.headers['access-control-allow-methods']).toContain('PUT');

    const queryPreflight = await app.inject({
      method: 'OPTIONS',
      url: '/search',
      headers: {
        origin: 'https://app.example.com',
        'access-control-request-method': 'QUERY',
        'access-control-request-headers': 'content-type',
      },
    });
    expect(queryPreflight.statusCode).toBe(204);
    expect(queryPreflight.headers['access-control-allow-methods']).toContain('QUERY');

    const queryRequest = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' },
      payload: { q: 1 },
    });
    expect(queryRequest.statusCode).toBe(200);
    expect(queryRequest.json()).toEqual({ supported: true });

    const oversized = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ value: 'this payload is larger than sixteen bytes' }),
    });
    expect(oversized.statusCode).toBe(413);
  });

  it('rejects prototype and constructor poisoning payloads', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'minimal',
      observability: { logger: false },
      nest: { logger: false },
    });
    await app.init();

    const prototypePayload = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: '{"__proto__":{"polluted":true}}',
    });
    const constructorPayload = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: '{"constructor":{"prototype":{"polluted":true}}}',
    });

    expect(prototypePayload.statusCode).toBe(400);
    expect(constructorPayload.statusCode).toBe(400);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it('hides internal errors, strips query strings and replaces unsafe request IDs', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'minimal',
      observability: { logger: false },
    });
    await app.init();

    const response = await app.inject({
      method: 'GET',
      url: '/boom?token=must-not-leak',
      headers: { 'x-request-id': 'invalid request id with spaces' },
    });
    const body = response.json();

    expect(response.statusCode).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('Database password');
    expect(JSON.stringify(body)).not.toContain('must-not-leak');
    expect(body.path).toBe('/boom');
    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers['x-request-id']).toBe(body.requestId);
  });

  it('supports dynamic liveness and readiness checks with safe failures', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'minimal',
      health: {
        enabled: true,
        check: () => ({ status: 'live' }),
        readiness: {
          check: () => {
            throw new Error('Database connection details');
          },
        },
      },
      observability: { logger: false },
    });
    await app.init();

    const live = await app.inject({ method: 'GET', url: '/health' });
    const ready = await app.inject({ method: 'GET', url: '/ready' });

    expect(live.statusCode).toBe(200);
    expect(live.json()).toEqual({ status: 'live' });
    expect(ready.statusCode).toBe(503);
    expect(ready.json()).toEqual({ status: 'unavailable' });
    expect(JSON.stringify(ready.json())).not.toContain('Database');
  });

  it('protects internal routes with a pre-handler', async () => {
    const preHandler = async (request: { headers: Record<string, unknown> }, reply: { code(status: number): { send(body: unknown): void } }) => {
      if (request.headers.authorization !== 'Bearer test-secret') {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    };
    app = await createApp({
      rootModule: TestModule,
      preset: 'minimal',
      health: { enabled: true, preHandler: preHandler as never },
      openApi: { enabled: true, preHandler: preHandler as never },
      observability: { logger: false },
    });
    await app.init();

    const deniedHealth = await app.inject({ method: 'GET', url: '/health' });
    const deniedSpec = await app.inject({ method: 'GET', url: '/openapi.json' });
    const allowedSpec = await app.inject({
      method: 'GET',
      url: '/openapi.json',
      headers: { authorization: 'Bearer test-secret' },
    });

    expect(deniedHealth.statusCode).toBe(401);
    expect(deniedSpec.statusCode).toBe(401);
    expect(allowedSpec.statusCode).toBe(200);
  });

  it('enforces global rate limiting', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'secure',
      security: { rateLimit: { max: 1, timeWindow: '1 minute' } },
      observability: { logger: false },
    });
    await app.init();

    expect((await app.inject({ method: 'GET', url: '/hello' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/hello' })).statusCode).toBe(429);
  });

  it('accepts a shared rate-limit store for multi-replica deployments', async () => {
    const hits = new Map<string, number>();
    class SharedStore {
      incr(
        key: string,
        callback: (error: Error | null, result?: { current: number; ttl: number }) => void,
      ): void {
        const current = (hits.get(key) ?? 0) + 1;
        hits.set(key, current);
        callback(null, { current, ttl: 60_000 });
      }

      child(): SharedStore {
        return this;
      }
    }

    app = await createApp({
      rootModule: TestModule,
      preset: 'secure',
      security: {
        rateLimit: { max: 1, timeWindow: '1 minute', store: SharedStore as never },
      },
      observability: { logger: false },
      nest: { logger: false },
    });
    await app.init();

    expect((await app.inject({ method: 'GET', url: '/hello' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/hello' })).statusCode).toBe(429);
    expect(hits.size).toBeGreaterThan(0);
  });

  it('rejects invalid network limits before bootstrapping Nest', async () => {
    await expect(createApp({
      rootModule: TestModule,
      network: { requestTimeout: 0 },
      observability: { logger: false },
    })).rejects.toThrow(/requestTimeout/);
  });

  it('terminates handlers that exceed the configured deadline', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'minimal',
      network: { handlerTimeout: 5 },
      observability: { logger: false },
      nest: { logger: false },
    });
    await app.init();

    const response = await app.inject({ method: 'GET', url: '/slow' });

    expect(response.statusCode).toBe(503);
    expect(response.json().message).toBe('Internal server error');
  });

  it('supports response compression and Server-Timing as explicit opt-ins', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'minimal',
      compression: { enabled: true, threshold: 0 },
      observability: { logger: false, responseTimeHeader: true },
    });
    await app.init();

    const response = await app.inject({
      method: 'GET',
      url: '/hello',
      headers: { 'accept-encoding': 'gzip' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(response.headers['server-timing']).toMatch(/^app;dur=\d+\.\d{2}$/);
  });

  it('listens on an ephemeral port and shuts down cleanly', async () => {
    app = await createApp({
      rootModule: TestModule,
      preset: 'minimal',
      observability: { logger: false },
      nest: { logger: false },
    });
    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP address');
    const url = `http://127.0.0.1:${address.port}/hello`;

    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hello: 'world' });

    await app.close();
    app = undefined;
    await expect(fetch(url)).rejects.toThrow();
  });
});

function applyGet(target: object, method: 'hello' | 'fail' | 'boom' | 'slow', path: string): void {
  applyRoute(Get(path), target, method);
}

function applyRoute(
  decorator: MethodDecorator,
  target: object,
  method: 'hello' | 'fail' | 'search' | 'boom' | 'echo' | 'slow',
): void {
  const descriptor = Object.getOwnPropertyDescriptor(target.prototype, method);
  if (!descriptor) throw new Error(`Missing ${method} descriptor`);
  decorator(target.prototype, method, descriptor);
}
