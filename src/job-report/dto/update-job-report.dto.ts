import { IsEnum } from 'class-validator';
import { ReportStatus } from 'generated/prisma/client';

export class UpdateJobReportDTO {
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}
