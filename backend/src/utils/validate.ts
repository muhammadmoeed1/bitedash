import { z } from 'zod';
import { ValidationError } from '../core/http-error';

export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ValidationError(result.error.flatten());
  return result.data;
}
