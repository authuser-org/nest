import type { LoggerOptions } from 'pino';
import type rateLimit from '@fastify/rate-limit';
import type { Type, ValidationPipeOptions, VersioningOptions } from '@nestjs/common';
import type { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import type { preHandlerHookHandler } from 'fastify';

export type SecurityPreset = 'minimal' | 'secure' | 'full';

export interface CorsOptions {
  /** No cross-origin requests are allowed by default. */
  origin?: boolean | string | RegExp | Array<string | RegExp>;
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  /** Status returned for a successful preflight. HTTP 204 is the default. */
  optionsSuccessStatus?: number;
  strictPreflight?: boolean;
}

export type RateLimitOptions = Omit<rateLimit.RateLimitPluginOptions, 'global'> & {
  enabled?: boolean;
};

export interface SecurityOptions {
  helmet?: boolean;
  /** Helmet Content-Security-Policy. Enabled by default. */
  contentSecurityPolicy?: boolean;
  cors?: false | CorsOptions;
  rateLimit?: false | RateLimitOptions;
}

export interface CompressionOptions {
  enabled?: boolean;
  threshold?: number;
  encodings?: Array<'br' | 'gzip' | 'deflate' | 'identity'>;
}

export interface OpenApiOptions {
  enabled?: boolean;
  title?: string;
  description?: string;
  version?: string;
  /** Serve the generated OpenAPI document. Set false to generate only. */
  json?: boolean;
  jsonPath?: string;
  /** Swagger UI is opt-in and disabled by default. */
  ui?: boolean;
  uiPath?: string;
  bearerAuth?: boolean;
  /** Fastify hook for authenticating or restricting the JSON and UI routes. */
  preHandler?: preHandlerHookHandler;
}

export interface HealthOptions {
  enabled?: boolean;
  path?: string;
  response?: Readonly<Record<string, unknown>>;
  /** Fastify hook for restricting the health route. */
  preHandler?: preHandlerHookHandler;
}

export interface ObservabilityOptions {
  /** Fastify logging. An options object configures the default Pino JSON logger. */
  logger?: boolean | LoggerOptions;
  /** JSON is optimal for production ingestion; nest uses Nest's readable console format. */
  loggerFormat?: 'json' | 'nest';
  requestLogging?: boolean;
  responseTimeHeader?: boolean;
}

export interface NetworkOptions {
  trustProxy?: boolean | string | string[];
  bodyLimit?: number;
  maxParamLength?: number;
  connectionTimeout?: number;
  requestTimeout?: number;
  handlerTimeout?: number;
  headersTimeout?: number;
  keepAliveTimeout?: number;
  maxRequestsPerSocket?: number;
}

export interface ConfigureHttpAppOptions {
  appName?: string;
  preset?: SecurityPreset;
  apiPrefix?: string;
  versioning?: boolean | VersioningOptions;
  validation?: false | ValidationPipeOptions;
  security?: SecurityOptions;
  compression?: boolean | CompressionOptions;
  openApi?: boolean | OpenApiOptions;
  health?: boolean | HealthOptions;
  observability?: ObservabilityOptions;
  shutdownHooks?: boolean;
}

export interface CreateAppOptions extends ConfigureHttpAppOptions {
  rootModule: Type<unknown>;
  network?: NetworkOptions;
  nest?: Omit<NestApplicationOptions, 'logger'>;
}
