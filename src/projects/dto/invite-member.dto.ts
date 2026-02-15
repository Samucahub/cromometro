import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class InviteMemberDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsEnum(ProjectRole)
  role: ProjectRole = ProjectRole.EDITOR;
}
