import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { HttpErrorResponse } from './types.js';

export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const reply = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const httpException = getHttpException(exception);
    const status = httpException?.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const response = httpException?.getResponse();
    const details = typeof response === 'object' && response !== null ? response : {};
    const message = status >= 500
      ? 'Internal server error'
      : typeof response === 'string'
        ? response
        : getMessage(details) ?? 'Request failed';

    if (status >= 500) request.log.error({ err: exception }, 'Unhandled request error');

    const body: HttpErrorResponse = {
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      requestId: request.id,
      path: request.url.split('?', 1)[0] ?? request.url,
    };
    void reply.status(status).send(body);
  }
}

Catch()(HttpExceptionFilter);

function getMessage(value: object): unknown {
  return 'message' in value ? value.message : undefined;
}

interface HttpExceptionLike {
  getStatus(): number;
  getResponse(): string | object;
}

function getHttpException(exception: unknown): HttpExceptionLike | undefined {
  if (exception instanceof HttpException) return exception;
  if (typeof exception !== 'object' || exception === null) return undefined;

  const candidate = exception as Partial<HttpExceptionLike> & {
    statusCode?: unknown;
    message?: unknown;
  };
  if (typeof candidate.getStatus === 'function' && typeof candidate.getResponse === 'function') {
    const status = candidate.getStatus.call(exception);
    return isHttpErrorStatus(status) ? candidate as HttpExceptionLike : undefined;
  }

  if (isHttpErrorStatus(candidate.statusCode)) {
    const status = candidate.statusCode;
    const message = typeof candidate.message === 'string' ? candidate.message : 'Request failed';
    return {
      getStatus: () => status,
      getResponse: () => ({ message }),
    };
  }
  return undefined;
}

function isHttpErrorStatus(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599;
}
