<div align="center">
  <h1>@authuser/nest</h1>
  <p><strong>A secure, fast and batteries-included NestJS foundation on Fastify.</strong></p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@authuser/nest"><img alt="npm" src="https://img.shields.io/npm/v/%40authuser%2Fnest?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/@authuser/nest"><img alt="downloads" src="https://img.shields.io/npm/dm/%40authuser%2Fnest?style=flat-square"></a>
  <a href="https://github.com/authuser-org/nest/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/authuser-org/nest/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="Node 22.12+" src="https://img.shields.io/badge/node-%3E%3D22.12-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="NestJS 12" src="https://img.shields.io/badge/NestJS-12-E0234E?style=flat-square&logo=nestjs&logoColor=white">
  <img alt="Fastify 5" src="https://img.shields.io/badge/Fastify-5-black?style=flat-square&logo=fastify">
  <a href="https://github.com/authuser-org/nest/blob/main/LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-green?style=flat-square"></a>
</p>

<p align="center">
  <a href="https://github.com/authuser-org/nest/"><strong>GitHub</strong></a> ·
  <a href="https://github.com/authuser-org/nest/tree/main/docs"><strong>Documentation</strong></a> ·
  <a href="https://github.com/authuser-org/nest/tree/main/example"><strong>Example</strong></a>
</p>

`@authuser/nest` creates a normal `NestFastifyApplication` with careful production
defaults. It keeps controllers, modules, dependency injection and the rest of Nest
intact while removing repetitive bootstrap code.

## Why this package?

- One install: Nest, Fastify, validation, security and optional docs are included.
- Fast path: request logs, compression and Swagger UI are off unless requested.
- Secure defaults: Helmet, strict DTO validation, bounded bodies, strict CORS and
  rate limiting.
- Finite request, handler, header and connection timeouts.
- Sensitive authorization, cookie and set-cookie log fields are redacted by default.
- Query strings are omitted from logs and error paths unless explicitly enabled.
- JSON logging by default, with an optional standard Nest console format.
- Correlated request IDs are validated and returned in `x-request-id`.
- Dynamic liveness and readiness checks fail closed with HTTP 503.
- OpenAPI is optional at runtime. Its code is dynamically imported only when enabled.
- HTTP QUERY (RFC 10008) passes through Nest 12/Fastify 5 and is included in CORS defaults.
- Native ESM, strict declarations and a TypeScript 7 toolchain.
- Escape hatch: the result is a regular Nest application and Fastify instance.

## Requirements

- Node.js 22.12 or newer (Node.js 24 LTS recommended for production)
- ESM and CommonJS applications are supported

## Install

```bash
npm install @authuser/nest
```

Nest and Fastify are peer dependencies so an application never loads duplicate
framework instances. npm 7+ installs them when missing and reuses compatible copies
already present in a Nest project. Runtime integrations such as `@nestjs/swagger`,
validation and the Fastify plugins remain included.

## Quick start

```ts
// src/main.ts
import { createApp } from '@authuser/nest';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await createApp({
    rootModule: AppModule,
    appName: 'users-api',
    preset: 'secure',
    apiPrefix: 'api',
    observability: {
      logger: { level: process.env.LOG_LEVEL ?? 'info' },
    },
  });

  await app.listen({ port: 3000, host: '0.0.0.0' });
}

void bootstrap();
```

The example uses CommonJS so relative imports can use the conventional Nest style
without file extensions. Native Node ESM projects must include `.js` in relative
imports; this is a Node.js rule rather than a requirement from this package.

That application has Helmet, rate limiting, safe request IDs, strict validation,
a 1 MiB body limit, finite timeouts and graceful shutdown hooks. Cross-origin
requests are not enabled implicitly.

`1.x` follows Semantic Versioning: documented public exports and option behavior only
change incompatibly in a new major version. See the [API stability policy](https://github.com/authuser-org/nest/blob/main/docs/api-stability.md).

## Presets

| Preset | Intended use | Enabled by default |
| --- | --- | --- |
| `minimal` | Lowest framework overhead | validation and exception filter |
| `secure` | Public production API (default) | minimal + Helmet + rate limit |
| `full` | Feature-rich service | secure + compression + health + OpenAPI JSON |

Explicit options always override a preset.

## OpenAPI and Swagger UI

OpenAPI is installed but disabled with `minimal` and `secure`. Enable only the
machine-readable document:

```ts
const app = await createApp({
  rootModule: AppModule,
  openApi: {
    enabled: true,
    title: 'Users API',
    version: '2.0.0',
    jsonPath: '/openapi.json',
    bearerAuth: true,
  },
});
```

Swagger UI is a separate opt-in because it adds routes and static assets:

```ts
openApi: {
  enabled: process.env.NODE_ENV !== 'production',
  ui: true,
  uiPath: '/docs',
}
```

For an internet-facing production service, prefer exporting the JSON during CI or
protecting documentation routes at the gateway.

Documentation and health routes can also be protected directly:

```ts
const protectInternalRoute = async (request, reply) => {
  if (request.headers.authorization !== `Bearer ${process.env.INTERNAL_TOKEN}`) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
};

openApi: { enabled: true, preHandler: protectInternalRoute },
health: { enabled: true, preHandler: protectInternalRoute },
```

### Liveness and readiness

```ts
health: {
  enabled: true,
  check: () => ({ status: 'live' }),
  readiness: {
    path: '/ready',
    check: async () => {
      await database.ping();
      return { status: 'ready' };
    },
  },
}
```

A thrown health check is logged internally and returned as a generic HTTP 503. Do
not include credentials, topology or personal data in successful health responses.

## Configuration examples

### CORS allowlist

```ts
security: {
  cors: {
    origin: ['https://app.example.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
}
```

### Rate limiting behind a proxy

```ts
network: { trustProxy: ['127.0.0.1', '10.0.0.0/8'] },
security: {
  rateLimit: { max: 300, timeWindow: '1 minute' },
}
```

Never enable `trustProxy: true` unless every direct connection comes through a
trusted proxy; client IPs are used as rate-limit keys.

For multiple replicas, pass the plugin's `redis` client or a custom `store`; the
in-memory default only coordinates requests inside one Node process.

### Existing Nest + Fastify application

```ts
import { configureHttpApp } from '@authuser/nest';

await configureHttpApp(app, {
  preset: 'secure',
  health: { enabled: true, path: '/healthz' },
});
```

Call `configureHttpApp` before `app.init()` or `app.listen()` so Fastify can register
its plugins and routes. When supplying your own adapter, request-ID generation and
network limits remain adapter responsibilities; `createApp` configures those safely.

## Public API

- `createApp(options)` — create and configure an application.
- `configureHttpApp(app, options)` — configure an existing Fastify-based Nest app.
- `Public()` and `Roles(...roles)` — metadata helpers for your own guards.
- `HttpExceptionFilter` — the default safe JSON exception filter.
- Public TypeScript contracts for configuration, health checks and error responses.

The decorators intentionally do not provide authentication. Authentication policy
belongs to the consuming application; pretending otherwise would create a dangerous
security boundary.

See the [complete option reference](https://github.com/authuser-org/nest/blob/main/docs/configuration.md), the
[security model](https://github.com/authuser-org/nest/blob/main/docs/security.md), the
[production checklist](https://github.com/authuser-org/nest/blob/main/docs/production.md), and the
[performance guide](https://github.com/authuser-org/nest/blob/main/docs/performance.md).

## Performance notes

Fastify remains a strong fit when Nest's architecture is required. A raw Fastify
service will be lighter and usually faster because it removes Nest's routing and DI
overhead; frameworks such as µWebSockets.js can win synthetic throughput tests but
require a substantially different ecosystem and programming model. Measure the real
application before trading away Nest maintainability.

For the hottest path, use `preset: 'minimal'`, leave request logging and compression
off, declare response schemas in Fastify-compatible routes, and benchmark with your
actual payloads. Run `npm run benchmark` to compare raw Fastify with both package
presets. See the [performance guide](https://github.com/authuser-org/nest/blob/main/docs/performance.md).

## Migration from `@authuser/nest-fastify-kit`

```diff
- import { createHttpApp } from '@authuser/nest-fastify-kit';
+ import { createApp } from '@authuser/nest';
```

The new package targets Nest 12, publishes an ESM entry point consumable from Node.js
22.12+ ESM and CommonJS applications, calls Swagger configuration `openApi`, and ships
required integrations as normal dependencies. See the
[migration guide](https://github.com/authuser-org/nest/blob/main/docs/migration.md).

## Development

```bash
npm install
npm run check
npm run test:coverage
npm run test:package
```

An executable API and an importable Postman collection are available in the
[`example`](https://github.com/authuser-org/nest/tree/main/example) directory.

## License

[MIT](https://github.com/authuser-org/nest/blob/main/LICENSE) © Authuser
