import { describe, expect, it } from 'vitest';
import { resolveOptions } from '../src/options.js';

describe('resolveOptions', () => {
  it('rejects unsafe or contradictory configuration', () => {
    expect(() => resolveOptions({
      security: { cors: { origin: true, credentials: true } },
    })).toThrow(/CORS credentials/);
    expect(() => resolveOptions({
      preset: 'full',
      health: { path: '/internal' },
      openApi: { jsonPath: '/internal' },
    })).toThrow(/paths must be unique/);
    expect(() => resolveOptions({
      security: { rateLimit: { max: 0 } },
    })).toThrow(/positive number/);
    expect(() => resolveOptions({
      health: { enabled: true, path: '/docs/internal' },
      openApi: { enabled: true, ui: true, uiPath: '/docs' },
    })).toThrow(/paths must be unique/);
    expect(() => resolveOptions({
      health: { enabled: true, path: '/health?full=true' },
    })).toThrow(/Invalid internal route/);
    expect(() => resolveOptions({
      observability: { requestIdResponseHeader: 'bad header' },
    })).toThrow(/valid HTTP header/);
    expect(() => resolveOptions({ appName: '   ' })).toThrow(/Application name/);
    expect(() => resolveOptions({ apiPrefix: 'api?debug=true' })).toThrow(/API prefix/);
    expect(() => resolveOptions({ compression: { threshold: -1 } })).toThrow(/Compression threshold/);
  });

  it('enables OpenAPI when its UI is requested and redacts logs by default', () => {
    const options = resolveOptions({ openApi: { ui: true } });
    expect(options.openApi.enabled).toBe(true);
    expect(options.observability.logger).toMatchObject({
      redact: { censor: '[REDACTED]' },
    });
    expect(options.observability.loggerFormat).toBe('json');
    expect(options.observability.requestIdResponseHeader).toBe('x-request-id');
  });

  it('omits query strings from default structured request logs', () => {
    const options = resolveOptions({});
    const logger = options.observability.logger;
    expect(logger).not.toBe(false);
    if (logger === false) return;
    const serializer = logger.serializers?.req;
    expect(serializer?.({
      method: 'GET',
      url: '/users?token=secret',
      host: 'api.example.com',
      ip: '127.0.0.1',
    })).toMatchObject({ url: '/users' });

    const withQuery = resolveOptions({ observability: { includeQueryString: true } });
    const queryLogger = withQuery.observability.logger;
    expect(queryLogger).not.toBe(false);
    if (queryLogger === false) return;
    expect(queryLogger.serializers?.req?.({
      method: 'GET',
      url: '/users?filter=active',
    })).toMatchObject({ url: '/users?filter=active' });
  });
});
