import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { registerOpenApi } from './openapi.js';
import { resolveOptions } from './options.js';
import type { ConfigureHttpAppOptions } from './types.js';

export async function configureHttpApp(
  app: NestFastifyApplication,
  input: ConfigureHttpAppOptions = {},
): Promise<NestFastifyApplication> {
  const options = resolveOptions(input);
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;

  if (options.security.helmet) {
    const { default: helmet } = await import('@fastify/helmet');
    await fastify.register(helmet, {
      global: true,
      contentSecurityPolicy: options.security.contentSecurityPolicy,
    });
  }

  if (options.security.cors !== false) {
    const { default: cors } = await import('@fastify/cors');
    await fastify.register(cors, options.security.cors);
  }

  if (options.security.rateLimit !== false && options.security.rateLimit.enabled) {
    const { default: rateLimit } = await import('@fastify/rate-limit');
    const { enabled: _enabled, ...rateLimitOptions } = options.security.rateLimit;
    await fastify.register(rateLimit, rateLimitOptions);
  }

  if (options.compression.enabled) {
    const { default: compress } = await import('@fastify/compress');
    await fastify.register(compress, {
      threshold: options.compression.threshold,
      encodings: options.compression.encodings,
    });
  }

  if (options.apiPrefix) app.setGlobalPrefix(options.apiPrefix);
  if (options.versioning) {
    app.enableVersioning(options.versioning === true
      ? { type: VersioningType.URI }
      : options.versioning);
  }
  if (options.validation !== false) app.useGlobalPipes(new ValidationPipe(options.validation));
  app.useGlobalFilters(new HttpExceptionFilter());
  if (options.shutdownHooks) app.enableShutdownHooks();

  if (options.observability.responseTimeHeader) {
    const startTimes = new WeakMap<object, bigint>();
    fastify.addHook('onRequest', async (request) => {
      startTimes.set(request, process.hrtime.bigint());
    });
    fastify.addHook('onSend', async (request, reply, payload) => {
      const start = startTimes.get(request);
      if (typeof start === 'bigint') {
        reply.header('server-timing', `app;dur=${(Number(process.hrtime.bigint() - start) / 1e6).toFixed(2)}`);
      }
      return payload;
    });
  }

  if (options.health.enabled) {
    fastify.get(options.health.path, {
      config: { rateLimit: false },
      ...(options.health.preHandler ? { preHandler: options.health.preHandler } : {}),
    }, async (_request, reply) => reply.send(options.health.response));
  }

  await registerOpenApi(app, fastify, options.openApi);
  return app;
}
