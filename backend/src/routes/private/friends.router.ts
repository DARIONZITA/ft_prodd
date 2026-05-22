import { Router, Request, Response, NextFunction }	from 'express';
import { authenticate }								from '../../middleware/auth';
import { prisma }									from '../../lib/prisma';
import { ApiError }									from '../../utils/ApiError';
import { parseOrThrow, parseQueryInt, idSchema }	from '../../validations/utils';
import { friendRequestStatusSchema }				from '../../validations/user';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /users/{id}/friends:
 *   post:
 *     summary: Send friend request
 *     tags: [Users]
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
 *             required: [friendId]
 *             properties:
 *               friendId: { type: integer }
 *     responses:
 *       201:
 *         description: Friend request sent
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 */
router.post('/:id/:friendId', async (req: Request, res: Response, next: NextFunction) => {
	try {
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
                            select: { id: true, nickname: true, email: true, avatarUrl: true }
                        },
                        receiver: {
                            select: { id: true, nickname: true, email: true, avatarUrl: true }
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
                        select: { id: true, nickname: true, email: true, avatarUrl: true }
                    },
                    receiver: {
                        select: { id: true, nickname: true, email: true, avatarUrl: true }
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
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}/friends/{friendId}:
 *   patch:
 *     summary: Accept or reject friend request
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [accepted, rejected] }
 *     responses:
 *       200:
 *         description: Friend request updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Request not found
 */
router.patch('/:id/:friendId', async (req: Request, res: Response, next: NextFunction) => {
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
					select: { id: true, nickname: true, email: true, avatarUrl: true }
				},
				receiver: {
					select: { id: true, nickname: true, email: true, avatarUrl: true }
				}
			}
		});

		res.json({
			success: true,
			message: `Friend request ${status}`,
			data: updatedRequest
		});
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}/friends/{friendId}:
 *   delete:
 *     summary: Remove a friend or cancel friend request
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Friend removed
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Friend not found
 */
router.delete('/:id/:friendId', async (req: Request, res: Response, next: NextFunction) => {
	try {
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
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}/friends:
 *   get:
 *     summary: Get friends list
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
 *         description: Friends list
 *       404:
 *         description: User not found
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
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
						nickname: true,
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
	} catch (err) {
		next(err);
	}
});



/**
 * @swagger
 * /users/{id}/friends/online:
 *   get:
 *     summary: Get online friends
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
 *         description: Online friends list
 *       404:
 *         description: User not found
 */
router.get('/:id/online', async (req: Request, res: Response, next: NextFunction) => {
	try {
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
						nickname: true,
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
	} catch (err) {
		next(err);
	}
});

export default router;
