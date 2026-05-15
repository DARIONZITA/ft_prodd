import { z } from 'zod';
import { ApiError } from "../utils/ApiError";

export const idSchema = z.coerce.number().int().positive();

export function parseOrThrow<T extends z.ZodTypeAny>( schema: T, key: string, value: unknown ): z.infer<T>
{
  const result = schema.safeParse(value);

  if (!result.success)
    throw new ApiError( 400, result.error.issues[0]?.message || `Invalid input for parameter "${key}"` );
  return result.data;
}

export function parseQueryInt( key: string, value: unknown, options: { default?: number; min?: number; max?: number } = {} ): number
{
  if (value === undefined)
  {
    if (options.default === undefined)
      throw new ApiError(400, `Query parameter "${key}" is required`);
    return options.default;
  }
  if (Array.isArray(value))
    throw new ApiError(400, `Query parameter "${key}" must be a single value, not an array`);

  const schema = z.coerce.number().int()
                  .refine((val: number) => !Number.isNaN(val), { message: `Query parameter "${key}" is not a valid integer` })
                  .min(options.min ?? -Infinity, { message: `Query parameter "${key}" must be >= ${options.min}` })
                  .max(options.max ?? Infinity, { message: `Query parameter "${key}" must be <= ${options.max}` });
  return parseOrThrow(schema, key, value);
}

export const requireRole = ( currentRole: string, allowedRoles: string[] ): void =>
{
	if (!allowedRoles.includes(currentRole))
		throw new ApiError( 403, `Required role: ${allowedRoles.join(' or ')}` );
};
