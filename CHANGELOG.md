# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-09-03

### Added

- Establish and document the stable 1.x public API contract.
- Add dynamic liveness and dependency-readiness checks with safe 503 failures.
- Return validated correlation IDs through a configurable response header.
- Verify the packed artifact from clean ESM and CommonJS consumers.
- Add cross-platform CI, release automation, contribution policies, a threat model,
  and a production checklist.

### Security

- Hide every 5xx exception message and log the original cause server-side.
- Remove query strings from error paths and request logs by default.
- Validate incoming request IDs instead of trusting Fastify's header passthrough.
- Reject invalid internal paths, overlapping Swagger routes, and invalid correlation
  header names.
- Add tests for JSON prototype/constructor poisoning, body limits, handler deadlines,
  shared rate-limit stores, and sensitive-data exposure.

### Changed

- Make Nest and Fastify logging independently configurable. Setting
  `observability.logger: false` no longer disables the Nest logger; use
  `nest.logger: false` for that behavior.
- Add an explicit CommonJS export condition while retaining the native ESM build.
- Mark the entry point side effect so bundlers preserve `reflect-metadata` setup.
- Raise enforced coverage thresholds to 95% statements/lines/functions and 85%
  branches.

## [0.2.2] - 2026-09-03

### Added

- Add optional standard Nest formatting for Fastify and HTTP request logs.

### Fixed

- Compile the development example with TypeScript so Nest dependency-injection
  metadata is preserved while watching files.

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
