import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobReportDTO {
  @ApiProperty({ description: 'ID tin tuyển dụng bị báo cáo', example: 'uuid' })
  @IsUUID()
  jobId!: string;

  @ApiProperty({ description: 'Lý do báo cáo', example: 'Tin đăng có nội dung không phù hợp' })
  @IsString()
  reason!: string;
}
