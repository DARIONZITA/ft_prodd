import { Router }					from 'express';
import membersRoutes				from './members';
import columnsRoutes				from './columns';
import labelsRoutes					from './labels';
import workspaceContext				from '../../../middleware/workspaceContext';
import { requireWorkspaceAdmin }	from '../../../middleware/rbac';
import {
	createWorkspace, deleteWorkspace,
	getWorkspaceDashboard, updateWorkspace
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
workspaceRouter.post('/', createWorkspace);

/**
 * @swagger
 * /workspaces/{workspaceId}:
 *   patch:
 *     summary: Update workspace details
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
workspaceRouter.patch('/:workspaceId', workspaceContext, requireWorkspaceAdmin, updateWorkspace);

/**
 * @swagger
 * /workspaces/{workspaceId}:
 *   delete:
 *     summary: Delete a workspace
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
 *         description: Workspace deleted
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Workspace not found
 */
workspaceRouter.delete('/:workspaceId', workspaceContext, requireWorkspaceAdmin, deleteWorkspace);

export default workspaceRouter;
