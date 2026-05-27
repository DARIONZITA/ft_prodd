import { z }                from 'zod';
import { idSchema }         from './utils';
import { NotificationType } from '../types/enums';

export const createNotificationSchema = z.object({
    userId: idSchema,
    message: z.string().trim().min(1).max(500),
    type: z.enum(NotificationType),
    relatedTaskId: idSchema.optional(),
    relatedWorkspaceId: idSchema.optional()
});
