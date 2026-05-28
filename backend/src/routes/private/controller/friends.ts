import { Request, Response, NextFunction }	from 'express';
import { prisma }									from '../../../lib/prisma';
import { ApiError }									from '../../../utils/ApiError';
import { parseOrThrow, parseQueryEnum, idSchema }	from '../../../validations/utils';

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
		const status = parseQueryEnum('status', req.query.status, ['accepted', 'rejected']);
		
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
