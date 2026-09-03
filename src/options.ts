import type {
  CompressionOptions,
  ConfigureHttpAppOptions,
  CorsOptions,
  HealthOptions,
  OpenApiOptions,
  RateLimitOptions,
  SecurityPreset,
} from './types.js';

export interface ResolvedOptions {
  appName: string;
  preset: SecurityPreset;
  apiPrefix?: string;
  versioning: ConfigureHttpAppOptions['versioning'];
  validation: ConfigureHttpAppOptions['validation'];
  security: {
    helmet: boolean;
    contentSecurityPolicy: boolean;
    cors: false | CorsOptions;
    rateLimit: false | Required<Pick<RateLimitOptions, 'enabled' | 'max' | 'timeWindow' | 'ban'>> & RateLimitOptions;
  };
  compression: Required<CompressionOptions>;
  openApi: Required<Omit<OpenApiOptions, 'preHandler'>> & Pick<OpenApiOptions, 'preHandler'>;
  health: Required<Omit<HealthOptions, 'preHandler'>> & Pick<HealthOptions, 'preHandler'>;
  observability: Required<NonNullable<ConfigureHttpAppOptions['observability']>>;
  shutdownHooks: boolean;
}

export function resolveOptions(options: ConfigureHttpAppOptions): ResolvedOptions {
  const preset = options.preset ?? 'secure';
  const isSecure = preset !== 'minimal';
  const isFull = preset === 'full';
  const security = options.security ?? {};
  const rateLimitInput = security.rateLimit === false ? false : security.rateLimit ?? {};
  const compressionInput = typeof options.compression === 'object' ? options.compression : {};
  const openApiInput = typeof options.openApi === 'object' ? options.openApi : {};
  const healthInput = typeof options.health === 'object' ? options.health : {};

  const openApiEnabled = typeof options.openApi === 'boolean'
    ? options.openApi
    : openApiInput.enabled ?? openApiInput.ui ?? isFull;
  const resolved: ResolvedOptions = {
    appName: options.appName ?? 'nest-api',
    preset,
    versioning: options.versioning ?? false,
    validation: options.validation === undefined
      ? { whitelist: true, forbidNonWhitelisted: true, transform: false }
      : options.validation,
    security: {
      helmet: security.helmet ?? isSecure,
      contentSecurityPolicy: security.contentSecurityPolicy ?? true,
      cors: security.cors === undefined || security.cors === false
        ? false
        : {
            ...security.cors,
            origin: security.cors.origin ?? false,
            methods: security.cors.methods ?? [
              'GET',
              'HEAD',
              'POST',
              'PUT',
              'PATCH',
              'DELETE',
              'OPTIONS',
              'QUERY',
            ],
            optionsSuccessStatus: security.cors.optionsSuccessStatus ?? 204,
            strictPreflight: security.cors.strictPreflight ?? true,
          },
      rateLimit: rateLimitInput === false
        ? false
        : {
            ...rateLimitInput,
            enabled: rateLimitInput.enabled ?? isSecure,
            max: rateLimitInput.max ?? 100,
            timeWindow: rateLimitInput.timeWindow ?? '1 minute',
            ban: rateLimitInput.ban ?? -1,
          },
    },
    compression: {
      enabled: typeof options.compression === 'boolean' ? options.compression : compressionInput.enabled ?? isFull,
      threshold: compressionInput.threshold ?? 1024,
      encodings: compressionInput.encodings ?? ['br', 'gzip', 'deflate'],
    },
    openApi: {
      enabled: openApiEnabled,
      title: openApiInput.title ?? options.appName ?? 'Nest API',
      description: openApiInput.description ?? '',
      version: openApiInput.version ?? '1.0.0',
      json: openApiInput.json ?? true,
      jsonPath: normalizePath(openApiInput.jsonPath ?? '/openapi.json'),
      ui: openApiInput.ui ?? false,
      uiPath: normalizePath(openApiInput.uiPath ?? '/docs'),
      bearerAuth: openApiInput.bearerAuth ?? false,
      ...(openApiInput.preHandler ? { preHandler: openApiInput.preHandler } : {}),
    },
    health: {
      enabled: typeof options.health === 'boolean' ? options.health : healthInput.enabled ?? isFull,
      path: normalizePath(healthInput.path ?? '/health'),
      response: healthInput.response ?? { status: 'ok' },
      ...(healthInput.preHandler ? { preHandler: healthInput.preHandler } : {}),
    },
    observability: {
      logger: resolveLogger(options.observability?.logger ?? true),
      loggerFormat: options.observability?.loggerFormat ?? 'json',
      requestLogging: options.observability?.requestLogging ?? false,
      responseTimeHeader: options.observability?.responseTimeHeader ?? false,
    },
    shutdownHooks: options.shutdownHooks ?? true,
  };

  if (options.apiPrefix !== undefined) resolved.apiPrefix = options.apiPrefix.replace(/^\/+|\/+$/g, '');
  validateResolvedOptions(resolved);
  return resolved;
}

function normalizePath(path: string): string {
  const normalized = `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

const SENSITIVE_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

function resolveLogger(logger: NonNullable<NonNullable<ConfigureHttpAppOptions['observability']>['logger']>) {
  if (logger === false) return false;
  if (logger === true) {
    return { redact: { paths: SENSITIVE_LOG_PATHS, censor: '[REDACTED]' } };
  }
  return logger.redact === undefined
    ? { ...logger, redact: { paths: SENSITIVE_LOG_PATHS, censor: '[REDACTED]' } }
    : logger;
}

function validateResolvedOptions(options: ResolvedOptions): void {
  const cors = options.security.cors;
  if (cors !== false && cors.credentials === true && cors.origin === true) {
    throw new TypeError('CORS credentials cannot be combined with an unrestricted origin');
  }

  const paths = [
    options.health.enabled ? options.health.path : undefined,
    options.openApi.enabled && options.openApi.json ? options.openApi.jsonPath : undefined,
    options.openApi.enabled && options.openApi.ui ? options.openApi.uiPath : undefined,
  ].filter((path): path is string => path !== undefined);
  if (new Set(paths).size !== paths.length) {
    throw new TypeError('Health, OpenAPI JSON and Swagger UI paths must be unique');
  }

  const rateLimit = options.security.rateLimit;
  if (rateLimit !== false && typeof rateLimit.max === 'number' && (!Number.isFinite(rateLimit.max) || rateLimit.max <= 0)) {
    throw new TypeError('Rate limit max must be a positive number');
  }
}
