import { Router, Request, Response, NextFunction }	from 'express';
import { authenticate }								from '../../middleware/auth';
import { prisma }									from '../../lib/prisma';
import { ApiError }									from '../../utils/ApiError';
import { parseOrThrow, parseQueryInt, idSchema }	from '../../validations/utils';
import { updateUserProfileSchema }					from '../../validations/user';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         description: Number of records to skip for pagination (used as the starting offset)
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: take
 *         description: Number of users to return per request (page size)
 *         schema:
 *           type: integer
 *           default: 42
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
	try
    {
		const skip = parseQueryInt('skip', req.query.skip, { default: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });

		const users = await prisma.user.findMany({
			select: {
				id: true,
				nickname: true,
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
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID (positive integer)
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);

		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				nickname: true,
				email: true,
				bio: true,
				avatarUrl: true,
				createdAt: true,
				updatedAt: true
			}
		});
		if (!user)
			throw new ApiError(404, 'User not found');
		res.json({
			success: true,
			data: user
		});
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile (nickname and bio only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileRequest'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);

		if (req.user!.id !== id)
			throw new ApiError(403, 'You can only update your own profile');

		const updateData = parseOrThrow(updateUserProfileSchema, 'UpdateUserProfile', req.body);

		const updateFields: any = {};
		if (updateData.username !== undefined)
			updateFields.nickname = updateData.username;
		if (updateData.bio !== undefined)
			updateFields.bio = updateData.bio;

		const updatedUser = await prisma.user.update({
			where: { id },
			data: updateFields,
			select: {
				id: true,
				nickname: true,
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
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Forbidden - can only delete own account
 *       404:
 *         description: User not found
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
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
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}/activity:
 *   get:
 *     summary: Get user activity
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: take
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: User activity
 *       404:
 *         description: User not found
 */
router.get('/:id/activity', async (req: Request, res: Response, next: NextFunction) => {
	try {
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
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}/stats:
 *   get:
 *     summary: Get gamification statistics
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User gamification stats
 *       404:
 *         description: User not found
 */
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
	try {
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

		const leaderboardEntries = await prisma.leaderboardEntry.findMany({
			where: { userId: id },
			include: {
				workspace: {
					select: { id: true, name: true }
				}
			},
			orderBy: { weekYear: 'desc' }
		});

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
				leaderboardEntries,
				stats: {
					totalComments,
					totalTasks
				}
			}
		});
	} catch (err) {
		next(err);
	}
});

export default router;
