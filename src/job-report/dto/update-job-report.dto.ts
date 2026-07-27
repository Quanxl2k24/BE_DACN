import { IsEnum } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class UpdateJobReportDTO {
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}
