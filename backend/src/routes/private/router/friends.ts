import { Router }									from 'express';
import { authenticate }								from '../../../middleware/auth';
import { removeFriend,
	sendFriendRequest, updateFriendRequest }		from '../controller/friends';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /friends/{friendId}:
 *   post:
 *     summary: Send friend request
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Friend request sent
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 */
router.post('/:friendId', sendFriendRequest);

/**
 * @swagger
 * /friends/{friendId}:
 *   patch:
 *     summary: Accept or reject friend request
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [accepted, rejected] }
 *     responses:
 *       200:
 *         description: Friend request updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Request not found
 */
router.patch('/:friendId', updateFriendRequest);

/**
 * @swagger
 * /friends/{friendId}:
 *   delete:
 *     summary: Remove a friend or cancel friend request
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
router.delete('/:friendId', removeFriend);

export default router;
