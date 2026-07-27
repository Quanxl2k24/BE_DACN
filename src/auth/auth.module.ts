import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokenGuard } from './guard/refresh-token.guard';
import { AccessTokenGuard } from './guard/access-token.guard';
import { RolesGuard } from './guard/roles.guard';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, RefreshTokenGuard, AccessTokenGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AccessTokenGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
