import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDTO {
  @ApiProperty({ description: 'ID của phiên xác thực cần gửi lại OTP', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  pendingVerificationId!: string;
}
