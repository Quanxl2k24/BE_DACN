import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';

export class UpdateJobReportDTO {
  @ApiProperty({ enum: ReportStatus, description: 'Trạng thái xử lý báo cáo', example: 'RESOLVED' })
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}
