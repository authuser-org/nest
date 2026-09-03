# Security model

The secure preset establishes a baseline, not a complete application security model.

## Included controls

- Helmet security headers with Content Security Policy.
- Strict DTO property allowlisting.
- A one MiB default request-body limit.
- Rate limiting by client IP.
- Request IDs restricted to 128 safe characters before log propagation.
- Generic internal errors; unexpected exceptions are logged server-side only.
- CORS disabled until an allowlist is configured.

## Application responsibilities

- Authenticate requests and authorize every sensitive operation.
- Validate business rules, uploaded files and non-HTTP input.
- Configure trusted proxies exactly; a wrong value allows IP spoofing.
- Store secrets outside source control and rotate them.
- Apply endpoint-specific rate limits for login and recovery flows.
- Use TLS at the load balancer or application edge.
- Keep Node and dependencies patched and review `npm audit` output.
- Avoid exposing Swagger UI and detailed readiness data publicly.

`Public()` and `Roles()` only attach metadata. They do nothing until an application
guard reads that metadata and enforces the intended policy.

## Reporting

Follow the private disclosure instructions in [SECURITY.md](../SECURITY.md).
