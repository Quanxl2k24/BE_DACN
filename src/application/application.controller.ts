import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ApplicationService } from './application.service';
import { CreateApplicationDTO } from './dto/create-application.dto';
import { UpdateApplicationStatusDTO } from './dto/update-application-status.dto';
import { QueryApplicationsDTO } from './dto/query-applications.dto';
import type { Request } from 'express';

@Controller('jobs')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) { }

  // ung vien nop cv
  @Post(':id/apply')
  @UseGuards(AccessTokenGuard)
  @Roles('APPLICANT')
  apply(
    @Param('id') id: string,
    @Body() body: CreateApplicationDTO,
    @Req() req: Request,
  ) {
    return this.applicationService.apply(id, body, req.user!);
  }

  // nha tuyen dung xem danh sach ung vien
  @Get('manage/:companyId/applications')
  @UseGuards(AccessTokenGuard)
  manage(
    @Param('companyId') companyId: string,
    @Query() query: QueryApplicationsDTO,
    @Req() req: Request,
  ) {
    return this.applicationService.getCompanyApplications(companyId, req.user!, query);
  }

  // nha tuyen dung cap nhat trang thai ung vien
  @Patch('manage/:companyId/applications/:applicationId/status')
  @UseGuards(AccessTokenGuard)
  updateStatus(
    @Param('companyId') companyId: string,
    @Param('applicationId') applicationId: string,
    @Body() body: UpdateApplicationStatusDTO,
    @Req() req: Request,
  ) {
    return this.applicationService.updateApplicationStatus(companyId, applicationId, body, req.user!);
  }
}
