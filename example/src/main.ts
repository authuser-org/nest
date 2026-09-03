import { createApp } from '@authuser/nest';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '127.0.0.1';

  const app = await createApp({
    rootModule: AppModule,
    appName: 'authuser-nest-example',
    preset: 'secure',
    apiPrefix: 'api',
    health: {
      enabled: true,
      check: () => ({ status: 'live' }),
      readiness: {
        check: () => ({ status: 'ready' }),
      },
    },
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
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'QUERY'],
      },
      rateLimit: {
        max: 100,
        timeWindow: '1 minute',
      },
    },
    observability: {
      loggerFormat: 'nest',
      requestLogging: true,
      responseTimeHeader: true,
    },
  });

  await app.listen({ port, host });

  console.log(`API:         http://${host}:${port}/api`);
  console.log(`Health:      http://${host}:${port}/health`);
  console.log(`Readiness:   http://${host}:${port}/ready`);
  console.log(`OpenAPI:     http://${host}:${port}/openapi.json`);
  console.log(`Swagger UI:  http://${host}:${port}/docs`);
}

void bootstrap();
