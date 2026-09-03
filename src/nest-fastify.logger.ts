import { Logger } from '@nestjs/common';
import type { FastifyBaseLogger, FastifyLogFn } from 'fastify';
import type { Bindings } from 'pino';

type LogMethod = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';

/** Adapts Fastify's structured logger contract to Nest's standard console logger. */
export class NestFastifyLogger implements FastifyBaseLogger {
  level = 'info';

  readonly info: FastifyLogFn = (...args: unknown[]) => this.write('info', args);
  readonly error: FastifyLogFn = (...args: unknown[]) => this.write('error', args);
  readonly debug: FastifyLogFn = (...args: unknown[]) => this.write('debug', args);
  readonly fatal: FastifyLogFn = (...args: unknown[]) => this.write('fatal', args);
  readonly warn: FastifyLogFn = (...args: unknown[]) => this.write('warn', args);
  readonly trace: FastifyLogFn = (...args: unknown[]) => this.write('trace', args);
  readonly silent: FastifyLogFn = () => undefined;

  constructor(
    private readonly context: string,
    private readonly includeQueryString = false,
    private readonly bindings: Bindings = {},
    private readonly logger = new Logger(context),
  ) {}

  child(bindings: Bindings): FastifyBaseLogger {
    return new NestFastifyLogger(
      this.context,
      this.includeQueryString,
      { ...this.bindings, ...bindings },
      this.logger,
    );
  }

  private write(level: LogMethod, args: unknown[]): void {
    const message = formatLogMessage(args, this.bindings, this.includeQueryString);
    switch (level) {
      case 'error':
        this.logger.error(message);
        break;
      case 'fatal':
        this.logger.fatal(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
      case 'debug':
        this.logger.debug(message);
        break;
      case 'trace':
        this.logger.verbose(message);
        break;
      default:
        this.logger.log(message);
    }
  }
}

function formatLogMessage(
  args: unknown[],
  bindings: Bindings,
  includeQueryString: boolean,
): string {
  const data = isRecord(args[0]) ? args[0] : undefined;
  const text = args.find((value): value is string => typeof value === 'string') ?? 'Fastify event';
  const details: string[] = [];
  const request = data && isRecord(data.req) ? data.req : undefined;
  const response = data && isRecord(data.res) ? data.res : undefined;
  const error = data && isRecord(data.err) ? data.err : undefined;

  if (typeof request?.method === 'string') details.push(request.method);
  if (typeof request?.url === 'string') {
    details.push(includeQueryString ? request.url : request.url.split('?', 1)[0] ?? '');
  }
  if (typeof response?.statusCode === 'number') details.push(`status=${response.statusCode}`);
  if (typeof data?.responseTime === 'number') details.push(`duration=${data.responseTime.toFixed(2)}ms`);
  if (typeof bindings.reqId === 'string') details.push(`requestId=${bindings.reqId}`);
  if (typeof error?.message === 'string') details.push(`error=${error.message}`);

  return details.length > 0 ? `${text} — ${details.join(' ')}` : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
