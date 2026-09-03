import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const reply = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const httpException = getHttpException(exception);
    const status = httpException?.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const response = httpException?.getResponse();
    const details = typeof response === 'object' && response !== null ? response : {};
    const message = typeof response === 'string'
      ? response
      : getMessage(details) ?? (status === 500 ? 'Internal server error' : 'Request failed');

    if (status === 500) request.log.error({ err: exception }, 'Unhandled request error');

    void reply.status(status).send({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      requestId: request.id,
      path: request.url,
    });
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

  const candidate = exception as Partial<HttpExceptionLike>;
  if (typeof candidate.getStatus !== 'function' || typeof candidate.getResponse !== 'function') {
    return undefined;
  }

  const status = candidate.getStatus.call(exception);
  return Number.isInteger(status) && status >= 400 && status <= 599
    ? candidate as HttpExceptionLike
    : undefined;
}
