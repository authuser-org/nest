# Configuration reference

All settings are optional except `rootModule` when using `createNestApp`.

## Application

| Option | Default | Description |
| --- | --- | --- |
| `rootModule` | required | Root Nest module. |
| `appName` | `nest-api` | Name used by generated OpenAPI metadata. |
| `preset` | `secure` | `minimal`, `secure`, or `full`. |
| `apiPrefix` | none | Global prefix without a leading slash. |
| `versioning` | `false` | `true` for URI versioning, or Nest versioning options. |
| `shutdownHooks` | `true` | Enable Nest shutdown signal hooks. |
| `validation` | strict defaults | `false` or Nest `ValidationPipeOptions`. |
| `nest` | `{}` | Extra `NestApplicationOptions` except logger. |

Default validation uses `whitelist: true`, `forbidNonWhitelisted: true`, and
`transform: false`. Transformation is off because implicit coercion costs work and
can hide unexpected input. Enable it explicitly when DTO conversion is required.

## Network

| Option | Default | Description |
| --- | --- | --- |
| `network.bodyLimit` | `1048576` | Maximum body in bytes. |
| `network.maxParamLength` | `100` | Maximum route parameter length. |
| `network.trustProxy` | `false` | Fastify trusted-proxy policy. |
| `network.keepAliveTimeout` | `72000` | Keep-alive timeout in milliseconds. |
| `network.connectionTimeout` | `0` | Socket inactivity timeout. |
| `network.requestTimeout` | `0` | Incoming request timeout. Configure a finite value at the edge. |

## Security

`security.helmet` and `security.rateLimit` are enabled by secure/full presets.
CORS remains disabled unless an explicit configuration is supplied.
When enabled, the default advertised methods are GET, HEAD, POST, PUT, PATCH,
DELETE, OPTIONS and QUERY. Successful browser preflights return HTTP 204 by default;
`optionsSuccessStatus` can change this for a legacy client that requires 200.

Rate-limit defaults are 100 requests per minute per client IP. Available settings
include `max`, `timeWindow`, `ban`, `allowList`, and `keyGenerator`.

## Compression

Compression is enabled by the full preset only. The default threshold is 1024 bytes
and encodings are Brotli, gzip and deflate. Compression can increase CPU usage and
can amplify secrets reflected beside attacker-controlled data, so enable it for
known payloads rather than automatically for every API.

## OpenAPI

| Option | Default | Description |
| --- | --- | --- |
| `enabled` | full preset only | Generate an OpenAPI document. |
| `json` | `true` | Serve the document. |
| `jsonPath` | `/openapi.json` | JSON endpoint. |
| `ui` | `false` | Serve Swagger UI. |
| `uiPath` | `/docs` | UI route prefix. |
| `bearerAuth` | `false` | Add a bearer security scheme. |

Set `openApi: false` to guarantee the documentation integration is never loaded.

## Health and observability

The full preset serves `{ "status": "ok" }` at `/health`. This is a liveness probe,
not a dependency-readiness check. Supply a custom response or implement a Nest
controller for deeper readiness logic.

Fastify's Pino logger is enabled, while per-request logging is disabled to reduce
noise and overhead. Enable it with `observability.requestLogging`. The optional
`responseTimeHeader` emits a standards-compatible `Server-Timing` value.
