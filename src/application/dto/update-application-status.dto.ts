import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from 'generated/prisma/client';

export class UpdateApplicationStatusDTO {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
