import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginReqDTO,
  RegisterReqDTO,
  ResendOtpDTO,
  VerifyOtpDTO,
} from './dto/index';
import { RefreshTokenGuard } from './guard/refresh-token.guard';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterReqDTO) {
    return this.authService.register(body);
  }

  @Post('login')
  login(
    @Body() body: LoginReqDTO,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.login(body, res, req.headers['user-agent'] ?? '');
  }

  @Post('logout')
  @UseGuards(RefreshTokenGuard)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refreshToken'];
    return this.authService.logout(req.user!, res, refreshToken);
  }

  @Post('verify-otp')
  @UseGuards(RefreshTokenGuard)
  verifyOtp(
    @Body() body: VerifyOtpDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyOtp(body, req.user!, res);
  }

  @Post('resend-otp')
  @UseGuards(RefreshTokenGuard)
  resendOtp(@Body() body: ResendOtpDTO, @Req() req: Request) {
    return this.authService.resendOtp(body, req.user!);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refreshToken'];
    return this.authService.refresh(req.user!, res, refreshToken);
  }
}
