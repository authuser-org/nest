import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { LogController } from 'fastify';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureHttpApp } from './configure-http-app.js';
import { NestFastifyLogger } from './nest-fastify.logger.js';
import { resolveOptions } from './options.js';
import type { CreateAppOptions } from './types.js';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export async function createApp(options: CreateAppOptions): Promise<NestFastifyApplication> {
  const resolved = resolveOptions(options);
  const network = options.network ?? {};
  validateNetworkOptions(network);
  const loggerOptions = resolved.observability.loggerFormat === 'nest'
    && resolved.observability.logger !== false
    ? { loggerInstance: new NestFastifyLogger(
        resolved.appName,
        resolved.observability.includeQueryString,
      ) }
    : { logger: resolved.observability.logger };
  const adapter = new FastifyAdapter({
    ...loggerOptions,
    logController: new LogController({
      disableRequestLogging: !resolved.observability.requestLogging,
    }),
    trustProxy: network.trustProxy ?? false,
    bodyLimit: network.bodyLimit ?? 1_048_576,
    routerOptions: { maxParamLength: network.maxParamLength ?? 100 },
    connectionTimeout: network.connectionTimeout ?? 10_000,
    requestTimeout: network.requestTimeout ?? 30_000,
    handlerTimeout: network.handlerTimeout ?? 30_000,
    keepAliveTimeout: network.keepAliveTimeout ?? 72_000,
    maxRequestsPerSocket: network.maxRequestsPerSocket ?? 1_000,
    return503OnClosing: true,
    onProtoPoisoning: 'error',
    onConstructorPoisoning: 'error',
    // Fastify trusts requestIdHeader verbatim; validate it ourselves in genReqId.
    requestIdHeader: false,
    genReqId: safeRequestId,
  });
  adapter.getInstance().server.headersTimeout = network.headersTimeout ?? 30_000;

  const app = await NestFactory.create<NestFastifyApplication>(
    options.rootModule,
    adapter,
    options.nest ?? {},
  );

  return configureHttpApp(app, options);
}

function validateNetworkOptions(network: NonNullable<CreateAppOptions['network']>): void {
  const values = {
    bodyLimit: network.bodyLimit,
    maxParamLength: network.maxParamLength,
    connectionTimeout: network.connectionTimeout,
    requestTimeout: network.requestTimeout,
    handlerTimeout: network.handlerTimeout,
    headersTimeout: network.headersTimeout,
    keepAliveTimeout: network.keepAliveTimeout,
    maxRequestsPerSocket: network.maxRequestsPerSocket,
  };
  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0)) {
      throw new TypeError(`Network option ${name} must be a positive safe integer`);
    }
  }
}

function safeRequestId(request: IncomingMessage): string {
  const incoming = request.headers['x-request-id'];
  return typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
}
