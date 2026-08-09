import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ApplicationService } from './application.service';
import { CreateApplicationDTO } from './dto/create-application.dto';
import { UpdateApplicationStatusDTO } from './dto/update-application-status.dto';
import { QueryApplicationsDTO } from './dto/query-applications.dto';
import { QueryMyApplicationsDTO } from './dto/query-my-applications.dto';
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

  @Get('applications/me')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('APPLICANT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Việc đã ứng tuyển', description: 'Xem danh sách các công việc mà bản thân đã ứng tuyển, phân trang theo cursor.' })
  getMyApplications(@Query() query: QueryMyApplicationsDTO, @Req() req: Request) {
    return this.applicationService.getMyApplications(req.user!, query);
  }

  @Get(':id/application-status')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('APPLICANT')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID tin tuyển dụng' })
  @ApiOperation({
    summary: 'Trạng thái ứng tuyển của một công việc',
    description: 'Xem tiến trình các trạng thái ứng tuyển (Đã ứng tuyển, Đang xem xét, Mời phỏng vấn, Đạt phỏng vấn, Offer, Ứng tuyển thành công) kèm ghi chú cho công việc đã ứng tuyển.',
  })
  getApplicationStatus(@Param('id') id: string, @Req() req: Request) {
    return this.applicationService.getApplicationStatusTimeline(id, req.user!);
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
