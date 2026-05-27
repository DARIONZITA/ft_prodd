import type { Request, Response, NextFunction }	from 'express';
import { prisma }								from '../../../lib/prisma';
import { ApiError }								from '../../../utils/ApiError';
import {
	badgeIdParamsSchema,
	badgeUserParamsSchema,
	createBadgeSchema,
	updateBadgeSchema,
	assignBadgeSchema
}												from '../../../validations/badge';
import { parseOrThrow }							from '../../../utils/parsing';

export async function   createBadge(req: Request, res: Response, next: NextFunction)
{
	try
    {
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
	}
    catch (err) { next(err); }
}

export async function   listBadges(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const badges = await prisma.badge.findMany({
			orderBy: { createdAt: 'desc' }
		});

		res.json({
			success: true,
			data: badges
		});
	}
    catch (err) { next(err); }
}

export async function   getBadgeDetails(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const { id } = parseOrThrow(badgeIdParamsSchema, req.params);

		const badge = await prisma.badge.findUnique({
			where: { id },
			include: {
				userBadges: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
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
	}
    catch (err) { next(err); }
}

export async function   updateBadge(req: Request, res: Response, next: NextFunction)
{
	try
    {
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
	}
    catch (err) { next(err); }
}

export async function   deleteBadge(req: Request, res: Response, next: NextFunction)
{
	try
    {
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
	}
    catch (err) { next(err); }
}

export async function   assignBadge(req: Request, res: Response, next: NextFunction)
{
	try
    {
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
						username: true,
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
	}
    catch (err) { next(err); }
}

export async function   listUsersWithBadge(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const { id } = parseOrThrow(badgeIdParamsSchema, req.params);

		const badge = await prisma.badge.findUnique({
			where: { id },
			include: {
				userBadges: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
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
	}
    catch (err) { next(err); }
}

export async function   removeBadgeFromUser(req: Request, res: Response, next: NextFunction)
{
	try
    {
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
	}
    catch (err) { next(err); }
}