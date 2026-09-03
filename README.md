<div align="center">
  <h1>@authuser/nest</h1>
  <p><strong>A secure, fast and batteries-included NestJS foundation on Fastify.</strong></p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@authuser/nest"><img alt="npm" src="https://img.shields.io/npm/v/%40authuser%2Fnest?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/@authuser/nest"><img alt="downloads" src="https://img.shields.io/npm/dm/%40authuser%2Fnest?style=flat-square"></a>
  <img alt="Node 20+" src="https://img.shields.io/badge/node-%3E%3D20.11-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="NestJS 12" src="https://img.shields.io/badge/NestJS-12-E0234E?style=flat-square&logo=nestjs&logoColor=white">
  <img alt="Fastify 5" src="https://img.shields.io/badge/Fastify-5-black?style=flat-square&logo=fastify">
  <a href="./LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-green?style=flat-square"></a>
</p>

`@authuser/nest` creates a normal `NestFastifyApplication` with careful production
defaults. It keeps controllers, modules, dependency injection and the rest of Nest
intact while removing repetitive bootstrap code.

## Why this package?

- One install: Nest, Fastify, validation, security and optional docs are included.
- Fast path: request logs, compression and Swagger UI are off unless requested.
- Secure defaults: Helmet, strict DTO validation, bounded bodies, strict CORS and
  rate limiting.
- OpenAPI is optional at runtime. Its code is dynamically imported only when enabled.
- Native ESM, strict declarations and a TypeScript 7 toolchain.
- Escape hatch: the result is a regular Nest application and Fastify instance.

## Requirements

- Node.js 20.11 or newer
- An ESM project is recommended (`"type": "module"`)

## Install

```bash
npm install @authuser/nest
```

No peer-dependency checklist is required. Runtime integrations such as
`@nestjs/swagger`, `class-validator` and the Fastify plugins are dependencies of
this package.

## Quick start

```ts
// src/main.ts
import { createNestApp } from '@authuser/nest';
import { AppModule } from './app.module.js';

const app = await createNestApp({
  rootModule: AppModule,
  appName: 'users-api',
  preset: 'secure',
  apiPrefix: 'api',
  observability: {
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
  },
});

await app.listen({ port: 3000, host: '0.0.0.0' });
```

That application has Helmet, rate limiting, safe request IDs, strict validation,
a 1 MiB body limit and graceful shutdown hooks. Cross-origin requests are not
enabled implicitly.

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
const app = await createNestApp({
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

### Existing Nest + Fastify application

```ts
import { configureHttpApp } from '@authuser/nest';

await configureHttpApp(app, {
  preset: 'secure',
  health: { enabled: true, path: '/healthz' },
});
```

Call `configureHttpApp` before `app.init()` or `app.listen()` so Fastify can register
its plugins and routes.

## Public API

- `createNestApp(options)` / `createHttpApp(options)` — create and configure an app.
- `configureHttpApp(app, options)` — configure an existing Fastify-based Nest app.
- `AuthuserModule.forRoot(options)` — expose immutable options through Nest DI.
- `AUTHUSER_OPTIONS` — injection token for those options.
- `Public()` and `Roles(...roles)` — metadata helpers for your own guards.
- `HttpExceptionFilter` — the default safe JSON exception filter.

The decorators intentionally do not provide authentication. Authentication policy
belongs to the consuming application; pretending otherwise would create a dangerous
security boundary.

See the [complete option reference](./docs/configuration.md), the
[security model](./docs/security.md), and the [performance guide](./docs/performance.md).

## Performance notes

Fastify remains a strong fit when Nest's architecture is required. A raw Fastify
service will be lighter and usually faster because it removes Nest's routing and DI
overhead; frameworks such as µWebSockets.js can win synthetic throughput tests but
require a substantially different ecosystem and programming model. Measure the real
application before trading away Nest maintainability.

For the hottest path, use `preset: 'minimal'`, leave request logging and compression
off, declare response schemas in Fastify-compatible routes, and benchmark with your
actual payloads. See [docs/performance.md](./docs/performance.md).

## Migration from `@authuser/nest-fastify-kit`

```diff
- import { createHttpApp } from '@authuser/nest-fastify-kit';
+ import { createHttpApp } from '@authuser/nest';
```

The new package targets Nest 12, uses ESM, calls Swagger configuration `openApi`, and
ships required integrations as normal dependencies. See the
[migration guide](./docs/migration.md).

## Development

```bash
npm install
npm run check
```

An executable API and an importable Postman collection are available in the
[`example`](./example) directory.

## License

[MIT](./LICENSE) © Authuser
