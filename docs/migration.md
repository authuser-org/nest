# Migration from `@authuser/nest-fastify-kit`

## Requirements

- Upgrade the service to Node 22.12 or newer; Node 24 LTS is recommended.
- Upgrade Nest packages to version 12.
- Choose ESM or CommonJS for the application. CommonJS permits extensionless relative
  imports; native Node ESM requires `.js` on relative imports in NodeNext output.

## API changes

The application factory is now `createApp`. The previous `createHttpApp` and
`createNestApp` names are not exported. Replace `docs` with `openApi`; replace
`network` and security values using the typed option reference.

The package no longer supplies an authentication guard with implied behavior.
`Public` and `Roles` remain metadata decorators and must be consumed by an explicit
application guard.

Swagger, validation packages and Nest/Fastify runtime packages are installed as
dependencies or automatically resolved peers. Nest and Fastify are peers so the
application and this package share one framework instance.

`AuthuserModule` and `AUTHUSER_OPTIONS` were removed because their configuration was
not connected to adapter creation. Configure the application exclusively through
`createApp` or `configureHttpApp`.
