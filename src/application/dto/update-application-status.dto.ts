import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class UpdateApplicationStatusDTO {
  @ApiProperty({ enum: ApplicationStatus, description: 'Trạng thái mới', example: 'INTERVIEW' })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Ghi chú', example: 'Mời phỏng vấn vào ngày 20/12' })
  @IsOptional()
  @IsString()
  note?: string;
}
