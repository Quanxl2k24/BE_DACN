import { ApiResponseDto } from '../dto/api-res.dto';

export class ResponseHelper {
  static success<T>(data?: T, message = 'Success', statusCode = 200) {
    return new ApiResponseDto({ success: true, statusCode, message, data });
  }

  static created<T>(data?: T, message = 'Created') {
    return ResponseHelper.success(data, message, 201);
  }

  static noContent(message = 'No Content') {
    return ResponseHelper.success(undefined, message, 204);
  }
}
