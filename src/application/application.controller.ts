import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ApplicationService } from './application.service';
import { CreateApplicationDTO } from './dto/create-application.dto';
import { UpdateApplicationStatusDTO } from './dto/update-application-status.dto';
import { QueryApplicationsDTO } from './dto/query-applications.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('Application - Ứng tuyển')
@Controller('jobs')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) { }

  @Post(':id/apply')
  @UseGuards(AccessTokenGuard)
  @Roles('APPLICANT')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID tin tuyển dụng' })
  @ApiOperation({ summary: 'Nộp đơn ứng tuyển', description: 'Cho phép APPLICANT nộp CV vào một tin tuyển dụng (chỉ nộp 1 lần cho mỗi tin).' })
  apply(
    @Param('id') id: string,
    @Body() body: CreateApplicationDTO,
    @Req() req: Request,
  ) {
    return this.applicationService.apply(id, body, req.user!);
  }

  @Get('manage/:companyId/applications')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'companyId', description: 'ID công ty' })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái', enum: ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'] })
  @ApiOperation({ summary: 'Danh sách ứng viên', description: 'Xem danh sách ứng viên đã nộp đơn vào công ty (có quyền xem CV mới được).' })
  manage(
    @Param('companyId') companyId: string,
    @Query() query: QueryApplicationsDTO,
    @Req() req: Request,
  ) {
    return this.applicationService.getCompanyApplications(companyId, req.user!, query);
  }

  @Patch('manage/:companyId/applications/:applicationId/status')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'companyId', description: 'ID công ty' })
  @ApiParam({ name: 'applicationId', description: 'ID đơn ứng tuyển' })
  @ApiOperation({ summary: 'Cập nhật trạng thái ứng viên', description: 'Cập nhật trạng thái xử lý đơn ứng tuyển (phỏng vấn, từ chối, tuyển dụng...).' })
  updateStatus(
    @Param('companyId') companyId: string,
    @Param('applicationId') applicationId: string,
    @Body() body: UpdateApplicationStatusDTO,
    @Req() req: Request,
  ) {
    return this.applicationService.updateApplicationStatus(companyId, applicationId, body, req.user!);
  }
}
