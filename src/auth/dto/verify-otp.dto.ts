import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyOtpDTO {
  @IsUUID()
  @IsNotEmpty()
  pendingVerificationId!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}
