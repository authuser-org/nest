# Threat model

`@authuser/nest` hardens the HTTP process boundary for a Nest application. It does
not establish user identity or decide whether a caller may access a business object.

## Protected assets

- Availability of the Node process and its event loop.
- Confidentiality of request credentials and internal exception details.
- Integrity of parsed JSON objects and request correlation identifiers.
- Predictable application bootstrap and shutdown behavior.

## Included mitigations

- Bounded bodies, parameters, sockets and finite timeouts reduce common resource
  exhaustion paths.
- Prototype and constructor poisoning are rejected during JSON parsing.
- Helmet establishes browser-facing security headers.
- Strict DTO defaults reject unexpected properties.
- CORS is closed until explicitly configured.
- Rate limiting controls abusive clients per instance or shared store.
- Incoming request IDs are validated by `createApp` before they reach logs.
- Sensitive headers and query strings are excluded from default logs.
- All 5xx details and health-check failures are hidden from clients.

## Explicitly out of scope

- Authentication, authorization, tenancy and object-level access control.
- TLS termination, WAF, network policy and volumetric DDoS protection.
- Database query construction, encryption, secret storage and key rotation.
- CSRF defenses for cookie-authenticated applications.
- Malware scanning, file validation and non-HTTP ingestion.

## Trust assumptions

- Nest, Fastify and direct dependencies are kept on supported patched versions.
- `trustProxy` contains only infrastructure controlled by the operator.
- A distributed deployment uses a shared rate-limit store.
- Application code does not deliberately log or expose sensitive data.
- Applications calling `configureHttpApp` directly configure equivalent request-ID
  and network limits on their own Fastify adapter.
