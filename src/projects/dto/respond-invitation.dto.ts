import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { InvitationStatus } from '@prisma/client';

export class RespondInvitationDto {
  @IsNotEmpty()
  @IsString()
  invitationId: string;

  @IsNotEmpty()
  @IsEnum(InvitationStatus)
  status: InvitationStatus;
}
