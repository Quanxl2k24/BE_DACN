import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInvitationDTO {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
}
