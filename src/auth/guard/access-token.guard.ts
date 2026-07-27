import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = request.cookies?.['accessToken'];
    if (!accessToken) {
      throw new UnauthorizedException('Không tìm thấy accessToken');
    }
    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.get('SECRET_ACCESS_KEY'),
      });
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        'Access token không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
