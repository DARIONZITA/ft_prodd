import { Router }		from 'express';
import { authenticate }	from '../../../middleware/auth';
import {
	getNotifications,
	markAllNotificationsAsRead,
	markNotificationAsRead
} from '../controller/notifications';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         description: Filter notifications by type
 *         schema:
 *           type: string
 *           enum: [friendship, workspace, task, mention]
 *       - in: query
 *         name: sort
 *         description: Sort notifications by creation date
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *       - in: query
 *         name: skip
 *         description: Number of notifications to skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: take
 *         description: Maximum number of notifications to return
 *         schema:
 *           type: integer
 *           default: 42
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationReadAllResponse'
 *       404:
 *         description: User not found
 */
router.patch('/read-all', markAllNotificationsAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
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
router.patch('/:id/read', markNotificationAsRead);

export default router;
