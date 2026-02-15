import { IsBoolean } from 'class-validator';

export class DeleteUserDto {
  @IsBoolean({ message: 'confirmed deve ser um valor booleano (true ou false)' })
  confirmed: boolean;
}
