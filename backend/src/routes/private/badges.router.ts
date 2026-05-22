import { Router, Request, Response, NextFunction }	from 'express';
import { authenticate }								from '../../middleware/auth';
import { prisma }									from '../../lib/prisma';
import { ApiError }									from '../../utils/ApiError';
import {
	badgeIdParamsSchema,
	badgeUserParamsSchema,
	createBadgeSchema,
	updateBadgeSchema,
	assignBadgeSchema
}													from '../../validations/badge';

const router = Router();

const parseOrThrow = <T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ message: string }> } } }, value: unknown): T => {
	const result = schema.safeParse(value);

	if (!result.success)
		throw new ApiError(400, result.error?.issues.map((issue) => issue.message).join(', ') || 'Invalid input');

	return result.data as T;
};

router.use(authenticate);

/**
 * @swagger
 * /badges:
 *   post:
 *     summary: Create a new badge
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, iconUrl]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, minLength: 1, maxLength: 1000 }
 *               iconUrl: { type: string, format: uri }
 *     responses:
 *       201:
 *         description: Badge created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name, description, iconUrl } = parseOrThrow(createBadgeSchema, req.body);

		const badge = await prisma.badge.create({
			data: {
				name,
				description,
				iconUrl
			}
		});

		res.status(201).json({
			success: true,
			message: 'Badge created successfully',
			data: badge
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /badges:
 *   get:
 *     summary: List all badges
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Badge list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       name: { type: string }
 *                       description: { type: string }
 *                       iconUrl: { type: string }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const badges = await prisma.badge.findMany({
			orderBy: { createdAt: 'desc' }
		});

		res.json({
			success: true,
			data: badges
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /badges/{id}:
 *   get:
 *     summary: Get badge details
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Badge details
 *       404:
 *         description: Badge not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(badgeIdParamsSchema, req.params);

		const badge = await prisma.badge.findUnique({
			where: { id },
			include: {
				userBadges: {
					include: {
						user: {
							select: {
								id: true,
								nickname: true,
								email: true,
								avatarUrl: true
							}
						}
					}
				}
			}
		});

		if (!badge)
			throw new ApiError(404, 'Badge not found');

		res.json({
			success: true,
			data: badge
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /badges/{id}:
 *   put:
 *     summary: Update badge details
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, minLength: 1, maxLength: 1000 }
 *               iconUrl: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: Badge updated successfully
 *       400:
 *         description: At least one field must be provided
 *       404:
 *         description: Badge not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(badgeIdParamsSchema, req.params);
		const updateData = parseOrThrow(updateBadgeSchema, req.body);

		if (!updateData.name && !updateData.description && !updateData.iconUrl) {
			throw new ApiError(400, 'At least one field must be provided');
		}

		const badge = await prisma.badge.findUnique({ where: { id } });
		if (!badge)
			throw new ApiError(404, 'Badge not found');

		const updatedBadge = await prisma.badge.update({
			where: { id },
			data: {
				...(updateData.name && { name: updateData.name }),
				...(updateData.description && { description: updateData.description }),
				...(updateData.iconUrl && { iconUrl: updateData.iconUrl })
			}
		});

		res.json({
			success: true,
			message: 'Badge updated successfully',
			data: updatedBadge
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /badges/{id}:
 *   delete:
 *     summary: Delete a badge
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Badge deleted successfully
 *       404:
 *         description: Badge not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(badgeIdParamsSchema, req.params);

		const badge = await prisma.badge.findUnique({ where: { id } });
		if (!badge)
			throw new ApiError(404, 'Badge not found');

		await prisma.$transaction(async (tx) => {
			// Delete all user-badge associations first
			await tx.userBadge.deleteMany({
				where: { badgeId: id }
			});

			// Then delete the badge
			await tx.badge.delete({
				where: { id }
			});
		});

		res.json({
			success: true,
			message: 'Badge deleted successfully'
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /badges/{id}/assign:
 *   post:
 *     summary: Assign badge to a user
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: integer }
 *     responses:
 *       201:
 *         description: Badge assigned successfully
 *       400:
 *         description: User already has this badge or invalid input
 *       404:
 *         description: Badge or user not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(badgeIdParamsSchema, req.params);
		const { userId } = parseOrThrow(assignBadgeSchema, req.body);

		const badge = await prisma.badge.findUnique({ where: { id } });
		if (!badge)
			throw new ApiError(404, 'Badge not found');

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user)
			throw new ApiError(404, 'User not found');

		const existingAssignment = await prisma.userBadge.findFirst({
			where: { badgeId: id, userId }
		});
		if (existingAssignment)
			throw new ApiError(400, 'User already has this badge');

		const userBadge = await prisma.userBadge.create({
			data: {
				badgeId: id,
				userId
			},
			include: {
				badge: true,
				user: {
					select: {
						id: true,
						nickname: true,
						email: true,
						avatarUrl: true
					}
				}
			}
		});

		res.status(201).json({
			success: true,
			message: 'Badge assigned successfully',
			data: userBadge
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /badges/{id}/users:
 *   get:
 *     summary: List users with this badge
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of users with badge
 *       404:
 *         description: Badge not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/users', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(badgeIdParamsSchema, req.params);

		const badge = await prisma.badge.findUnique({
			where: { id },
			include: {
				userBadges: {
					include: {
						user: {
							select: {
								id: true,
								nickname: true,
								email: true,
								avatarUrl: true,
								createdAt: true
							}
						}
					},
					orderBy: { createdAt: 'desc' }
				}
			}
		});

		if (!badge)
			throw new ApiError(404, 'Badge not found');

		res.json({
			success: true,
			data: {
				badge: {
					id: badge.id,
					name: badge.name,
					description: badge.description,
					iconUrl: badge.iconUrl
				},
				users: badge.userBadges.map((ub) => ({
					...ub.user,
					assignedAt: ub.createdAt
				}))
			}
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /badges/{id}/users/{userId}:
 *   delete:
 *     summary: Remove badge from user
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Badge removed successfully
 *       404:
 *         description: Badge or assignment not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id, userId } = parseOrThrow(badgeUserParamsSchema, req.params);

		const userBadge = await prisma.userBadge.findFirst({
			where: { badgeId: id, userId }
		});

		if (!userBadge)
			throw new ApiError(404, 'Badge assignment not found');

		await prisma.userBadge.delete({
			where: { id: userBadge.id }
		});

		res.json({
			success: true,
			message: 'Badge removed from user successfully'
		});
	} catch (err) {
		next(err);
	}
});

export default router;
