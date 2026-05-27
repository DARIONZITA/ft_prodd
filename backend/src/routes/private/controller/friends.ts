import { Router, Request, Response, NextFunction }	from 'express';
import { prisma }									from '../../../lib/prisma';
import { ApiError }									from '../../../utils/ApiError';
import { parseOrThrow, parseQueryInt, idSchema }	from '../../../validations/utils';
import { friendRequestStatusSchema }				from '../../../validations/user';

export async function   sendFriendRequest(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const friendId = parseOrThrow(idSchema, 'FriendID', req.params.friendId);

		if (req.user!.id !== id)
			throw new ApiError(403, 'You can only send requests from your own account');
		if (id === friendId)
			throw new ApiError(422, 'Cannot send friend request to yourself');

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user)
			throw new ApiError(404, 'User not found');

		const targetUser = await prisma.user.findUnique({ where: { id: friendId } });
		if (!targetUser)
			throw new ApiError(404, 'Target user not found');

		const existingRequest = await prisma.friendRequest.findUnique({
			where: { senderId_receiverId: { senderId: id, receiverId: friendId } }
		});
		if (existingRequest) {
            if (existingRequest.status === 'pending')
                throw new ApiError(409, 'Friend request already sent');
            if (existingRequest.status === 'accepted')
                throw new ApiError(409, 'You are already friends');
        }

        const reverseRequest = await prisma.friendRequest.findUnique({
            where: { senderId_receiverId: { senderId: friendId, receiverId: id } }
        });

        let request, message;

        if (reverseRequest) {
            if (reverseRequest.status === 'accepted')
                throw new ApiError(409, 'You are already friends');

            if (reverseRequest.status === 'pending') {
                request = await prisma.friendRequest.update({
                    where: { senderId_receiverId: { senderId: friendId, receiverId: id } },
                    data: { status: 'accepted' },
                    include: {
                        sender: {
                            select: { id: true, username: true, email: true, avatarUrl: true }
                        },
                        receiver: {
                            select: { id: true, username: true, email: true, avatarUrl: true }
                        }
                    }
                });
                message = 'Friend request accepted';
            }
        }
        else {
            request = await prisma.friendRequest.create({
                data: {
                    senderId: id,
                    receiverId: friendId,
                    status: 'pending'
                },
                include: {
                    sender: {
                        select: { id: true, username: true, email: true, avatarUrl: true }
                    },
                    receiver: {
                        select: { id: true, username: true, email: true, avatarUrl: true }
                    }
                }
            });
			message = 'Friend request sent successfully';
        }

		res.status(201).json({
			success: true,
			message: message,
			data: request
		});
	}
    catch (err) { next(err); }
}

export async function   updateFriendRequest(req: Request, res: Response, next: NextFunction)
{
	try {
        const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const friendId = parseOrThrow(idSchema, 'FriendID', req.params.friendId);
		const { status } = parseOrThrow(friendRequestStatusSchema, 'FriendRequestStatus', req.body);

		if (req.user!.id !== id)
			throw new ApiError(403, 'You can only manage your own friend requests');

		const friendRequest = await prisma.friendRequest.findUnique({
			where: { senderId_receiverId: { senderId: friendId, receiverId: id } }
		});
		if (!friendRequest)
			throw new ApiError(404, 'Friend request not found');

		if (friendRequest.status !== 'pending')
			throw new ApiError(409, `Cannot update a request that is already ${friendRequest.status}`);

		const updatedRequest = await prisma.friendRequest.update({
			where: { id: friendRequest.id },
			data: { status },
			include: {
				sender: {
					select: { id: true, username: true, email: true, avatarUrl: true }
				},
				receiver: {
					select: { id: true, username: true, email: true, avatarUrl: true }
				}
			}
		});

		res.json({
			success: true,
			message: `Friend request ${status}`,
			data: updatedRequest
		});
	}
    catch (err) { next(err); }
}

export async function   removeFriend(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const friendId = parseOrThrow(idSchema, 'FriendID', req.params.friendId);

		if (req.user!.id !== id)
			throw new ApiError(403, 'You can only remove friends from your own account');

		if (id === friendId)
			throw new ApiError(422, 'Cannot remove yourself as a friend');

		const targetUser = await prisma.user.findUnique({ where: { id: friendId } });
		if (!targetUser)
			throw new ApiError(404, 'Target user not found');

		let friendRequest = await prisma.friendRequest.findUnique({
			where: { senderId_receiverId: { senderId: id, receiverId: friendId } }
		});
		if (!friendRequest) {
			friendRequest = await prisma.friendRequest.findUnique({
				where: { senderId_receiverId: { senderId: friendId, receiverId: id } }
			});
		}
		if (!friendRequest)
			throw new ApiError(404, 'Friend request not found');

		await prisma.friendRequest.delete({
			where: { id: friendRequest.id }
		});

		res.json({
			success: true,
			message: 'Friend removed successfully'
		});
	}
    catch (err) { next(err); }
}

export async function   getFriends(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const skip = parseQueryInt('skip', req.query.skip, { default: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user)
			throw new ApiError(404, 'User not found');

		const friendRequests = await prisma.friendRequest.findMany({
			where: {
				AND: [
					{ status: 'accepted' },
					{
						OR: [
							{ senderId: id },
							{ receiverId: id }
						]
					}
				]
			},
			skip,
			take,
			orderBy: { updatedAt: 'desc' }
		});

		const friends = await Promise.all(
			friendRequests.map(async (req) => {
				const friendId = req.senderId === id ? req.receiverId : req.senderId;
				const friend = await prisma.user.findUnique({
					where: { id: friendId },
					select: {
						id: true,
						username: true,
						email: true,
						avatarUrl: true,
						createdAt: true,
						updatedAt: true
					}
				});
				return friend;
			})
		);

		const total = await prisma.friendRequest.count({
			where: {
				AND: [
					{ status: 'accepted' },
					{
						OR: [
							{ senderId: id },
							{ receiverId: id }
						]
					}
				]
			}
		});

		res.json({
			success: true,
			data: {
				friends,
				pagination: { skip, take, total }
			}
		});
	}
    catch (err) { next(err); }
}

export async function   getOnlineFriends(req: Request, res: Response, next: NextFunction)
{
	try
    {
		const id = parseOrThrow(idSchema, 'UserID', req.params.id);
		const skip = parseQueryInt('skip', req.query.skip, { default: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user)
			throw new ApiError(404, 'User not found');

		// NOTE: This endpoint requires:
		// 1. A FriendRequest/Friendship table in the Prisma schema (implemented)
		// 2. A user online status tracking mechanism (e.g., Redis, WebSocket connection tracking)
		// For now, we return accepted friends. In production, filter by online status.

		const friendRequests = await prisma.friendRequest.findMany({
			where: {
				AND: [
					{ status: 'accepted' },
					{
						OR: [
							{ senderId: id },
							{ receiverId: id }
						]
					}
				]
			},
			orderBy: { updatedAt: 'desc' }
		});

		// Extract friend IDs
		const friends = await Promise.all(
			friendRequests.map(async (req) => {
				const friendId = req.senderId === id ? req.receiverId : req.senderId;
				const friend = await prisma.user.findUnique({
					where: { id: friendId },
					select: {
						id: true,
						username: true,
						email: true,
						avatarUrl: true,
						createdAt: true,
						updatedAt: true
					}
				});
				return friend && { ...friend, isOnline: false }; // isOnline would be fetched from Redis/WebSocket in production
			})
		);

		res.json({
			success: true,
			data: friends
		});
	}
    catch (err) { next(err); }
}