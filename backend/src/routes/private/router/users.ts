import { Router }				from 'express';
import { uploadAvatar }			from '../../../middleware/uploadAvatar';
import { listUserFriends }		from '../controller/friends';
import { listUserWorkspaces }	from '../controller/workspaces';
import {
	deleteUserAccount, getUserProfile,
	listUsers, updateUserProfile
} from '../controller/users';
import { listUserWorkspaces }	from '../controller/workspaces';
import { listUserFriends }		from '../controller/friends';

const userRouter = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', listUsers);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get own user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 * */

router.get('/me', getUserProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update own user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileRequest'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'   # ← Mudado para User (que existe)
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.patch('/me', uploadAvatar('avatar'), updateUserProfile);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Delete own user account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 * */
router.delete('/me', deleteUserAccount);

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
 * /users/{id}/friends:
 *   get:
 *     summary: List friends or friend requests for a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         description: Filter by status - default to accepted
 *         schema: { type: string, enum: [accepted, pending], default: accepted }
 *       - in: query
 *         name: type
 *         description: Direction relative to the user (incoming/outgoing). Only usable when viewing your own pending requests
 *         schema: { type: string, enum: [incoming, outgoing] }
 *     responses:
 *       200:
 *         description: Friend list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FriendListResponse'
 *       403:
 *         description: Not authorized to view this user's friends / pending requests
 *       404:
 *         description: User not found
 */
router.get('/:id/friends', listUserFriends);

/**
 * @swagger
 * /users/{id}/workspaces:
 *   get:
 *     summary: List workspaces for a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Target user ID
 *     responses:
 *       200:
 *         description: Workspace list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserWorkspaceListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Must be friends to view this user's workspaces
 *       404:
 *         description: User not found
 */
router.get('/:id/workspaces', listUserWorkspaces);

export default router;
