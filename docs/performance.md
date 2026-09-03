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
not imported when disabled.

## Choosing a lower-level stack

If profiling shows Nest itself is the bottleneck, raw Fastify is the closest smaller
step and preserves its plugin/schema ecosystem. A specialized HTTP engine can achieve
higher synthetic throughput, but moving away from Nest changes adapters, middleware,
testing and operational conventions. Make that decision from an application benchmark,
not a hello-world ranking.
