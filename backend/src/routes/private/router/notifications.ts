import { Router }                                   from 'express';
import { authenticate }                             from '../../../middleware/auth';
import { createNotification, getNotification,
	updateNotification, deleteNotification }         from '../controller/notifications';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a notification for authenticated user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, type]
 *             properties:
 *               message: { type: string }
 *               type: { type: string, enum: [mention, taskAssignment, comment, invite] }
 *               relatedTaskId: { type: integer }
 *               relatedWorkspaceId: { type: integer }
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', createNotification);



/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Get one notification by ID
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
 *         description: Notification found
 *       404:
 *         description: Notification not found
 */
router.get('/:id', getNotification);



/**
 * @swagger
 * /notifications/{id}:
 *   patch:
 *     summary: Update a notification (mark as read)
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
 *         description: Notification updated
 */
router.patch('/:id', updateNotification);



/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
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
 *         description: Notification deleted
 */
router.delete('/:id', deleteNotification);

export default router;
