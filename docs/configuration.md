# Configuration reference

All settings are optional except `rootModule` when using `createApp`.

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
| `nest` | `{}` | Native `NestApplicationOptions`, including its independent logger. |

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
| `network.connectionTimeout` | `10000` | Socket inactivity timeout. |
| `network.requestTimeout` | `30000` | Incoming request timeout. |
| `network.handlerTimeout` | `30000` | Maximum route-handler execution time. |
| `network.headersTimeout` | `30000` | Maximum time for receiving request headers. |
| `network.maxRequestsPerSocket` | `1000` | Requests accepted on one keep-alive socket. |

Network limits must be positive safe integers. Fastify returns 503 while the server
is closing and rejects prototype/constructor poisoning in parsed JSON.

## Security

`security.helmet` and `security.rateLimit` are enabled by secure/full presets.
CORS remains disabled unless an explicit configuration is supplied.
When enabled, the default advertised methods are GET, HEAD, POST, PUT, PATCH,
DELETE, OPTIONS and QUERY. Successful browser preflights return HTTP 204 by default;
`optionsSuccessStatus` can change this for a legacy client that requires 200.

Rate-limit defaults are 100 requests per minute per client IP. Available settings
include the complete `@fastify/rate-limit` plugin surface: `max`, `timeWindow`,
`ban`, `allowList`, `keyGenerator`, `redis`, `store`, `ipv6Subnet`, standard draft
headers and lifecycle callbacks. Configure Redis or a custom store for multiple
application replicas.

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
| `preHandler` | none | Fastify hook used to protect JSON and UI routes. |

Set `openApi: false` to guarantee the documentation integration is never loaded.

## Health

The full preset serves `{ "status": "ok" }` at `/health`. This is a liveness probe,
not a dependency-readiness check. `health.check` supplies a dynamic liveness result.
`health.readiness.check` adds a separate `/ready` endpoint for dependencies. A thrown
check returns only `{ "status": "unavailable" }` with HTTP 503 and logs the original
error internally. Health endpoints bypass the global rate limit so probes cannot
evict application traffic. Use `preHandler` when an endpoint must not be public.

| Option | Default | Description |
| --- | --- | --- |
| `health.enabled` | full preset only | Enable liveness. |
| `health.path` | `/health` | Liveness route. |
| `health.response` | `{ status: 'ok' }` | Static liveness response. |
| `health.check` | none | Dynamic liveness callback. |
| `health.preHandler` | none | Access-control hook for liveness. |
| `health.readiness` | `false` | Object containing a required `check`. |
| `health.readiness.path` | `/ready` | Readiness route. |
| `health.readiness.preHandler` | none | Access-control hook for readiness. |

## Observability

Fastify's Pino JSON logger is enabled by default, while per-request logging is
disabled to reduce noise and overhead. Enable it with
`observability.requestLogging`. Set `observability.loggerFormat: 'nest'` for the
readable standard Nest console format; JSON remains recommended for production log
ingestion and maximum throughput. The Nest adapter only emits selected request
metadata and never serializes headers or bodies.

The optional `responseTimeHeader` emits a standards-compatible `Server-Timing`
value. Default JSON logging redacts authorization, cookie and set-cookie fields. A
custom Pino `redact` configuration overrides those defaults. Likewise, a custom
`serializers.req` replaces the safe request serializer, so redaction of URL data
then becomes the application's responsibility.

| Option | Default | Description |
| --- | --- | --- |
| `observability.logger` | `true` | `false`, or Pino configuration for JSON logs. |
| `observability.loggerFormat` | `json` | `json` or readable `nest`. |
| `observability.requestLogging` | `false` | Log request start and completion. |
| `observability.includeQueryString` | `false` | Include potentially sensitive query strings in request logs. |
| `observability.requestIdResponseHeader` | `x-request-id` | Correlation response header, or `false`. |
| `observability.responseTimeHeader` | `false` | Emit `Server-Timing`. |

The Fastify logger and Nest logger are independent. Disable both explicitly with
`observability.logger: false` and `nest.logger: false`.

## Error response contract

Client-visible errors use the exported `HttpErrorResponse` shape: `statusCode`,
`error`, `message`, `requestId`, and `path`. Query strings never appear in `path`.
Every status from 500 through 599 receives the generic message `Internal server
error`; the original exception is available only in server logs.
