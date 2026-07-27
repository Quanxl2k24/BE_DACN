import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { UserService } from './user.service';
import type { Request } from 'express';
import { UpdateUserReqDTO } from './dto/index';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  getUser(@Req() req: Request) {
    return this.userService.getProfile(req.user!);
  }

  @Patch('update-user')
  @UseGuards(AccessTokenGuard)
  updateUser(@Body() body: UpdateUserReqDTO, @Req() req: Request) {
    return this.userService.updateUser(body, req.user!);
  }
}
