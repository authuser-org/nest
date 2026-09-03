# Migration from `@authuser/nest-fastify-kit`

## Requirements

- Upgrade the service to Node 20.11 or newer.
- Upgrade Nest packages to version 12.
- Use ESM-compatible imports and include `.js` on relative imports in NodeNext output.

## API changes

The application factory keeps its old `createHttpApp` name and also exports
`createNestApp`. Replace `docs` with `openApi`; replace `network` and security values
using the typed option reference.

The package no longer supplies an authentication guard with implied behavior.
`Public` and `Roles` remain metadata decorators and must be consumed by an explicit
application guard.

Swagger, validation packages and Nest/Fastify runtime packages are installed as
dependencies. Remove redundant direct declarations only after confirming the app
does not import those packages itself and that your package manager deduplicates a
single compatible Nest version.
