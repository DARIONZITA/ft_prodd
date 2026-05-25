import { ApiError } from './ApiError';

export const parseOrThrow = <T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ message: string }> } } }, value: unknown): T => {
    const result = schema.safeParse(value);

    if (!result.success)
        throw new ApiError(400, result.error?.issues.map((issue) => issue.message).join(', ') || 'Invalid input');

    return result.data as T;
};