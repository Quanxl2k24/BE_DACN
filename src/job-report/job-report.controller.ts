import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JobReportService } from './job-report.service';
import { CreateJobReportDTO } from './dto/create-job-report.dto';
import { UpdateJobReportDTO } from './dto/update-job-report.dto';
import type { Request } from 'express';

@Controller('job-reports')
export class JobReportController {
  constructor(private jobReportService: JobReportService) { }

  @Post()
  @UseGuards(AccessTokenGuard)
  create(@Body() body: CreateJobReportDTO, @Req() req: Request) {
    return this.jobReportService.create(body, req.user!);
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  // @Roles('ADMIN')
  findAll(@Req() req: Request, @Query('cursor') cursor?: string, @Query('take') take?: string) {
    return this.jobReportService.findAll(req.user!, cursor, take ? +take : undefined);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  // @Roles('ADMIN')
  update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateJobReportDTO) {
    return this.jobReportService.update(req.user!, id, body);
  }
}
