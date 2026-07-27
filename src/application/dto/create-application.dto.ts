import { IsUUID } from 'class-validator';

export class CreateApplicationDTO {
  @IsUUID()
  resumeId!: string;
}
