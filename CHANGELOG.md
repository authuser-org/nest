# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `createApp` as the concise primary application factory.

### Removed

- `createNestApp`, `createHttpApp`, and the legacy `CreateHttpAppOptions` type.

## [0.1.0] - 2026-09-03

### Added

- NestJS 12 and Fastify 5 application factory.
- Secure, minimal and full presets.
- Secure headers, rate limiting, strict validation and bounded request bodies.
- Optional OpenAPI JSON and Swagger UI.
- Optional health endpoint and response compression.
- TypeScript 7 build and declarations.
- HTTP QUERY (RFC 10008) support in CORS defaults and integration coverage.
