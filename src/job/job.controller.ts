import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CreateJobDTO } from './dto/create-job.dto';
import { UpdateJobDTO } from './dto/update-job.dto';
import { QueryJobsDTO } from './dto/query-jobs.dto';
import { JobService } from './job.service';
import type { Request } from 'express';

@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) { }

  // ung vien
  @Get('jobdetail/:id')
  getDetail(@Param('id') id: string) {
    return this.jobService.getJobDetail(id);
  }

  @Get()
  findAll(@Query() query: QueryJobsDTO) {
    return this.jobService.findActiveJobs(query);
  }

  // nha tuyen dung - chi tiet
  @Get('recruiter/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  recruiterDetail(@Param('id') id: string, @Req() req: Request) {
    return this.jobService.getRecruiterJobDetail(id, req.user!);
  }

  // quan ly
  @Get('manage/:companyId')
  @UseGuards(AccessTokenGuard)
  manage(
    @Req() req: Request,
    @Param('companyId') companyId: string,
    @Query() query: QueryJobsDTO,
  ) {
    return this.jobService.getCompanyJobs(companyId, req.user!, query);
  }

  //nha tuyen dung
  @Post()
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
  create(@Body() body: CreateJobDTO, @Req() req: Request) {
    return this.jobService.createJob(body, req.user!);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  @Roles('RECRUITER')
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
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.jobService.deleteJob(id, req.user!);
  }
}
