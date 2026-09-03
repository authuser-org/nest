# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.2] - 2026-09-03

### Added

- Add optional standard Nest formatting for Fastify and HTTP request logs.

## [0.2.1] - 2026-09-03

### Changed

- Let the example use conventional extensionless Nest imports through CommonJS.
- Document ESM and CommonJS consumption and require Node.js 22.12 or newer for
  interoperable `require()` support.

## [0.2.0] - 2026-09-03

### Security

- Require Node.js 22 or newer.
- Add finite connection, request, handler and header timeouts.
- Redact sensitive authentication and cookie log fields by default.
- Validate unsafe CORS, invalid rate limits, route collisions and network limits.
- Preserve native Fastify HTTP errors such as rate-limit responses.
- Allow OpenAPI and health routes to be protected with pre-handler hooks.

### Changed

- Load optional Fastify integrations dynamically.
- Expose the complete distributed `@fastify/rate-limit` configuration surface.
- Move Nest and Fastify to peer dependencies to prevent duplicate framework copies.
- Remove the disconnected `AuthuserModule` configuration API.

### Development

- Add Node 22/24/26 CI, CodeQL, Dependabot and a dependency-free benchmark harness.
- Raise automated coverage and enforce coverage thresholds.

## [0.1.2] - 2026-09-03

### Added

- `createApp` as the concise primary application factory.

### Removed

- `createNestApp`, `createHttpApp`, and the legacy `CreateHttpAppOptions` type.

## [0.1.1] - 2026-09-03

### Changed

- Point npm documentation links to the public GitHub repository.

## [0.1.0] - 2026-09-03

### Added

- NestJS 12 and Fastify 5 application factory.
- Secure, minimal and full presets.
- Secure headers, rate limiting, strict validation and bounded request bodies.
- Optional OpenAPI JSON and Swagger UI.
- Optional health endpoint and response compression.
- TypeScript 7 build and declarations.
- HTTP QUERY (RFC 10008) support in CORS defaults and integration coverage.
