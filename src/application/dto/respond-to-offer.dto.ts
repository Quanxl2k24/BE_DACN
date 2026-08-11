import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OfferDecision {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export class RespondToOfferDTO {
  @ApiProperty({ enum: OfferDecision, description: 'Quyết định của ứng viên với lời mời', example: 'ACCEPTED' })
  @IsEnum(OfferDecision)
  decision!: OfferDecision;
}
