import type {
  CompressionOptions,
  ConfigureHttpAppOptions,
  CorsOptions,
  HealthOptions,
  HealthCheck,
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
  health: {
    enabled: boolean;
    path: string;
    response: Readonly<Record<string, unknown>>;
    check?: HealthCheck;
    preHandler?: HealthOptions['preHandler'];
    readiness: false | {
      path: string;
      check: HealthCheck;
      preHandler?: HealthOptions['preHandler'];
    };
  };
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
  const readinessInput = healthInput.readiness === false || healthInput.readiness === undefined
    ? false
    : healthInput.readiness;
  const includeQueryString = options.observability?.includeQueryString ?? false;

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
      ...(healthInput.check ? { check: healthInput.check } : {}),
      ...(healthInput.preHandler ? { preHandler: healthInput.preHandler } : {}),
      readiness: readinessInput === false
        ? false
        : {
            path: normalizePath(readinessInput.path ?? '/ready'),
            check: readinessInput.check,
            ...(readinessInput.preHandler ? { preHandler: readinessInput.preHandler } : {}),
          },
    },
    observability: {
      logger: resolveLogger(options.observability?.logger ?? true, includeQueryString),
      loggerFormat: options.observability?.loggerFormat ?? 'json',
      requestLogging: options.observability?.requestLogging ?? false,
      includeQueryString,
      requestIdResponseHeader: options.observability?.requestIdResponseHeader ?? 'x-request-id',
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

function resolveLogger(
  logger: NonNullable<NonNullable<ConfigureHttpAppOptions['observability']>['logger']>,
  includeQueryString: boolean,
) {
  if (logger === false) return false;
  const requestSerializer = (request: Record<string, unknown>) => ({
    method: request.method,
    url: safePath(typeof request.url === 'string' ? request.url : '', includeQueryString),
    host: request.host,
    remoteAddress: request.ip,
  });
  if (logger === true) {
    return {
      redact: { paths: SENSITIVE_LOG_PATHS, censor: '[REDACTED]' },
      serializers: { req: requestSerializer },
    };
  }
  return {
    ...logger,
    ...(logger.redact === undefined
      ? { redact: { paths: SENSITIVE_LOG_PATHS, censor: '[REDACTED]' } }
      : {}),
    serializers: {
      req: requestSerializer,
      ...logger.serializers,
    },
  };
}

function validateResolvedOptions(options: ResolvedOptions): void {
  if (options.appName.trim().length === 0 || options.appName.length > 128) {
    throw new TypeError('Application name must contain 1 to 128 characters');
  }
  if (options.apiPrefix !== undefined && (
    options.apiPrefix.length > 1_024
    || options.apiPrefix.includes('?')
    || options.apiPrefix.includes('#')
    || options.apiPrefix.includes('\0')
  )) {
    throw new TypeError('API prefix must be a valid URL path prefix');
  }
  if (!Number.isSafeInteger(options.compression.threshold) || options.compression.threshold < 0) {
    throw new TypeError('Compression threshold must be a non-negative safe integer');
  }

  const cors = options.security.cors;
  if (cors !== false && cors.credentials === true && cors.origin === true) {
    throw new TypeError('CORS credentials cannot be combined with an unrestricted origin');
  }

  const paths = [
    options.health.enabled ? options.health.path : undefined,
    options.openApi.enabled && options.openApi.json ? options.openApi.jsonPath : undefined,
    options.openApi.enabled && options.openApi.ui ? options.openApi.uiPath : undefined,
    options.health.readiness !== false ? options.health.readiness.path : undefined,
  ].filter((path): path is string => path !== undefined);
  if (paths.some((path, index) => paths.some((other, otherIndex) => (
    index !== otherIndex && (path === other || path.startsWith(`${other}/`) || other.startsWith(`${path}/`))
  )))) {
    throw new TypeError('Health, OpenAPI JSON and Swagger UI paths must be unique');
  }

  for (const path of paths) validateInternalPath(path);

  const requestIdHeader = options.observability.requestIdResponseHeader;
  if (requestIdHeader !== false && !/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(requestIdHeader)) {
    throw new TypeError('Request ID response header must be a valid HTTP header name');
  }

  const rateLimit = options.security.rateLimit;
  if (rateLimit !== false && typeof rateLimit.max === 'number' && (!Number.isFinite(rateLimit.max) || rateLimit.max <= 0)) {
    throw new TypeError('Rate limit max must be a positive number');
  }
}

function validateInternalPath(path: string): void {
  if (path.length > 2_048 || path.includes('?') || path.includes('#') || path.includes('\0')) {
    throw new TypeError(`Invalid internal route path: ${path}`);
  }
}

function safePath(url: string, includeQueryString: boolean): string {
  return includeQueryString ? url : url.split('?', 1)[0] ?? '';
}
