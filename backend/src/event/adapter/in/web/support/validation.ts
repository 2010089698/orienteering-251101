import { ValidationError } from 'class-validator';

export function mapValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }

    if (error.children && error.children.length > 0) {
      messages.push(...mapValidationErrors(error.children));
    }
  }

  return messages;
}

export default mapValidationErrors;
