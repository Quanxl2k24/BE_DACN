import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-res.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        if (data instanceof ApiResponseDto) {
          return data;
        }

        const response: ApiResponseDto<T> = new ApiResponseDto({
          success: true,
          statusCode,
          message: typeof data === 'string' ? data : 'Success',
          data: typeof data === 'string' ? undefined : (data ?? undefined),
          timestamp: new Date().toISOString(),
          path: request.url,
        });

        return response;
      }),
    );
  }
}
