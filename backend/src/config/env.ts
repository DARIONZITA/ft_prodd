import { z } from 'zod';

const envSchema = z.object({

  PORT: z
    .string()
    .default('3000')
    .refine( ( val ) => !isNaN( Number(val) ), { message: 'PORT must be a valid number' } )
    .transform( ( val ) => Number( val ) ),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),

  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),

  INTRA_42_CLIENT_ID: z.string().nonempty('INTRA_42_CLIENT_ID is required'),

  INTRA_42_CLIENT_SECRET: z.string().nonempty('INTRA_42_CLIENT_SECRET is required'),

  INTRA_42_CALLBACK_URL: z.string().url('INTRA_42_CALLBACK_URL must be a valid URL').nonempty('INTRA_42_CALLBACK_URL is required'),

  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').nonempty('FRONTEND_URL is required'),

});

export const	env = envSchema.parse(process.env);
