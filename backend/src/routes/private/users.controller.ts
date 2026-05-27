import type { Request, Response, NextFunction }     from 'express';
import { prisma }									from '../../lib/prisma';
import { ApiError }									from '../../utils/ApiError';
import { parseOrThrow, parseQueryInt, idSchema }	from '../../validations/utils';
import { updateUserProfileSchema }					from '../../validations/user';

export async function   listUsers( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const skip = parseQueryInt('skip', req.query.skip, { default: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });

		const users = await prisma.user.findMany({
			select: {
				id: true,
				username: true,
				bio: true,
				email: true,
				avatarUrl: true,
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

export async function   getUserActivity( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const skip = parseQueryInt('skip', req.query.skip, { default: 0 });
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
				badges: badges.map(ub => ub.badge),
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