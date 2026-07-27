import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApplicationStatus } from 'generated/prisma/client';

export class QueryApplicationsDTO {
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  applicantName?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  take?: string;
}
