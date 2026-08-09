import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewMode } from '@prisma/client';

export class CreateInterviewDTO {
  @ApiProperty({ description: 'Mã ứng viên (userId)', example: 'uuid' })
  @IsUUID()
  candidateId!: string;

  @ApiProperty({ description: 'Mã tin tuyển dụng', example: 'uuid' })
  @IsUUID()
  jobId!: string;

  @ApiProperty({ enum: InterviewMode, description: 'Hình thức phỏng vấn', example: 'ONLINE' })
  @IsEnum(InterviewMode)
  mode!: InterviewMode;

  @ApiProperty({ description: 'Địa điểm (offline) hoặc link phỏng vấn (online)', example: 'https://meet.google.com/abc-defg-hij' })
  @IsString()
  @MinLength(1)
  location!: string;

  @ApiProperty({ description: 'Mã người phỏng vấn (phải thuộc công ty và có quyền phỏng vấn)', example: 'uuid' })
  @IsUUID()
  interviewerId!: string;

  @ApiProperty({ description: 'Thời gian phỏng vấn (ISO 8601)', example: '2026-08-15T09:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ description: 'Ghi chú', example: 'Phỏng vấn vòng kỹ thuật' })
  @IsOptional()
  @IsString()
  note?: string;
}
