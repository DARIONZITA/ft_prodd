import type { Request, Response, NextFunction }		from 'express';
import fs											from 'fs';
import path											from 'path';
import { avatarDir }								from '../../../types/constants';
import { prisma }									from	 '../../../lib/prisma';
import { ApiError }									from '../../../utils/ApiError';
import { NotificationType }							from '@prisma/client';
import { idSchema, parseOrThrow, parseQueryInt }	from '../../../validations/utils';
import { updateUserProfileSchema }					from '../../../validations/user';
import { notify } from '../../../utils/notify';

export async function   listUsers( req: Request, res: Response, next: NextFunction )
{
	try
    {
		const	skip = parseQueryInt('listUsers() skip', req.query.skip, { default: 0, min: 0 });
		const	take = parseQueryInt('listUsers() take', req.query.take, { default: 42, min: 1, max: 100 });

		let whereClause: any = {};
		if (typeof req.query.search === 'string' && req.query.search.trim() !== '')
		{
			const searchterm = req.query.search.trim();
			whereClause = {
				OR: [
					{ email: { contains: searchterm, mode: 'insensitive' } },
					{ username: { contains: searchterm, mode: 'insensitive' } }
				]
			};
		}
		const users = await prisma.user.findMany(
		{
			where: whereClause,
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
		const id = req.params.id ? parseOrThrow(idSchema, 'getUserProfile() UserID', req.params.id) : req.user!.id;
		const isOwnProfile = req.user!.id === id;

		const user = await prisma.user.findUnique({
			where: { id },
			select: isOwnProfile
				? {
					id: true,
					username: true,
					email: true,
					bio: true,
					avatarUrl: true,
					createdAt: true,
					updatedAt: true
				}
				: {
					id: true,
					username: true,
					bio: true,
					avatarUrl: true,
					createdAt: true
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
		const updateData = parseOrThrow(updateUserProfileSchema, 'updateUserProfile() UpdateUserProfileSchema', req.body);

		const updateFields: any = {};
		if (updateData.username !== undefined)
			updateFields.username = updateData.username;
		if (updateData.bio !== undefined)
			updateFields.bio = updateData.bio;
		if (updateData.avatarUrl !== undefined)
			updateFields.avatarUrl = updateData.avatarUrl;

		if (req.file)
		{
			const oldAvatarUrl = req.user!.avatarUrl;
			if (oldAvatarUrl && oldAvatarUrl !== `${avatarDir}default.svg` && oldAvatarUrl.startsWith(avatarDir))
			{
				const oldPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(oldAvatarUrl));
				fs.unlink(oldPath, () => {});
			}
			updateFields.avatarUrl = `${avatarDir}${req.file.filename}`;
		}

		if (!Object.keys(updateFields).length)
			return (next(new ApiError(400, 'At least one field must be provided for update')));

		const updatedUser = await prisma.user.update({
			where: { id: req.user!.id },
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
		const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select : { username: true, avatarUrl: true } });

        if (!user)
			throw new ApiError(404, 'User not found');

		await prisma.$transaction(async (tx) => {
			const memberships = await tx.workspaceMember.findMany({
				where: { userId: req.user!.id },
				include: { workspace: {
					select: {
						id: true,
						name: true,
						members: {
							orderBy: { createdAt: 'asc' },
							include: { user: { select: { id: true, username: true } } }
						}
					}
				}}
			});

			for (const membership of memberships)
			{
				const members = membership.workspace.members;
				const remainingMembers = members.filter( m => m.userId !== req.user!.id );

				if (!remainingMembers.length) {
					await tx.workspace.delete({ where: { id: membership.workspaceId } });
					continue;
				}

				await notify(
					{
						userIds: remainingMembers.map(m => m.userId),
						type: NotificationType.workspace,
						message: `${user.username} has left workspace "${membership.workspace.name}"`
					},
					tx
				);

				if (membership.role !== 'admin')
					continue;

				const adminCount = members.filter( m => m.role === 'admin' ).length;
				if (adminCount > 1)
					continue;

				const replacement = remainingMembers.find( m => m.role === 'member' );
				if (!replacement) {
					await notify(
						{
							userIds: remainingMembers.map(m => m.userId),
							type: NotificationType.workspace,
							message: `Workspace "${membership.workspace.name}" was deleted because its last administrator left.`
						},
						tx
					);
					await tx.workspace.delete({ where: { id: membership.workspaceId } });
					continue;
				}

				await tx.workspaceMember.update({
					where: { id: replacement.id },
					data: { role: 'admin' }
				});

				await notify(
					{
						userIds: [replacement.userId],
						type: NotificationType.workspace,
						message: `You have been promoted to admin in workspace "${membership.workspace.name}" because the previous administrator left.`
					},
					tx
				);

				await notify(
					{
						userIds: remainingMembers.filter(m => m.userId !== replacement.userId).map(m => m.userId),
						type: NotificationType.workspace,
						message: `${replacement.user.username} has been promoted to admin in workspace "${membership.workspace.name}".`
					},
					tx
				);
			}

			await tx.user.delete({ where: { id: req.user!.id } });
		});

		if (user.avatarUrl && user.avatarUrl !== `${avatarDir}default.svg` && user.avatarUrl.startsWith(avatarDir))
		{
			const avatarUrlPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(user.avatarUrl));
			fs.unlink(avatarUrlPath, () => {});
		}

		res.json({
			success: true,
			message: 'User account deleted successfully'
		});
	}
    catch (err) { next(err); }
}
