import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { InvitationStatus } from '@prisma/client';

export class RespondLeadershipTransferDto {
  @IsNotEmpty()
  @IsString()
  transferId: string;

  @IsNotEmpty()
  @IsEnum(InvitationStatus)
  status: InvitationStatus;
}
