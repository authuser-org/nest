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
  });

  it('enables OpenAPI when its UI is requested and redacts logs by default', () => {
    const options = resolveOptions({ openApi: { ui: true } });
    expect(options.openApi.enabled).toBe(true);
    expect(options.observability.logger).toMatchObject({
      redact: { censor: '[REDACTED]' },
    });
  });
});
