import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum InterviewResultInput {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export class UpdateInterviewResultDTO {
  @ApiProperty({ enum: InterviewResultInput, description: 'Kết quả phỏng vấn', example: 'PASSED' })
  @IsEnum(InterviewResultInput)
  result!: InterviewResultInput;
}
