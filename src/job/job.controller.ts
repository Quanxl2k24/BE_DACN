import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CreateJobDTO } from './dto/create-job.dto';
import { UpdateJobDTO } from './dto/update-job.dto';
import { QueryJobsDTO } from './dto/query-jobs.dto';
import { JobService } from './job.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('Job - Tin tuyển dụng')
@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) { }

  @Get('jobdetail/:id')
  @ApiParam({ name: 'id', description: 'ID tin tuyển dụng' })
  @ApiOperation({ summary: 'Chi tiết tin tuyển dụng (public)', description: 'Lấy thông tin chi tiết của một tin tuyển dụng đang mở.' })
  getDetail(@Param('id') id: string) {
    return this.jobService.getJobDetail(id);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tin tuyển dụng (public)', description: 'Lấy danh sách tin tuyển dụng đang mở, hỗ trợ tìm kiếm và phân trang.' })
  findAll(@Query() query: QueryJobsDTO) {
    return this.jobService.findActiveJobs(query);
  }

  @Get('recruiter/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID tin tuyển dụng' })
  @ApiOperation({ summary: 'Chi tiết tin cho nhà tuyển dụng', description: 'Xem chi tiết tin tuyển dụng kèm thông tin người tạo và số lượng ứng viên.' })
  recruiterDetail(@Param('id') id: string, @Req() req: Request) {
    return this.jobService.getRecruiterJobDetail(id, req.user!);
  }

  @Get('manage/:companyId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'companyId', description: 'ID công ty' })
  @ApiOperation({ summary: 'Quản lý tin tuyển dụng', description: 'Lấy danh sách tin tuyển dụng của công ty (có quyền xem mới được).' })
  manage(
    @Req() req: Request,
    @Param('companyId') companyId: string,
    @Query() query: QueryJobsDTO,
  ) {
    return this.jobService.getCompanyJobs(companyId, req.user!, query);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo tin tuyển dụng', description: 'Tạo tin tuyển dụng mới cho công ty.' })
  create(@Body() body: CreateJobDTO, @Req() req: Request) {
    return this.jobService.createJob(body, req.user!);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID tin tuyển dụng' })
  @ApiOperation({ summary: 'Cập nhật tin tuyển dụng', description: 'Cập nhật thông tin tin tuyển dụng.' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateJobDTO,
    @Req() req: Request,
  ) {
    return this.jobService.updateJob(id, body, req.user!);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID tin tuyển dụng' })
  @ApiOperation({ summary: 'Xoá tin tuyển dụng', description: 'Xoá mềm tin tuyển dụng (soft delete).' })
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.jobService.deleteJob(id, req.user!);
  }
}
