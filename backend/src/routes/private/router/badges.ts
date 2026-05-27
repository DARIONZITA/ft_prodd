import { Router }										from 'express';
import { authenticate }									from '../../../middleware/auth';
import { assignBadge, createBadge, deleteBadge,
	getBadgeDetails, listBadges, listUsersWithBadge,
	removeBadgeFromUser, updateBadge }					from '../controller/badges';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /badges:
 *   post:
 *     summary: Create a new badge
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, iconUrl]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, minLength: 1, maxLength: 1000 }
 *               iconUrl: { type: string, format: uri }
 *     responses:
 *       201:
 *         description: Badge created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', createBadge);

/**
 * @swagger
 * /badges:
 *   get:
 *     summary: List all badges
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Badge list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       name: { type: string }
 *                       description: { type: string }
 *                       iconUrl: { type: string }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 */
router.get('/', listBadges);

/**
 * @swagger
 * /badges/{id}:
 *   get:
 *     summary: Get badge details
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Badge details
 *       404:
 *         description: Badge not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', getBadgeDetails);

/**
 * @swagger
 * /badges/{id}:
 *   put:
 *     summary: Update badge details
 *     tags: [Badges]
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
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, minLength: 1, maxLength: 1000 }
 *               iconUrl: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: Badge updated successfully
 *       400:
 *         description: At least one field must be provided
 *       404:
 *         description: Badge not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', updateBadge);

/**
 * @swagger
 * /badges/{id}:
 *   delete:
 *     summary: Delete a badge
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Badge deleted successfully
 *       404:
 *         description: Badge not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', deleteBadge);

/**
 * @swagger
 * /badges/{id}/assign:
 *   post:
 *     summary: Assign badge to a user
 *     tags: [Badges]
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
 *             required: [userId]
 *             properties:
 *               userId: { type: integer }
 *     responses:
 *       201:
 *         description: Badge assigned successfully
 *       400:
 *         description: User already has this badge or invalid input
 *       404:
 *         description: Badge or user not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/assign', assignBadge);

/**
 * @swagger
 * /badges/{id}/users:
 *   get:
 *     summary: List users with this badge
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of users with badge
 *       404:
 *         description: Badge not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/users', listUsersWithBadge);

/**
 * @swagger
 * /badges/{id}/users/{userId}:
 *   delete:
 *     summary: Remove badge from user
 *     tags: [Badges]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Badge removed successfully
 *       404:
 *         description: Badge or assignment not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/users/:userId', removeBadgeFromUser);

export default router;
