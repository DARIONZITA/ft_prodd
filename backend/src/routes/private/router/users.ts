import { Router }											from 'express';
import { authenticate }										from '../../../middleware/auth';
import { deleteUserAccount, getUserActivity,
	getUserBadges, getUserProfile, getUserStats,
	getUserXpHistory, getUserNotifications, markAllUserNotificationsRead, listUsers, updateUserProfile }		from '../controller/users';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         description: Number of records to skip for pagination (used as the starting offset)
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: take
 *         description: Number of users to return per request (page size)
 *         schema:
 *           type: integer
 *           default: 42
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */
router.get('/', listUsers);



/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID (positive integer)
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getUserProfile);



/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile (username and bio only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileRequest'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id', updateUserProfile);



/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user account
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
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden - can only delete own account
 *       404:
 *         description: User not found
 */
router.delete('/:id', deleteUserAccount);



/**
 * @swagger
 * /users/{id}/activity:
 *   get:
 *     summary: Get user activity
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
 *         description: User activity
 *       404:
 *         description: User not found
 */
router.get('/:id/activity', getUserActivity);

/**
 * @swagger
 * /users/{id}/notifications:
 *   get:
 *     summary: Get all notifications for a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [mention, taskAssignment, comment, invite] }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: relatedTaskId
 *         schema: { type: integer }
 *       - in: query
 *         name: relatedWorkspaceId
 *         schema: { type: integer }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: take
 *         schema: { type: integer, default: 42 }
 *     responses:
 *       200:
 *         description: Notifications list
 *       404:
 *         description: User not found
 */
router.get('/:id/notifications', getUserNotifications);

/**
 * @swagger
 * /users/{id}/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read for a user
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
 *         description: All notifications marked as read
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/notifications/read-all', markAllUserNotificationsRead);



/**
 * @swagger
 * /users/{id}/badges:
 *   get:
 *     summary: Get user's earned badges
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           default: 42
 *     responses:
 *       200:
 *         description: User badges retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id/badges', getUserBadges);



/**
 * @swagger
 * /users/{id}/xp:
 *   get:
 *     summary: Get XP history
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           default: 42
 *     responses:
 *       200:
 *         description: XP history retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id/xp', getUserXpHistory);



/**
 * @swagger
 * /users/{id}/stats:
 *   get:
 *     summary: Get gamification statistics
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
 *         description: User gamification stats
 *       404:
 *         description: User not found
 */
router.get('/:id/stats', getUserStats);

export default router;
