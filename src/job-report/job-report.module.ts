import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { JobReportController } from './job-report.controller';
import { JobReportService } from './job-report.service';

@Module({
  imports: [AuthModule],
  controllers: [JobReportController],
  providers: [JobReportService],
})
export class JobReportModule {}
