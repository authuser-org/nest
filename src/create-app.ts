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
import type { CreateAppOptions } from './types.js';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export async function createApp(options: CreateAppOptions): Promise<NestFastifyApplication> {
  const resolved = resolveOptions(options);
  const network = options.network ?? {};
  validateNetworkOptions(network);
  const adapter = new FastifyAdapter({
    logger: resolved.observability.logger,
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
    requestIdHeader: 'x-request-id',
    genReqId: safeRequestId,
  });
  adapter.getInstance().server.headersTimeout = network.headersTimeout ?? 30_000;

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
