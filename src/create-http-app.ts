import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { LogController } from 'fastify';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureHttpApp } from './configure-http-app.js';
import { resolveOptions } from './options.js';
import type { CreateHttpAppOptions } from './types.js';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export async function createHttpApp(options: CreateHttpAppOptions): Promise<NestFastifyApplication> {
  const resolved = resolveOptions(options);
  const network = options.network ?? {};
  const adapter = new FastifyAdapter({
    logger: resolved.observability.logger,
    logController: new LogController({
      disableRequestLogging: !resolved.observability.requestLogging,
    }),
    trustProxy: network.trustProxy ?? false,
    bodyLimit: network.bodyLimit ?? 1_048_576,
    routerOptions: { maxParamLength: network.maxParamLength ?? 100 },
    connectionTimeout: network.connectionTimeout ?? 0,
    requestTimeout: network.requestTimeout ?? 0,
    keepAliveTimeout: network.keepAliveTimeout ?? 72_000,
    requestIdHeader: 'x-request-id',
    genReqId: safeRequestId,
  });

  const nestOptions = resolved.observability.logger === false
    ? { ...options.nest, logger: false as const }
    : { ...options.nest };
  const app = await NestFactory.create<NestFastifyApplication>(
    options.rootModule,
    adapter,
    nestOptions,
  );

  return configureHttpApp(app, options);
}

/** A descriptive alias for new projects. */
export const createNestApp = createHttpApp;

function safeRequestId(request: IncomingMessage): string {
  const incoming = request.headers['x-request-id'];
  return typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
}
