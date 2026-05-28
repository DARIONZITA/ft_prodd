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
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationCreateRequest'
 *     responses:
 *       201:
 *         description: Notification created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       400:
 *         description: Invalid payload
 *       403:
 *         description: Not allowed
 */
router.post('/', createNotification);

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Get one notification by ID
 *     tags: [Notifications]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       404:
 *         description: Notification not found
 *       403:
 *         description: Not allowed
 */
router.get('/:id', getNotification);

/**
 * @swagger
 * /notifications/{id}:
 *   patch:
 *     summary: Update a notification (mark as read)
 *     tags: [Notifications]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Notification not found
 */
router.patch('/:id', updateNotification);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
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
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', deleteNotification);

export default router;
