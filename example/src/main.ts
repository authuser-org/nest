import { createNestApp } from '@authuser/nest';
import { AppModule } from './app.module.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '127.0.0.1';

const app = await createNestApp({
  rootModule: AppModule,
  appName: 'authuser-nest-example',
  preset: 'secure',
  apiPrefix: 'api',
  health: true,
  openApi: {
    enabled: true,
    title: '@authuser/nest example',
    description: 'Small API for testing @authuser/nest from Postman.',
    version: '1.0.0',
    ui: true,
  },
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    rateLimit: {
      max: 100,
      timeWindow: '1 minute',
    },
  },
  observability: {
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
    requestLogging: true,
    responseTimeHeader: true,
  },
});

await app.listen({ port, host });

console.log(`API:         http://${host}:${port}/api`);
console.log(`Health:      http://${host}:${port}/health`);
console.log(`OpenAPI:     http://${host}:${port}/openapi.json`);
console.log(`Swagger UI:  http://${host}:${port}/docs`);
