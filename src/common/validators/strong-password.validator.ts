import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

/**
 * Valida se a password é forte o suficiente
 * Requirements:
 * - Mínimo 12 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 carácter especial (!@#$%^&*)
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class StrongPasswordValidator implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!password) return false;

    // Mínimo 12 caracteres
    if (password.length < 12) return false;

    // Pelo menos 1 letra maiúscula
    if (!/[A-Z]/.test(password)) return false;

    // Pelo menos 1 letra minúscula
    if (!/[a-z]/.test(password)) return false;

    // Pelo menos 1 número
    if (!/[0-9]/.test(password)) return false;

    // Pelo menos 1 carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `A password deve ter:
    - Mínimo 12 caracteres
    - Pelo menos 1 letra maiúscula (A-Z)
    - Pelo menos 1 letra minúscula (a-z)
    - Pelo menos 1 número (0-9)
    - Pelo menos 1 carácter especial (!@#$%^&* etc)`;
  }
}

/**
 * Decorator para validar password forte
 */
export function IsStrongPassword(
  validationOptions?: ValidationOptions,
) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: StrongPasswordValidator,
    });
  };
}
