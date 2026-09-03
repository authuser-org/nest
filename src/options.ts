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
  openApi: Required<OpenApiOptions>;
  health: Required<HealthOptions>;
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
        : { ...security.cors, origin: security.cors.origin ?? false },
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
      enabled: typeof options.openApi === 'boolean' ? options.openApi : openApiInput.enabled ?? isFull,
      title: openApiInput.title ?? options.appName ?? 'Nest API',
      description: openApiInput.description ?? '',
      version: openApiInput.version ?? '1.0.0',
      json: openApiInput.json ?? true,
      jsonPath: normalizePath(openApiInput.jsonPath ?? '/openapi.json'),
      ui: openApiInput.ui ?? false,
      uiPath: normalizePath(openApiInput.uiPath ?? '/docs'),
      bearerAuth: openApiInput.bearerAuth ?? false,
    },
    health: {
      enabled: typeof options.health === 'boolean' ? options.health : healthInput.enabled ?? isFull,
      path: normalizePath(healthInput.path ?? '/health'),
      response: healthInput.response ?? { status: 'ok' },
    },
    observability: {
      logger: options.observability?.logger ?? true,
      requestLogging: options.observability?.requestLogging ?? false,
      responseTimeHeader: options.observability?.responseTimeHeader ?? false,
    },
    shutdownHooks: options.shutdownHooks ?? true,
  };

  if (options.apiPrefix !== undefined) resolved.apiPrefix = options.apiPrefix.replace(/^\/+|\/+$/g, '');
  return resolved;
}

function normalizePath(path: string): string {
  const normalized = `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/';
}
