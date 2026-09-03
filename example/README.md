# `@authuser/nest` example

This application is intentionally small and keeps users in memory. It exercises
Nest controllers and dependency injection, Fastify, strict DTO validation, Helmet,
rate limiting, request logging, health, OpenAPI JSON and Swagger UI.

## Run

Build the library first, then install and start the example:

```bash
cd ..
npm run build

cd example
npm install
npm run dev
```

The server listens on `127.0.0.1:3000`. Override it when needed:

```bash
HOST=0.0.0.0 PORT=4000 npm run dev
```

## Test with Postman

Import [`postman_collection.json`](./postman_collection.json), or call:

| Method | URL | Expected result |
| --- | --- | --- |
| `GET` | `http://127.0.0.1:3000/api` | Application information |
| `GET` | `http://127.0.0.1:3000/api/users` | User list |
| `GET` | `http://127.0.0.1:3000/api/users/1` | Ada Lovelace |
| `GET` | `http://127.0.0.1:3000/api/users/999` | Safe 404 response |
| `POST` | `http://127.0.0.1:3000/api/users` | Create a user |
| `GET` | `http://127.0.0.1:3000/health` | `{ "status": "ok" }` |
| `GET` | `http://127.0.0.1:3000/openapi.json` | OpenAPI document |

POST body:

```json
{
  "name": "Grace Hopper",
  "email": "grace@example.com"
}
```

Try adding an unknown property or an invalid email to verify strict validation.
Swagger UI is available at <http://127.0.0.1:3000/docs>.
