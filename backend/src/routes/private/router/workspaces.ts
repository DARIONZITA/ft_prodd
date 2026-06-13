import { Router }					from 'express';
import membersRoutes				from './members';
import columnsRoutes				from './columns';
import labelsRoutes					from './labels';
import workspaceContext				from '../../../middleware/workspaceContext';
import { requireWorkspaceAdmin }	from '../../../middleware/rbac';
import {
	requireWorkspaceAdmin,
	requireWorkspaceMember,
	requireWorkspaceAccess
} from '../../../middleware/rbac';
import {
	createWorkspace, createWorkspaceMember,
	deleteWorkspace, deleteWorkspaceMember,
	getWorkspaceDetails, getWorkspaceMember,
	listUserWorkspaces, listWorkspaceMembers,
	updateWorkspace, updateWorkspaceMemberRole,
	listWorkspaceColumns
} from '../controller/workspaces';

const workspaceRouter = Router({ mergeParams: true });

workspaceRouter.use('/:workspaceId/members', workspaceContext, membersRoutes);
workspaceRouter.use('/:workspaceId/columns', workspaceContext, columnsRoutes);
workspaceRouter.use('/:workspaceId/labels', workspaceContext, labelsRoutes);

/**
 * @swagger
 * /workspaces/{workspaceId}/dashboard:
 *   get:
 *     summary: Get workspace dashboard with columns, tasks, labels and assignments
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Workspace dashboard data
 *       404:
 *         description: Workspace not found
 *       403:
 *         description: Forbidden
 */
workspaceRouter.get('/:workspaceId/dashboard', workspaceContext, getWorkspaceDashboard);

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
router.put('/:id', requireWorkspaceAdmin, updateWorkspace);

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
router.delete('/:id', requireWorkspaceAdmin, deleteWorkspace);

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



/* MEMBERS */

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
router.post('/:id/members', requireWorkspaceAdmin, createWorkspaceMember);

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
router.put('/:id/members/:userId', requireWorkspaceAdmin, updateWorkspaceMemberRole);

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
router.delete('/:id/members/:userId', requireWorkspaceAdmin, deleteWorkspaceMember);



/* COLUMNS */

/**
 * @swagger
 * /workspaces/{id}/columns:
 *   get:
 *     summary: List workspace columns (ordered by position)
 *     tags: [Columns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Columns list ordered by position
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workspace not found
 */
router.get('/:id/columns', requireWorkspaceAccess, listWorkspaceColumns);

/**
 * @swagger
 * /workspaces/{id}/columns:
 *   post:
 *     summary: Create a new column (admins only)
 *     tags: [Columns]
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
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *     responses:
 *       201:
 *         description: Column created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only admins can perform this action
 */
router.post('/:id/columns', requireWorkspaceAdmin, createColumn);

/**
 * @swagger
 * /workspaces/{id}/columns/reorder:
 *   patch:
 *     summary: Bulk reorder columns (admins and members only)
 *     tags: [Columns]
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
 *             required: [columns]
 *             properties:
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id, order]
 *                   properties:
 *                     id: { type: integer }
 *                     order: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Columns reordered
 *       400:
 *         description: Invalid payload
 *       403:
 *         description: Only admins can perform this action
 */
router.patch('/:id/columns/reorder', requireWorkspaceMember, reorderColumns);

/**
 * @swagger
 * /workspaces/{id}/columns/{columnId}:
 *   patch:
 *     summary: Update column name or order (admins and members only)
 *     tags: [Columns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               order: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Column updated
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only admins and members can perform this action
 *       404:
 *         description: Column not found
 */
router.patch('/:id/columns/:columnId', requireWorkspaceMember, updateColumn);

/**
 * @swagger
 * /workspaces/{id}/columns/{columnId}:
 *   delete:
 *     summary: Delete a column (admins only)
 *     tags: [Columns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Column deleted
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Column not found
 */
router.delete('/:id/columns/:columnId', requireWorkspaceAdmin, deleteColumn);



/* TASKS */

/**
 * @swagger
 * /workspaces/{id}/tasks:
 *   get:
 *     summary: List all tasks in a workspace (filterable)
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: columnId
 *         schema: { type: integer }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *       - in: query
 *         name: assignee
 *         schema: { type: integer }
 *       - in: query
 *         name: isDone
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Tasks list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workspace not found
 */
router.get('/:id/tasks', requireWorkspaceAccess, listWorkspaceTasks);

export default router;

