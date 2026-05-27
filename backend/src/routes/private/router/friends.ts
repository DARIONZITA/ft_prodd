import { Router }									from 'express';
import { authenticate }								from '../../../middleware/auth';
import { getFriends, getOnlineFriends, removeFriend,
	sendFriendRequest, updateFriendRequest }		from '../controller/friends';

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
router.post('/:id/:friendId', sendFriendRequest);


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
router.patch('/:id/:friendId', updateFriendRequest);



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
router.delete('/:id/:friendId', removeFriend);



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
router.get('/:id', getFriends);



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
router.get('/:id/online', getOnlineFriends);

export default router;
