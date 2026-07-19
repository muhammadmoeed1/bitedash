import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ValidationError } from '../core/http-error';
import { validate } from './validate';

const schema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().positive(),
});

describe('validate', () => {
  it('returns the parsed data on success', () => {
    const result = validate(schema, { name: 'Ali', age: '30' });
    expect(result).toEqual({ name: 'Ali', age: 30 });
  });

  it('throws a ValidationError with field details on failure', () => {
    try {
      validate(schema, { name: '', age: -1 });
      expect.unreachable('validate should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const details = (err as ValidationError).details as { fieldErrors: Record<string, string[]> };
      expect(details.fieldErrors.name).toBeDefined();
      expect(details.fieldErrors.age).toBeDefined();
    }
  });
});
