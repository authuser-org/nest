# Benchmarks

Run the same small JSON route through raw Fastify and the minimal and secure
`@authuser/nest` presets:

```bash
npm run benchmark
```

Optional environment variables:

```bash
BENCHMARK_DURATION_MS=10000 BENCHMARK_CONNECTIONS=100 npm run benchmark
```

This is a regression signal, not a production capacity promise. Run it on an idle
machine, repeat it, and benchmark the real application before making architecture
decisions.
