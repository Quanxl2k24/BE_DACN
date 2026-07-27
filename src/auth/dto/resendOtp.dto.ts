import { IsNotEmpty, IsString } from 'class-validator';

export class ResendOtpDTO {
  @IsString()
  @IsNotEmpty()
  pendingVerificationId!: string;
}
