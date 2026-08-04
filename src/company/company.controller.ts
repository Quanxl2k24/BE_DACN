import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { CompanyService } from './company.service';
import { CreateCompanyDTO } from './dto/create-company.dto';
import { CreateRoleDTO } from './dto/create-role.dto';
import { CreateInvitationDTO } from './dto/create-invitation.dto';
import { UpdateRoleDTO } from './dto/update-role.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { UpdateCompanyDTO } from './dto/update-company.dto';

@ApiTags('Company - Công ty')
@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) { }

  @Post('create-company')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo công ty mới', description: 'Tạo công ty cho tài khoản RECRUITER. Người tạo sẽ được gán vai trò Owner.' })
  createCompany(@Body() body: CreateCompanyDTO, @Req() req: Request) {
    return this.companyService.createCompany(body, req.user!);
  }

  @Get('info')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thông tin công ty của tôi', description: 'Lấy danh sách các công ty mà người dùng hiện tại đang tham gia.' })
  infoCompany(@Req() req: Request) {
    return this.companyService.infoCompany(req.user!);
  }

  @Patch('update-company/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID công ty' })
  @ApiOperation({ summary: 'Cập nhật thông tin công ty', description: 'Cập nhật thông tin công ty. Chỉ Owner mới có quyền.' })
  updateCompany(
    @Param('id') id: string,
    @Body() body: UpdateCompanyDTO,
    @Req() req: Request,
  ) {
    return this.companyService.updateCompany(id, body, req.user!);
  }

  @Post(':companyId/roles')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'companyId', description: 'ID công ty' })
  @ApiOperation({ summary: 'Tạo vai trò mới', description: 'Tạo role tuỳ chỉnh cho công ty. Chỉ Owner mới có quyền.' })
  createRole(
    @Param('companyId') companyId: string,
    @Body() body: CreateRoleDTO,
    @Req() req: Request,
  ) {
    return this.companyService.createRole(companyId, body, req.user!);
  }

  @Get(':companyId/list-roles')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'companyId', description: 'ID công ty' })
  @ApiOperation({ summary: 'Danh sách vai trò', description: 'Lấy danh sách tất cả vai trò của công ty.' })
  listRoleOfCompany(@Param('companyId') companyId: string) {
    return this.companyService.listRoleOfCompany(companyId);
  }

  @Patch(':companyId/update-roles/:roleId')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'companyId', description: 'ID công ty' })
  @ApiParam({ name: 'roleId', description: 'ID vai trò' })
  @ApiOperation({ summary: 'Cập nhật vai trò', description: 'Cập nhật tên và quyền của vai trò. Chỉ Owner mới có quyền.' })
  updateRole(
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @Body() body: UpdateRoleDTO,
    @Req() req: Request,
  ) {
    return this.companyService.updateRole(companyId, roleId, body, req.user!);
  }

  @Delete(':companyId/delete-roles/:roleId')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'companyId', description: 'ID công ty' })
  @ApiParam({ name: 'roleId', description: 'ID vai trò' })
  @ApiOperation({ summary: 'Xoá vai trò', description: 'Xoá vai trò khỏi công ty. Chỉ Owner mới có quyền.' })
  deleteRole(
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @Req() req: Request,
  ) {
    return this.companyService.deleteRole(companyId, roleId, req.user!);
  }

  @Post(':companyId/invitations')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'companyId', description: 'ID công ty' })
  @ApiOperation({ summary: 'Mời nhân sự', description: 'Gửi lời mời tham gia công ty cho người dùng khác. Chỉ Owner mới có quyền.' })
  inviteUser(
    @Param('companyId') companyId: string,
    @Body() body: CreateInvitationDTO,
    @Req() req: Request,
  ) {
    return this.companyService.inviteUser(companyId, body, req.user!);
  }

  @Get(':companyId/get-member')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Roles('RECRUITER')
  getMember(@Param('companyId') companyId: string) {
    return this.companyService.getMember(companyId)
  }
}
