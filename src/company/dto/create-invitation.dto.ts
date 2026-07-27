import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationDTO {
  @ApiProperty({ description: 'Email người được mời', example: 'invited@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'ID vai trò sẽ gán cho người được mời', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
}
