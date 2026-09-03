# Performance guide

There is no universal requests-per-second number: controller work, payload shape,
logging, validation, database latency, TLS and hardware dominate realistic results.

## Recommended sequence

1. Start with `preset: 'secure'` and production-shaped traffic.
2. Benchmark latency percentiles and CPU, not only average throughput.
3. Disable features one at a time to locate actual cost.
4. Add Fastify JSON response schemas on hot routes to gain compiled serialization.
5. Run multiple Node processes or containers; keep one event loop per CPU allocation.
6. Load-test through the same proxy and TLS path used in production.

Request logging is disabled by default. Compression is full-preset only because it
trades bandwidth for CPU. OpenAPI generation happens at startup, and its modules are
not imported when disabled. Helmet, CORS, rate limiting and compression are also
dynamically imported only when their configuration enables them.

Pino JSON is the production logging default. The Nest-formatted adapter prioritizes
human readability and is intended primarily for local development; benchmark it
before enabling per-request Nest logs on a high-throughput service.

## Reproducible baseline

Run the dependency-free local regression benchmark:

```bash
npm run benchmark
```

Change duration and concurrency with `BENCHMARK_DURATION_MS` and
`BENCHMARK_CONNECTIONS`. Results compare an identical route on raw Fastify, the
minimal preset and the secure preset. Treat them as a regression signal rather than
a production capacity promise.

The 1.0.0 release check on Node 22.14 with 100 local connections produced this
single-run baseline:

| Scenario | Requests/s | p50 | p99 | Errors |
| --- | ---: | ---: | ---: | ---: |
| Fastify raw | 30,703 | 3.23 ms | 3.73 ms | 0 |
| `@authuser/nest` minimal | 26,602 | 3.68 ms | 4.40 ms | 0 |
| `@authuser/nest` secure | 19,807 | 4.98 ms | 6.31 ms | 0 |

That run retained about 87% of raw Fastify throughput in `minimal` and 65% in
`secure`. It is a local regression reference, not a service capacity guarantee.

## Choosing a lower-level stack

If profiling shows Nest itself is the bottleneck, raw Fastify is the closest smaller
step and preserves its plugin/schema ecosystem. A specialized HTTP engine can achieve
higher synthetic throughput, but moving away from Nest changes adapters, middleware,
testing and operational conventions. Make that decision from an application benchmark,
not a hello-world ranking.
