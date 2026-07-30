import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterReqDTO, ResendOtpDTO, VerifyOtpDTO } from './dto/index';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { LoginReqDTO } from './dto/index';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Response } from 'express';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Info } from 'src/common/interfaces/info-token.interface';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Frontend và Backend luôn nằm khác domain (localhost:4000 <-> BE deploy,
   * hoặc vercel.app <-> onrender.com) -> request luôn là cross-site. Cookie
   * cross-site BẮT BUỘC `SameSite=None` kèm `Secure`, nếu không browser sẽ
   * không đính kèm cookie ở các request sau (dù vẫn set thành công lúc login).
   * Chỉ dùng `Lax` khi chạy local (FE và BE cùng "site" localhost, khác port).
   */
  private getCookieOptions(maxAge: number) {
    const isLocalDev = this.configService.get('IS_DEV') === 'true';
    return {
      httpOnly: true,
      secure: !isLocalDev,
      sameSite: (isLocalDev ? 'lax' : 'none') as 'lax' | 'none',
      maxAge,
      path: '/',
    };
  }
  async register(body: RegisterReqDTO) {
    try {
      const hashPassword = await argon.hash(body.password);
      const createUser = await this.prismaService.user.create({
        data: {
          id: crypto.randomUUID(),
          email: body.email,
          passwordHash: hashPassword,
          fullName: body.fullName,
          type: body.type,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
          type: true,
        },
      });

      return { data: createUser, message: 'Đăng ký thành công' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Người dùng đã tồn tại');
        }
      }
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async login(body: LoginReqDTO, res: Response, userAgent: string) {
    try {
      const existUser = await this.prismaService.user.findUnique({
        where: {
          email: body.email,
        },
      });
      if (!existUser)
        throw new BadRequestException('Email hoặc mật khẩu không đúng');
      const password = await argon.verify(
        existUser.passwordHash,
        body.password,
      );
      if (!password)
        throw new BadRequestException('Email hoặc mật khẩu không đúng');

      const { passwordHash, ...user } = existUser;
      const deviceId = crypto.randomUUID();
      res.cookie(
        'deviceId',
        deviceId,
        this.getCookieOptions(30 * 24 * 60 * 60 * 1000),
      );

      const activeSessions = await this.prismaService.userSession.findMany({
        where: {
          userId: existUser.id,
          isRevoked: false,
        },
      });

      const accessToken = await this.generateAccessToken(
        existUser.id,
        existUser.email,
        existUser.type,
      );
      const refreshToken = await this.generateAccessTokenRefreshToken(
        existUser.id,
        existUser.email,
        existUser.type,
      );
      const hashRefreshToken = await argon.hash(refreshToken);
      const lookupKey = createHash('sha256').update(refreshToken).digest('hex');

      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });

      res.cookie(
        'accessToken',
        accessToken,
        this.getCookieOptions(10 * 60 * 1000),
      );
      res.cookie(
        'refreshToken',
        refreshToken,
        this.getCookieOptions(30 * 24 * 60 * 60 * 1000),
      );

      if (activeSessions.length < 3) {
        await this.prismaService.userSession.create({
          data: {
            id: crypto.randomUUID(),
            userId: existUser.id,
            deviceId,
            userAgent,
            refreshToken: hashRefreshToken,
            lookupKey,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
        });

        return { data: { user }, message: 'Đăng nhập thành công' };
      }

      await this.prismaService.userSession.create({
        data: {
          id: crypto.randomUUID(),
          userId: existUser.id,
          deviceId,
          userAgent,
          refreshToken: hashRefreshToken,
          lookupKey,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isRevoked: true,
        },
      });

      const pendingVerificationId = crypto.randomUUID();
      const otp = Math.floor(10000 + Math.random() * 900000).toString();

      await this.redis.setex(
        `otp:${pendingVerificationId}`,
        300,
        JSON.stringify({
          otp,
          userId: user.id,
          deviceId,
        }),
      );

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Xác nhận thiết bị đăng nhập mới',
        html: `Mã OTP của bạn là: <b>${otp}</b>. Mã có hiệu lực trong 5 phút.`,
      });

      return {
        data: {
          pendingVerificationId,
          deviceId,
        },
        message: 'Cần xác nhận để đăng nhập',
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new InternalServerErrorException('Đã có lỗi xảy ra');
    }
  }

  async logout(user: Info, res: Response, refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Không tìm thấy refresh token');
    }

    const lookupKey = createHash('sha256').update(refreshToken).digest('hex');
    await this.prismaService.userSession.updateMany({
      where: { lookupKey, userId: user.sub, isRevoked: false },
      data: { isRevoked: true },
    });

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('deviceId', { path: '/' });

    return { message: 'Đăng xuất thành công' };
  }

  async refresh(user: Info, res: Response, refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }

    const lookupKey = createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.prismaService.userSession.findUnique({
      where: { lookupKey },
    });

    if (!session || session.userId !== user.sub) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    if (session.isRevoked) {
      throw new UnauthorizedException('Phiên đăng nhập đã bị thu hồi');
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    const verified = await argon.verify(session.refreshToken, refreshToken);
    if (!verified) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const newAccessToken = await this.generateAccessToken(
      user.sub,
      user.email,
      user.type,
    );
    const newRefreshToken = await this.generateAccessTokenRefreshToken(
      user.sub,
      user.email,
      user.type,
    );
    const hashNewRefreshToken = await argon.hash(newRefreshToken);
    const newLookupKey = createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await this.prismaService.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: hashNewRefreshToken,
        lookupKey: newLookupKey,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    res.cookie(
      'accessToken',
      newAccessToken,
      this.getCookieOptions(10 * 60 * 1000),
    );
    res.cookie(
      'refreshToken',
      newRefreshToken,
      this.getCookieOptions(30 * 24 * 60 * 60 * 1000),
    );

    return { message: 'Token đã được làm mới' };
  }

  async verifyOtp(body: VerifyOtpDTO, user: Info, res: Response) {
    const data = await this.redis.get(`otp:${body.pendingVerificationId}`);
    if (!data) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const { otp: storedOtp, userId: redisUserId, deviceId } = JSON.parse(data);
    if (storedOtp !== body.otp) {
      throw new BadRequestException('Sai mã OTP');
    }
    if (redisUserId !== user.sub) {
      throw new BadRequestException('OTP không khớp với tài khoản');
    }

    await this.redis.del(`otp:${body.pendingVerificationId}`);

    const currentSession = await this.prismaService.userSession.findFirst({
      where: { userId: user.sub, deviceId, isRevoked: true },
    });
    if (!currentSession) {
      throw new BadRequestException('Không tìm thấy phiên đăng nhập');
    }

    await this.prismaService.userSession.update({
      where: { id: currentSession.id },
      data: { isRevoked: false },
    });

    const oldestActive = await this.prismaService.userSession.findFirst({
      where: { userId: user.sub, isRevoked: false },
      orderBy: { createdAt: 'asc' },
    });
    if (oldestActive && oldestActive.id !== currentSession.id) {
      await this.prismaService.userSession.update({
        where: { id: oldestActive.id },
        data: { isRevoked: true },
      });
    }

    const accessToken = await this.generateAccessToken(
      user.sub,
      user.email,
      user.type,
    );
    res.cookie(
      'accessToken',
      accessToken,
      this.getCookieOptions(10 * 60 * 1000),
    );

    return {
      data: { user: { id: user.sub, email: user.email } },
      message: 'Xác thực thành công',
    };
  }

  async resendOtp(body: ResendOtpDTO, user: Info) {
    const storedOtp = await this.redis.get(`otp:${body.pendingVerificationId}`);
    if (!storedOtp) throw new BadRequestException('Đã hết phiên giao dịch');

    const data = JSON.parse(storedOtp);
    if (data.userId !== user.sub)
      throw new BadRequestException('Email không đúng');

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.setex(
      `otp:${body.pendingVerificationId}`,
      300,
      JSON.stringify({ ...data, otp: newOtp }),
    );

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Mã OTP mới - Xác nhận thiết bị',
      html: `Mã OTP mới của bạn là: <b>${newOtp}</b>.`,
    });
    return {
      message: 'Đã gửi lại OTP',
    };
  }

  async generateAccessToken(
    userId: string,
    email: string,
    type: string,
    expiresIn?: string,
  ) {
    const payload = {
      sub: userId,
      email,
      type,
    };

    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: this.configService.get('SECRET_ACCESS_KEY'),
    });
    return jwtString;
  }

  async generateAccessTokenRefreshToken(
    userId: string,
    email: string,
    type: string,
    expiresIn?: JwtSignOptions['expiresIn'],
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      type,
    };

    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn: expiresIn ?? '30d',
      secret: this.configService.get('SECRET_REFRESH_KEY'),
    });

    return jwtString;
  }
}
