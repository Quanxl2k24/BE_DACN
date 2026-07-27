import { IsString, IsUUID } from 'class-validator';

export class CreateJobReportDTO {
  @IsUUID()
  jobId!: string;

  @IsString()
  reason!: string;
}
