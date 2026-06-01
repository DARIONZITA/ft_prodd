import type { Request, Response, NextFunction }     	from 'express';
import { prisma }										from '../../../lib/prisma';
import { ApiError }										from '../../../utils/ApiError';
import { NotificationType, FriendRequestStatus }		from '../../../types/constants';
import { idSchema, parseOrThrow, parseQueryInt,
	parseQueryBool, parseQueryEnum, parseQueryString }	from '../../../validations/utils';
import { updateUserProfileSchema }						from '../../../validations/user';

export async function   listUsers( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const	skip = parseQueryInt('skip', req.query.skip, { default: 0, min: 0 });
		const	take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });
		let		email;
		let		username;

		if (typeof req.query.search === 'string')
		{
			email = req.query.search.includes('@') ? req.query.search : undefined;
			username = !email ? req.query.search : undefined;
		}
		const users = await prisma.user.findMany(
		{
			where: { email, username },
			select: {
				id: true,
				username: true,
				bio: true,
				email: true,
				avatarUrl: true,
				fortyTwoId: true,
				createdAt: true,
				updatedAt: true
			},
			skip,
			take,
			orderBy: { createdAt: 'desc' }
		});

		const total = await prisma.user.count();

		res.json({
			success: true,
			data: {
                users,
			    pagination: { skip, take, total }
			}
		});
    }
    catch (err) { next(err); }
}

export async function   getUserProfile( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);

		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				username: true,
				email: true,
				bio: true,
				avatarUrl: true,
				createdAt: true,
				updatedAt: true
			}
		});
		if (!user)
			return (next( new ApiError(404, 'User not found') ));

		res.json({
			success: true,
			data: user
		});
	}
    catch (err) { next(err); }
}

export async function   updateUserProfile( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);

		if (req.user!.id !== id)
			return (next(new ApiError(403, 'You can only update your own profile')));

		const updateData = parseOrThrow(updateUserProfileSchema, 'UpdateUserProfile', req.body);

		const updateFields: any = {};
		if (updateData.username !== undefined)
			updateFields.username = updateData.username;
		if (updateData.bio !== undefined)
			updateFields.bio = updateData.bio;

		const updatedUser = await prisma.user.update({
			where: { id },
			data: updateFields,
			select: {
				id: true,
				username: true,
				bio: true,
				avatarUrl: true,
				createdAt: true,
				updatedAt: true
			}
		});

		res.json({
			success: true,
			message: 'User profile updated successfully',
			data: updatedUser
		});
	}
    catch (err) { next(err); }
}

export async function   deleteUserAccount( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);

		if (req.user!.id !== id)
			throw new ApiError(403, 'You can only delete your own account');

		const user = await prisma.user.findUnique({ where: { id } });

        if (!user)
			throw new ApiError(404, 'User not found');

		await prisma.user.delete({ where: { id } });

		res.json({
			success: true,
			message: 'User account deleted successfully'
		});
	}
    catch (err) { next(err); }
}



/* USER-NOTIFICATIONS */
export async function getUserNotifications(req: Request, res: Response, next: NextFunction)
{
	try {
		const userId = parseOrThrow(idSchema, 'UserID', req.params.id);
		const skip = parseQueryInt('skip', req.query.skip, { default: 0, min: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });
		const isRead = parseQueryBool('isRead', req.query.isRead, { isOptional: true });
		const type = parseQueryEnum('type', req.query.type, NotificationType, { isOptional: true });
		const relatedTaskId = parseQueryInt('relatedTaskId', req.query.relatedTaskId, { min: 1, isOptional: true });
		const relatedWorkspaceId =parseQueryInt('relatedWorkspaceId', req.query.relatedWorkspaceId, { min: 1, isOptional: true });

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user)
			throw new ApiError(404, 'User not found');

		const where: any = { userId };
		if (type) where.type = type;
		if (isRead !== undefined) where.isRead = isRead;
		if (relatedTaskId) where.relatedTaskId = relatedTaskId;
		if (relatedWorkspaceId) where.relatedWorkspaceId = relatedWorkspaceId;

		const notifications = await prisma.notification.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip,
			take
		});

		const total = await prisma.notification.count({ where });

		res.json({ success: true, data: { notifications, pagination: { skip, take, total } } });
	} catch (err) { next(err); }
}

export async function markAllUserNotificationsRead(req: Request, res: Response, next: NextFunction) {
	try {
		const userId = parseOrThrow(idSchema, 'UserID', req.params.id);
		if (req.user!.id !== userId)
			throw new ApiError(403, 'Not allowed');

		const updated = await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });

		res.json({ success: true, data: { updatedCount: updated.count } });
	} catch (err) { next(err); }
}



/* USER-FRIENDS */
export async function	getUserFriends(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'UserID', req.params.id);
        const skip = parseQueryInt('skip', req.query.skip, { default: 0, min: 0 });
        const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });
        const status = parseQueryEnum('status', req.query.status, FriendRequestStatus, { default: 'accepted' });
		const type = parseQueryString('type', req.query.type, { isOptional: true, minLength: 8, maxLength: 8 });

        if (type !== undefined && type !== 'incoming' && type !== 'outgoing')
            throw new ApiError(400, 'Query parameter "type" must be either incoming or outgoing');

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new ApiError(404, 'User not found');

        const directionFilter = type === undefined
            ? { OR: [{ senderId: id }, { receiverId: id }] }
            : type === 'incoming' ? { receiverId: id } : { senderId: id };

        const where = { status, ...directionFilter };

        const [friendRequests, total] = await prisma.$transaction([
            prisma.friendRequest.findMany({
                where,
                include: {
                    sender:   { select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true, updatedAt: true } },
                    receiver: { select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true, updatedAt: true } }
                },
                skip,
                take,
                orderBy: { updatedAt: 'desc' }
            }),
            prisma.friendRequest.count({ where })
        ]);

        res.json({
            success: true,
            data: { friendRequests, pagination: { skip, take, total } }
        });
    }
    catch (err) { next(err); }
}

export async function   getUserActivity( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const skip = parseQueryInt('skip', req.query.skip, { default: 0, min: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user)
			throw new ApiError(404, 'User not found');

		const activities = await prisma.activityLog.findMany({
			where: { userId: id },
			include: {
				workspace: {
					select: { id: true, name: true }
				}
			},
			skip,
			take,
			orderBy: { createdAt: 'desc' }
		});

		const total = await prisma.activityLog.count({ where: { userId: id } });

		res.json({
			success: true,
			data: {
				activities,
				pagination: { skip, take, total }
			}
		});
	}
    catch (err) { next(err); }
}



export async function   getUserBadges( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const skip = parseQueryInt('skip', req.query.skip, { default: 0, min: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user)
			throw new ApiError(404, 'User not found');

		const earnedBadges = await prisma.userBadge.findMany({
			where: { userId: id },
			include: {
				badge: {
					select: { id: true, name: true, description: true, iconUrl: true, createdAt: true, updatedAt: true }
				}
			},
			skip,
			take,
			orderBy: { createdAt: 'desc' }
		});

		const total = await prisma.userBadge.count({ where: { userId: id } });

		res.json({
			success: true,
			data: {
				badges: earnedBadges.map((userBadge: (typeof earnedBadges)[number]) => ({
					...userBadge.badge,
					earnedAt: userBadge.createdAt
				})),
				pagination: { skip, take, total }
			}
		});
	}
    catch (err) { next(err); }
}

export async function   getUserXpHistory( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const skip = parseQueryInt('skip', req.query.skip, { default: 0, min: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user)
			throw new ApiError(404, 'User not found');

		const xpHistory = await prisma.userXP.findMany({
			where: { userId: id },
			select: {
				id: true,
				xp: true,
				createdAt: true,
				updatedAt: true
			},
			skip,
			take,
			orderBy: { createdAt: 'desc' }
		});

		const total = await prisma.userXP.count({ where: { userId: id } });

		res.json({
			success: true,
			data: {
				history: xpHistory,
				pagination: { skip, take, total }
			}
		});
	}
    catch (err) { next(err); }
}

export async function   getUserStats( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user)
			throw new ApiError(404, 'User not found');

		const userXP = await prisma.userXP.findFirst({
            where: { userId: id },
            orderBy: { createdAt: 'desc' }
        });

		const badges = await prisma.userBadge.findMany({
			where: { userId: id },
			include: {
				badge: {
					select: { id: true, name: true, description: true, iconUrl: true }
				}
			}
		});

		/*const leaderboardEntries = await prisma.leaderboardEntry.findMany({
			where: { userId: id },
			include: {
				workspace: {
					select: { id: true, name: true }
				}
			},
			orderBy: { weekYear: 'desc' }
		});*/

		const totalComments = await prisma.comment.count({
			where: { authorId: id }
		});

		const totalTasks = await prisma.taskAssignment.count({
			where: { userId: id }
		});

		res.json({
			success: true,
			data: {
				xp: userXP?.xp || 0,
				badges: badges.map((ub: (typeof badges)[number]) => ub.badge),
				//leaderboardEntries,
				stats: {
					totalComments,
					totalTasks
				}
			}
		});
	}
    catch (err) { next(err); }
}
