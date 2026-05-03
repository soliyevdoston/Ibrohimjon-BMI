import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that logs the underlying error message and stack
 * for non-HttpException errors (Prisma errors, schema mismatches, etc.) so
 * they show up in Render logs instead of being hidden behind "Internal
 * server error".
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttp
      ? (exception as HttpException).getResponse()
      : { statusCode: status, message: (exception as Error)?.message ?? 'Internal server error' };

    if (!isHttp) {
      const err = exception as { message?: string; stack?: string; code?: string };
      this.logger.error(
        `[${request.method} ${request.url}] ${err?.code ?? ''} ${err?.message ?? exception}`,
        err?.stack,
      );
    } else if (status >= 500) {
      this.logger.error(
        `[${request.method} ${request.url}] HTTP ${status}: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(typeof message === 'string' ? { message } : message);
  }
}
