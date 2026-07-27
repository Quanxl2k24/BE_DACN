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
import { CreateCompanyDTO } from './dto/create-company.sto';
import { CreateRoleDTO } from './dto/create-role.dto';
import { CreateInvitationDTO } from './dto/create-invitation.dto';
import { UpdateRoleDTO } from './dto/update-role.dto';
import type { Request } from 'express';
import { UpdateCompanyDTO } from './dto/update-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}
  // ---------- Company ------------
  @Post('create-company')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  createCompany(@Body() body: CreateCompanyDTO, @Req() req: Request) {
    return this.companyService.createCompany(body, req.user!);
  }

  @Get('info')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  infoCompany(@Req() req: Request) {
    return this.companyService.infoCompany(req.user!);
  }

  @Patch('update-company/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  updateCompany(
    @Param('id') id: string,
    @Body() body: UpdateCompanyDTO,
    @Req() req: Request,
  ) {
    return this.companyService.updateCompany(id, body, req.user!);
  }

  // -------------- role --------------
  //tao role
  @Post(':companyId/roles')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  createRole(
    @Param('companyId') companyId: string,
    @Body() body: CreateRoleDTO,
    @Req() req: Request,
  ) {
    return this.companyService.createRole(companyId, body, req.user!);
  }

  //lay role theo cong ty
  @Get(':companyId/list-roles')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  listRoleOfCompany(@Param('companyId') companyId: string) {
    return this.companyService.listRoleOfCompany(companyId);
  }

  //update-role
  @Patch(':companyId/update-roles/:roleId')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  updateRole(
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @Body() body: UpdateRoleDTO,
    @Req() req: Request,
  ) {
    return this.companyService.updateRole(companyId, roleId, body, req.user!);
  }

  //xoa role
  @Delete(':companyId/delete-roles/:roleId')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  deleteRole(
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @Req() req: Request,
  ) {
    return this.companyService.deleteRole(companyId, roleId, req.user!);
  }

  // ------------- invitation ------------
  @Post(':companyId/invitations')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  inviteUser(
    @Param('companyId') companyId: string,
    @Body() body: CreateInvitationDTO,
    @Req() req: Request,
  ) {
    return this.companyService.inviteUser(companyId, body, req.user!);
  }
}
