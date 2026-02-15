import { IsNotEmpty, IsOptional, IsString, IsArray, MaxLength, IsEmail, ArrayNotEmpty } from 'class-validator';

export class CreateCollaborativeProjectDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true, message: 'Each memberEmail must be a valid email address' })
  memberEmails?: string[];
}
