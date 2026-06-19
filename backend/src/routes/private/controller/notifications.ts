import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../../lib/prisma';
import { ApiError }                             from '../../../utils/ApiError';
import { idSchema, parseOrThrow,
    parseQueryEnum, parseQueryInt }                            from '../../../validations/utils';
import { NotificationTypes, SortOptions }       from '../../../types/constants';
import { wsEmitter }                            from '../../../ws/backend/emitter';


//Estas rotas muito provavelmente não serão usadas — as notificações são criadas por eventos (ex: menção num comentário) e não por acção directa do user. Mas ficam aqui para eventuais necessidades futuras de CRUD manual de notificações (ex: para testes ou admin).

export async function getNotifications(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = req.user!.id;
        const skip = parseQueryInt('skip', req.query.skip, { default: 0, min: 0 });
        const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });
        const type = parseQueryEnum('type', req.query.type, NotificationTypes, { isOptional: true });
        const sort = parseQueryEnum('sort', req.query.sort, SortOptions, { isOptional: true });

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new ApiError(404, 'User not found');

        const where: any = { userId: id };
        if (type)
            where.type = type;
        const orderBy = { createdAt: sort === 'oldest' ? 'asc' : 'desc'	} as const;

        const notifications = await prisma.notification.findMany({
            where,
            orderBy,
            skip,
            take
        });

        const total = await prisma.notification.count({ where });

        res.json({ success: true, data: { notifications, pagination: { skip, take, total } } });
    } catch (err) { next(err); }
}

export async function markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction)
{
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
        if (!user)
            throw new ApiError(404, 'User not found');

        const updated = await prisma.notification.updateMany({ where: { userId: req.user?.id, isRead: false }, data: { isRead: true } });
        res.json({ success: true, data: { updatedCount: updated.count } });
    } catch (err) { next(err); }
}

export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'NotificationID', req.params.id);

        const notif = await prisma.notification.findUnique({ where: { id } });
        if (!notif)
            throw new ApiError(404, 'Notification not found');
        if (req.user!.id !== notif.userId)
            throw new ApiError(403, 'Not allowed');

        const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });

        wsEmitter.notificationRead(req.user!.id, notif.id); // Sincroniza outras abas do mesmo user
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

        wsEmitter.notificationDeleted(req.user!.id, notif.id); // Sincroniza outras abas do mesmo user
        res.json({ success: true, message: 'Notification deleted' });
    } catch (err) { next(err); }
}
