import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginReqDTO,
  RegisterReqDTO,
  ResendOtpDTO,
  VerifyOtpDTO,
} from './dto/index';
import { RefreshTokenGuard } from './guard/refresh-token.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';

@ApiTags('Auth - Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới', description: 'Tạo tài khoản APPLICANT hoặc RECRUITER. Sau đó cần xác thực OTP.' })
  register(@Body() body: RegisterReqDTO) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập', description: 'Đăng nhập bằng email và mật khẩu. AccessToken và RefreshToken được set trong cookie.' })
  login(
    @Body() body: LoginReqDTO,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.login(body, res, req.headers['user-agent'] ?? '');
  }

  @Post('logout')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Đăng xuất', description: 'Xoá refresh token khỏi database và clear cookie.' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refreshToken'];
    return this.authService.logout(req.user!, res, refreshToken);
  }

  @Post('verify-otp')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Xác thực OTP', description: 'Xác thực mã OTP để kích hoạt tài khoản sau khi đăng ký.' })
  verifyOtp(
    @Body() body: VerifyOtpDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyOtp(body, req.user!, res);
  }

  @Post('resend-otp')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Gửi lại OTP', description: 'Gửi lại mã OTP mới qua email nếu OTP cũ hết hạn.' })
  resendOtp(@Body() body: ResendOtpDTO, @Req() req: Request) {
    return this.authService.resendOtp(body, req.user!);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Làm mới token', description: 'Dùng refresh token để lấy access token mới.' })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refreshToken'];
    return this.authService.refresh(req.user!, res, refreshToken);
  }
}
