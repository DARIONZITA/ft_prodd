import { z } from 'zod';

export const envSchema = z.object(
{
  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),

  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),

  INTRA_42_CLIENT_ID: z.string().nonempty('INTRA_42_CLIENT_ID is required'),

  INTRA_42_CLIENT_SECRET: z.string().nonempty('INTRA_42_CLIENT_SECRET is required'),

  INTRA_42_CALLBACK_URL: z.string().url('INTRA_42_CALLBACK_URL must be a valid URL').nonempty('INTRA_42_CALLBACK_URL is required'),

  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').nonempty('FRONTEND_URL is required'),

  BACKEND_URL: z.string().url('BACKEND_URL must be a valid URL').nonempty('BACKEND_URL is required'),

}).transform((env) => {
  const backendUrl = new URL(env.BACKEND_URL);

  if (!backendUrl.port)
    throw new Error('BACKEND_URL must include an explicit port');

  return {
    ...env,
    PORT: Number(backendUrl.port),
  };
});

const	result = envSchema.safeParse(process.env);

if (!result.success)
{
  console.error('Environment variable validation failed:', result.error.format());
  process.exit(1);
}

export type   Env = z.infer<typeof envSchema>;
export const	env : Env = result.data;
