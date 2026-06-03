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

function validateQueryParam<T>( key: string, value: unknown, options: { default?: T, isOptional?: boolean } ): { value: unknown } | { early: T }
{
  if (value === undefined)
  {
    if (options.default !== undefined)
      return { early: options.default };
    if (options.isOptional)
      return { value: undefined };
    throw new ApiError(400, `Query parameter "${key}" is required`);
  }
  if (Array.isArray(value))
    throw new ApiError(400, `Query parameter "${key}" must be a single value, not an array`);
  return { value };
}

export function parseQueryInt( key: string, value: unknown, options: { default?: number; isOptional?: boolean, min?: number; max?: number } = {} ): number | undefined
{
  const check = validateQueryParam(key, value, options);
  if ('early' in check)
    return check.early;
  if (check.value === undefined)
    return check.value;

  const schema = z.coerce.number().int()
                  .refine((val: number) => !Number.isNaN(val), { message: `Query parameter "${key}" is not a valid integer` })
                  .min(options.min ?? -Infinity, { message: `Query parameter "${key}" must be >= ${options.min}` })
                  .max(options.max ?? Infinity, { message: `Query parameter "${key}" must be <= ${options.max}` });
  return parseOrThrow(schema, key, value);
}

export function parseQueryBool( key: string, value: unknown, options: { default?: boolean, isOptional?: boolean } = {} ): boolean | undefined
{
  const check = validateQueryParam(key, value, options);
  if ('early' in check)
    return check.early;
  if (check.value === undefined)
    return check.value;

  const schema = z.preprocess(
    (val: unknown) => {
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

export function parseQueryEnum<T extends string>( key: string, value: unknown, allowed: readonly [T, ...T[]], options: { default?: T, isOptional?: boolean } = {} ): T | undefined
{
  const check = validateQueryParam(key, value, options);
  if ('early' in check)
    return check.early;
  if (check.value === undefined)
    return check.value;

  const schema = z.enum(allowed, {message: `Query parameter "${key}" must be one of: ${allowed.join(', ')}`});
  return parseOrThrow(schema, key, value);
}

export function parseQueryString( key: string, value: unknown, options: { default?: string; minLength?: number; maxLength?: number; isOptional?: boolean } = {} ): string | undefined
{
  const check = validateQueryParam(key, value, options);
  if ('early' in check)
    return check.early;
  if (check.value === undefined)
    return check.value;

  const schema = z.string().trim()
    .min(options.minLength ?? 0, {message: `Query parameter "${key}" must contain at least ${options.minLength} characters`})
    .max(options.maxLength ?? Infinity, {message: `Query parameter "${key}" must contain at most ${options.maxLength} characters`});

  return parseOrThrow(schema, key, value);
}

export function parseQueryDate( key: string, value: unknown, options: { default?: Date; isOptional?: boolean } = {} ): Date | undefined
{
  const check = validateQueryParam(key, value, options);
  if ('early' in check)
    return check.early;
  if (check.value === undefined)
    return check.value;

  const schema = z.preprocess(
    (val: unknown) => {
      if (typeof val !== 'string' && !(val instanceof Date))
        return undefined;
      const parsed = new Date(val);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    },
    z.date({ message: `Query parameter "${key}" must be a valid date string` })
  );

  return parseOrThrow(schema, key, value);
}

export const requireRole = ( currentRole: string, allowedRoles: string[] ): void =>
{
	if (!allowedRoles.includes(currentRole))
		throw new ApiError( 403, `Required role: ${allowedRoles.join(' or ')}` );
};
