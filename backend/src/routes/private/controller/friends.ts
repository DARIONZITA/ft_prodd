import { Request, Response, NextFunction }					from 'express';
import { prisma }                           				from '../../../lib/prisma';
import { ApiError }                         				from '../../../utils/ApiError';
import { FriendRequestStatuses }							from '../../../types/constants';
import { parseOrThrow, parseQueryEnum, idSchema }			from '../../../validations/utils';
import { Prisma, NotificationType, FriendRequestStatus }	from '@prisma/client';
import { notify } from '../../../utils/notify';

export async function requireFriendship( userId: number, targetUserId: number, message?: string, tx?: Prisma.TransactionClient ): Promise<void>
{
    const client = tx ?? prisma;
    const areFriends = await client.friendRequest.findFirst({
        where: {
            status: 'accepted',
            OR: [
                { senderId: userId, receiverId: targetUserId },
                { senderId: targetUserId, receiverId: userId }
            ]
        }
    });
    if (!areFriends)
        throw new ApiError(403, message ?? "You must be friends to view this user's information");
}

export async function	listUserFriends(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'UserID', req.params.id);
        const status = parseQueryEnum('status', req.query.status, FriendRequestStatuses, { default: 'accepted' });
        const type = parseQueryEnum('type', req.query.type, ['incoming', 'outgoing'] as const, { isOptional: true });

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new ApiError(404, 'User not found');

        const isOwner = req.user!.id === id;

        if (status === 'pending' && !isOwner)
            throw new ApiError(403, 'You can only view your own pending friend requests');

        const directionFilter = type === undefined
            ? { OR: [{ senderId: id }, { receiverId: id }] }
            : type === 'incoming' ? { receiverId: id } : { senderId: id };

        const where = { status, ...directionFilter };

        const [friendRequests, total] = await prisma.$transaction(async (tx) => {
            if (status === 'accepted' && !isOwner)
                await requireFriendship(req.user!.id, id, "You must be friends to view this user's friend list", tx);

            const requests = await tx.friendRequest.findMany({
                where,
                include: {
                    sender:   { select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true, updatedAt: true } },
                    receiver: { select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true, updatedAt: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
            const count = await tx.friendRequest.count({ where });
            return [requests, count];
        });

        res.json({
            success: true,
            data: { friendRequests, total }
        });
    }
    catch (err) { next(err); }
}

export async function   sendFriendRequest(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const id = req.user!.id;
		const friendId = parseOrThrow(idSchema, 'FriendID', req.params.friendId);

		if (id === friendId)
			throw new ApiError(422, 'Cannot send friend request to yourself');

		await prisma.$transaction(async (tx) => {
			const targetUser = await tx.user.findUnique({ where: { id: friendId } });
			if (!targetUser)
				throw new ApiError(404, 'Target user not found');

			const existingRequest = await tx.friendRequest.findUnique({
				where: { senderId_receiverId: { senderId: id, receiverId: friendId } }
			});
			if (existingRequest) {
				if (existingRequest.status === 'pending')
					throw new ApiError(409, 'Friend request already sent');
				if (existingRequest.status === 'accepted')
					throw new ApiError(409, 'You are already friends');
			}

			const reverseRequest = await tx.friendRequest.findUnique({
				where: { senderId_receiverId: { senderId: friendId, receiverId: id } }
			});

			const senderUsername = req.user!.username;

			let request, message;

			if (reverseRequest) {
				if (reverseRequest.status === 'accepted')
					throw new ApiError(409, 'You are already friends');

				if (reverseRequest.status === 'pending') {
					request = await tx.friendRequest.update({
						where: { senderId_receiverId: { senderId: friendId, receiverId: id } },
						data: { status: 'accepted' },
						include: {
							sender: { select: { id: true, username: true, email: true, avatarUrl: true } },
							receiver: { select: { id: true, username: true, email: true, avatarUrl: true } }
						}
					});
					await notify(
						{
							userIds: [friendId],
							type: NotificationType.friendship,
							message: `${senderUsername} accepted your friend request`
						},
						tx
					);
					message = 'Friend request accepted';
				}
			}
			else {
				request = await tx.friendRequest.create({
					data: {
						senderId: id,
						receiverId: friendId,
						status: 'pending'
					},
					include: {
						sender: { select: { id: true, username: true, email: true, avatarUrl: true } },
						receiver: { select: { id: true, username: true, email: true, avatarUrl: true } }
					}
				});
				await notify(
					{
						userIds: [friendId],
						type: NotificationType.friendship,
						message: `${senderUsername} sent you a friend request`
					},
					tx
				);
				message = 'Friend request sent successfully';
			}

			res.status(201).json({
				success: true,
				message: message,
				data: request
			});
		});
	}
    catch (err) { next(err); }
}

export async function   updateFriendRequest(req: Request, res: Response, next: NextFunction)
{
	try {
		const id = req.user!.id;
		const friendId = parseOrThrow(idSchema, 'FriendID', req.params.friendId);
		const status = parseQueryEnum('status', req.query.status, ['accepted'/*, 'rejected'*/]);

		const result = await prisma.$transaction(async (tx) => {
			const friendRequest = await tx.friendRequest.findUnique({
				where: { senderId_receiverId: { senderId: friendId, receiverId: id } }
			});
			if (!friendRequest)
				throw new ApiError(404, 'Friend request not found');

			if (friendRequest.status !== 'pending')
				throw new ApiError(409, `Cannot update a request that is already ${friendRequest.status}`);

			if (status === 'accepted') {
				const updatedRequest = await tx.friendRequest.update({
					where: { id: friendRequest.id },
					data: { status: FriendRequestStatus.accepted },
					include: {
						sender: { select: { id: true, username: true, email: true, avatarUrl: true } },
						receiver: { select: { id: true, username: true, email: true, avatarUrl: true } }
					}
				});

				await notify(
					{
						userIds: [friendId],
						type: NotificationType.friendship,
						message: `${req.user!.username} accepted your friend request`
					},
					tx
				);
				return { accepted: true, data: updatedRequest };
			} else {
				await tx.friendRequest.delete({ where: { id: friendRequest.id } });
				await notify(
					{
						userIds: [friendId],
						type: NotificationType.friendship,
						message: `${req.user!.username} rejected your friend request`
					},
					tx
				);

				return { accepted: false };
			}
		});

		if (result.accepted)
			res.json({ success: true, message: 'Friend request accepted', data: result.data });
		else
			res.json({ success: true, message: 'Friend request rejected' });
	}
    catch (err) { next(err); }
}

export async function   removeFriend(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const id = req.user!.id;
		const friendId = parseOrThrow(idSchema, 'FriendID', req.params.friendId);

		if (id === friendId)
			throw new ApiError(422, 'Cannot remove yourself as a friend');

		await prisma.$transaction(async (tx) => {
			const targetUser = await tx.user.findUnique({ where: { id: friendId } });
			if (!targetUser)
				throw new ApiError(404, 'Target user not found');

			let friendRequest = await tx.friendRequest.findUnique({
				where: { senderId_receiverId: { senderId: id, receiverId: friendId } }
			});
			if (!friendRequest) {
				friendRequest = await tx.friendRequest.findUnique({
					where: { senderId_receiverId: { senderId: friendId, receiverId: id } }
				});
			}
			if (!friendRequest)
				throw new ApiError(404, 'Friend request not found');

			await tx.friendRequest.delete({
				where: { id: friendRequest.id }
			});
			await notify(
				{
					userIds: [friendId],
					type: NotificationType.friendship,
					message: `${req.user!.username} removed you as a friend`
				},
				tx
			);
			res.json({
				success: true,
				message: 'Friend removed successfully'
			});
		});
	}
    catch (err) { next(err); }
}
