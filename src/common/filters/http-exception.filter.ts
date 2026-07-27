import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiResponseDto } from '../dto/api-res.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionRes = exception.getResponse();

    const body = new ApiResponseDto({
      success: false,
      statusCode: status,
      message:
        typeof exceptionRes === 'string'
          ? exceptionRes
          : ((exceptionRes as any).message ?? exception.message),
      errors:
        typeof exceptionRes === 'object'
          ? (exceptionRes as any).message
          : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

    response.status(status).json(body);
  }
}
