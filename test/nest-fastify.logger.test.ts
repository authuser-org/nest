import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NestFastifyLogger } from '../src/nest-fastify.logger.js';

afterEach(() => vi.restoreAllMocks());

describe('NestFastifyLogger', () => {
  it('maps Fastify levels and safe request metadata to the Nest logger', () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const debug = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    const fatal = vi.spyOn(Logger.prototype, 'fatal').mockImplementation(() => undefined);
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const verbose = vi.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);
    const logger = new NestFastifyLogger('Test');
    const requestLogger = logger.child({ reqId: 'request-123' });

    requestLogger.info({ req: { method: 'GET', url: '/users' } }, 'incoming request');
    requestLogger.info(
      { res: { statusCode: 200 }, responseTime: 1.234 },
      'request completed',
    );
    requestLogger.error({ err: { message: 'boom' } }, 'request failed');
    requestLogger.debug('debug event');
    requestLogger.fatal('fatal event');
    requestLogger.warn('warning event');
    requestLogger.trace('trace event');
    requestLogger.silent('hidden event');

    expect(log).toHaveBeenCalledWith(
      'incoming request — GET /users requestId=request-123',
    );
    expect(log).toHaveBeenCalledWith(
      'request completed — status=200 duration=1.23ms requestId=request-123',
    );
    expect(error).toHaveBeenCalledWith(
      'request failed — requestId=request-123 error=boom',
    );
    expect(debug).toHaveBeenCalledWith('debug event — requestId=request-123');
    expect(fatal).toHaveBeenCalledWith('fatal event — requestId=request-123');
    expect(warn).toHaveBeenCalledWith('warning event — requestId=request-123');
    expect(verbose).toHaveBeenCalledWith('trace event — requestId=request-123');
  });
});
