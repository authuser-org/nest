# API stability policy

Version 1 follows Semantic Versioning. The supported public API is the root export
documented in `README.md` and the TypeScript declarations reachable from it.

## Compatibility guarantees

- Patch releases fix bugs and security issues without intentionally breaking valid
  1.x configurations.
- Minor releases may add optional exports, options and preset capabilities. Existing
  explicit options retain their behavior.
- Removed or renamed APIs require a deprecation in a minor release and removal in
  the next major release, except when continued behavior creates a critical security
  vulnerability.
- Undocumented `dist/*` paths and internal classes are not public API.
- Node, Nest and Fastify support ranges are declared in `package.json`. Dropping a
  supported major runtime requires a new package major version.

The stable runtime exports are `createApp`, `configureHttpApp`, `Public`, `Roles`,
their metadata keys, and `HttpExceptionFilter`. Exported configuration and response
types are part of the TypeScript contract.

## Deprecation process

A deprecation is documented in the changelog and migration guide. When practical,
the previous behavior remains available throughout the current major release.
