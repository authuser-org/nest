# Security model

The secure preset establishes a baseline, not a complete application security model.

## Included controls

- Helmet security headers with Content Security Policy.
- Strict DTO property allowlisting.
- A one MiB default request-body limit.
- Finite connection, request, handler and header timeouts.
- Rate limiting by client IP.
- Request IDs restricted to 128 safe characters before log propagation.
- Generic internal errors; unexpected exceptions are logged server-side only.
- CORS disabled until an allowlist is configured.
- Sensitive authentication and cookie log fields redacted by default.
- Optional pre-handler protection for documentation and health routes.

## Application responsibilities

- Authenticate requests and authorize every sensitive operation.
- Validate business rules, uploaded files and non-HTTP input.
- Configure trusted proxies exactly; a wrong value allows IP spoofing.
- Store secrets outside source control and rotate them.
- Apply endpoint-specific rate limits for login and recovery flows.
- Use Redis or a custom rate-limit store whenever more than one replica runs.
- Use TLS at the load balancer or application edge.
- Keep Node and dependencies patched and review `npm audit` output.
- Avoid exposing Swagger UI and detailed readiness data publicly.
- Add CSRF protection when authentication relies on ambient cookies or sessions.

`Public()` and `Roles()` only attach metadata. They do nothing until an application
guard reads that metadata and enforces the intended policy.

## Reporting

Follow the private disclosure instructions in [SECURITY.md](../SECURITY.md).
