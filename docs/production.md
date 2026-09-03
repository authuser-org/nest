# Production checklist

Use this list before exposing a service to untrusted traffic.

## Application

- Start from the `secure` preset and document every disabled control.
- Authenticate and authorize sensitive routes with application guards.
- Keep `Public()` usage explicit and covered by authorization tests.
- Validate business rules, file uploads and data leaving persistence layers.
- Use `nest.logger` and `observability.logger` intentionally.

## Network and edge

- Terminate TLS at a trusted edge and redirect plaintext traffic.
- Configure `network.trustProxy` only for known proxy addresses or networks.
- Apply an infrastructure-level request/body limit no larger than the application
  limit where possible.
- Tune connection, header, request and handler timeouts against production latency.
- Use an upstream DDoS control for an internet-facing API.

## Distributed operation

- Configure Redis or another shared `@fastify/rate-limit` store for multiple replicas.
- Give login, recovery and expensive routes stricter endpoint-specific limits.
- Keep liveness independent of downstream dependencies.
- Put database, queue and critical service checks in readiness.
- Ensure the orchestrator removes a replica when readiness returns 503.

## Exposure and data

- Disable or protect Swagger UI and OpenAPI in production.
- Do not return credentials or topology from health checks.
- Keep secrets and personal data out of URLs and logs.
- Keep JSON log redaction enabled and extend it for application-specific fields.
- Add CSRF protection when browsers authenticate with ambient cookies.

## Release

- Run `npm run check`, `npm run test:coverage`, `npm run test:package`, and
  `npm run smoke --prefix example`.
- Review `npm audit --omit=dev` and dependency updates.
- Load-test realistic payloads through the production proxy and TLS path.
- Exercise shutdown while requests are active.
- Monitor latency percentiles, error rate, event-loop utilization and memory.
