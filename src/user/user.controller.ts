import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { UpdateUserReqDTO } from './dto/index';

@ApiTags('User - Người dùng')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin cá nhân', description: 'Trả về thông tin của người dùng hiện tại (email, tên, loại tài khoản).' })
  getUser(@Req() req: Request) {
    return this.userService.getProfile(req.user!);
  }

  @Patch('update-user')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân', description: 'Cập nhật họ tên hoặc số điện thoại.' })
  updateUser(@Body() body: UpdateUserReqDTO, @Req() req: Request) {
    return this.userService.updateUser(body, req.user!);
  }
}
