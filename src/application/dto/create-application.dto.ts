import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDTO {
  @ApiProperty({ description: 'ID của CV (resume) đã tải lên', example: 'uuid' })
  @IsUUID()
  resumeId!: string;
}
