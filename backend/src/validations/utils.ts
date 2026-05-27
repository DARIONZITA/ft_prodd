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

function validateQueryParam<T>( key: string, value: unknown, options: { default?: T } ): { value: unknown } | { early: T }
{
  if (value === undefined)
  {
    if (options.default === undefined)
      throw new ApiError(400, `Query parameter "${key}" is required`);
    return { early: options.default };
  }
  if (Array.isArray(value))
    throw new ApiError(400, `Query parameter "${key}" must be a single value, not an array`);
  return { value };
}

export function parseQueryInt( key: string, value: unknown, options: { default?: number; min?: number; max?: number } = {} ): number
{
  const check = validateQueryParam(key, value, options);
  if ('early' in check)
    return check.early;

  const schema = z.coerce.number().int()
                  .refine((val: number) => !Number.isNaN(val), { message: `Query parameter "${key}" is not a valid integer` })
                  .min(options.min ?? -Infinity, { message: `Query parameter "${key}" must be >= ${options.min}` })
                  .max(options.max ?? Infinity, { message: `Query parameter "${key}" must be <= ${options.max}` });
  return parseOrThrow(schema, key, value);
}

export function parseQueryBool( key: string, value: unknown, options: { default?: boolean } = {} ): boolean
{
  const check = validateQueryParam(key, value, options);
  if ('early' in check)
    return check.early;

  const schema = z.preprocess(
    (val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }
      return undefined;
    },
    z.boolean({ message: `Query parameter "${key}" must be a boolean (true/false)` })
  );
  return parseOrThrow(schema, key, value);
}

export function parseQueryEnum<T extends string>( key: string, value: unknown, allowed: readonly [T, ...T[]], options: { default?: T } = {} ): T
{
  const check = validateQueryParam(key, value, options);
  if ('early' in check)
    return check.early;

  const schema = z.enum(allowed, {message: `Query parameter "${key}" must be one of: ${allowed.join(', ')}`});
  return parseOrThrow(schema, key, check.value);
}

export const requireRole = ( currentRole: string, allowedRoles: string[] ): void =>
{
	if (!allowedRoles.includes(currentRole))
		throw new ApiError( 403, `Required role: ${allowedRoles.join(' or ')}` );
};
