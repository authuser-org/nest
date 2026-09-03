import { describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from '../src/index.js';

describe('HttpExceptionFilter', () => {
  it('recognizes HTTP exceptions from another physical Nest installation', () => {
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ id: 'linked-package', url: '/missing', log: { error: vi.fn() } }),
      }),
    };
    const externalException = {
      getStatus: () => 404,
      getResponse: () => ({ statusCode: 404, message: 'Not found' }),
    };

    new HttpExceptionFilter().catch(externalException, host as never);

    expect(status).toHaveBeenCalledWith(404);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'Not found',
    }));
  });

  it('preserves Fastify HTTP errors', () => {
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ id: 'rate-limit', url: '/limited', log: { error: vi.fn() } }),
      }),
    };

    new HttpExceptionFilter().catch(
      { statusCode: 429, message: 'Rate limit exceeded' },
      host as never,
    );

    expect(status).toHaveBeenCalledWith(429);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 429,
      message: 'Rate limit exceeded',
    }));
  });
});
