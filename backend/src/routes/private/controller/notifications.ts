import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../../lib/prisma';
import { ApiError }                             from '../../../utils/ApiError';
import { parseOrThrow, idSchema }               from '../../../validations/utils';
import { createNotificationSchema }             from '../../../validations/notification';

export async function createNotification(req: Request, res: Response, next: NextFunction)
{
    try {
        const payload = parseOrThrow(createNotificationSchema, 'CreateNotification', req.body);

        const targetUserId = payload.userId ?? req.user!.id;
        if (targetUserId !== req.user!.id)
            throw new ApiError(403, 'Not allowed');

        const created = await prisma.notification.create({
            data: {
                userId: targetUserId,
                message: payload.message,
                type: payload.type,
                relatedTaskId: payload.relatedTaskId,
                relatedWorkspaceId: payload.relatedWorkspaceId
            }
        });

        res.status(201).json({ success: true, data: created });
    } catch (err) { next(err); }
}

export async function getNotification(req: Request, res: Response, next: NextFunction)
{
    try {
        const notificationId = parseOrThrow(idSchema, 'NotificationID', req.params.id);

        const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notification)
            throw new ApiError(404, 'Notification not found');
        if (req.user!.id !== notification.userId)
            throw new ApiError(403, 'Not allowed');

        res.json({ success: true, data: notification });
    } catch (err) { next(err); }
}

export async function updateNotification(req: Request, res: Response, next: NextFunction)
{
    try {
        const notificationId = parseOrThrow(idSchema, 'NotificationID', req.params.id);

        const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notif)
            throw new ApiError(404, 'Notification not found');
        if (req.user!.id !== notif.userId)
            throw new ApiError(403, 'Not allowed');

        const updated = await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });

        res.json({ success: true, data: updated });
    } catch (err) { next(err); }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
        const notificationId = parseOrThrow(idSchema, 'NotificationID', req.params.id);

        const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notif)
            throw new ApiError(404, 'Notification not found');
        if (req.user!.id !== notif.userId)
            throw new ApiError(403, 'Not allowed');

        await prisma.notification.delete({ where: { id: notificationId } });

        res.json({ success: true, message: 'Notification deleted' });
    } catch (err) { next(err); }
}
