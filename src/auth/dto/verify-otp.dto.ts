import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDTO {
  @ApiProperty({ description: 'ID của phiên xác thực', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  pendingVerificationId!: string;

  @ApiProperty({ description: 'Mã OTP được gửi qua email', example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp!: string;
}
