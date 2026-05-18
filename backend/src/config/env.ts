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
});


export const	env = envSchema.parse(process.env);
