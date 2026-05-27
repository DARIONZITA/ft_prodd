import { Router }									from 'express';
import { authenticate }								from '../../../middleware/auth';
import {
	createWorkspace, createWorkspaceMember,
	deleteWorkspace, deleteWorkspaceMember,
	getWorkspaceDetails, getWorkspaceMember,
	listUserWorkspaces, listWorkspaceMembers,
	updateWorkspace, updateWorkspaceMemberRole }	from '../controller/workspaces';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, maxLength: 1000 }
 *     responses:
 *       201:
 *         description: Workspace created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', createWorkspace);

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: List all user workspaces
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Workspace list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Workspace' }
 *       401:
 *         description: Unauthorized
 */
router.get('/', listUserWorkspaces);

/**
 * @swagger
 * /workspaces/{id}:
 *   put:
 *     summary: Update workspace details
 *     tags: [Workspaces]
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
 *               description: { type: string, maxLength: 1000 }
 *     responses:
 *       200:
 *         description: Workspace updated
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Workspace not found
 */
router.put('/:id', updateWorkspace);

/**
 * @swagger
 * /workspaces/{id}:
 *   delete:
 *     summary: Delete a workspace
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Workspace deleted
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Workspace not found
 */
router.delete('/:id', deleteWorkspace);


/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     summary: Get workspace details with members, activity logs, and task counts
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Workspace details with members and activity logs
 *       404:
 *         description: Workspace not found
 *       403:
 *         description: Forbidden
 */
router.get('/:id', getWorkspaceDetails);
/*
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2FvQGV4YW1wbGUuY29tIiwiaWF0IjoxNzc5Nzk4NjI2LCJleHAiOjE3Nzk4ODUwMjZ9.FTP796yPtAjqRtvczKSCYsCdLxA_SMagNWg_AHHERlk
*/

/**
 * @swagger
 * /workspaces/{id}/members:
 *   post:
 *     summary: Add member to workspace
 *     tags: [Workspaces]
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
 *               role: { type: string, enum: [admin, member, guest], default: member }
 *     responses:
 *       201:
 *         description: Member added
 *       400:
 *         description: User already member or invalid input
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: User not found
 */
router.post('/:id/members', createWorkspaceMember);


/**
 * @swagger
 * /workspaces/{id}/members:
 *   get:
 *     summary: List workspace members
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Member list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workspace not found
 */
router.get('/:id/members', listWorkspaceMembers);


/**
 * @swagger
 * /workspaces/{id}/members/{userId}:
 *   get:
 *     summary: Get member details
 *     tags: [Workspaces]
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
 *         description: Member details
 *       404:
 *         description: Member not found
 */
router.get('/:id/members/:userId', getWorkspaceMember);

/**
 * @swagger
 * /workspaces/{id}/members/{userId}:
 *   put:
 *     summary: Update a member role
 *     tags: [Workspaces]
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [admin, member, guest] }
 *     responses:
 *       200:
 *         description: Member updated
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Member not found
 */
router.put('/:id/members/:userId', updateWorkspaceMemberRole);

/**
 * @swagger
 * /workspaces/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a workspace member
 *     tags: [Workspaces]
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
 *         description: Member removed
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Member not found
 */
router.delete('/:id/members/:userId', deleteWorkspaceMember);

export default router;
