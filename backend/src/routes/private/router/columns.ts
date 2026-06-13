import { Router }   		from 'express';
import { columnContext }	from '../../../middleware/workspaceContext';
import {
	requireWorkspaceAdmin,
	requireWorkspaceMember
} from '../../../middleware/rbac';
import {
	updateColumn, deleteColumn,
	reorderColumns, listColumns,
	createColumn
} from '../controller/columns';

const columnsRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /workspaces/{workspaceId}/columns:
 *   get:
 *     summary: List workspace columns (ordered by position)
 *     tags: [Columns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
columnsRouter.get('/', listColumns);

/**
 * @swagger
 * /workspaces/{workspaceId}/columns:
 *   post:
 *     summary: Create a new column (admins only)
 *     tags: [Columns]
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
columnsRouter.post('/', requireWorkspaceAdmin, createColumn);

/**
 * @swagger
 * /workspaces/{workspaceId}/columns/{columnId}:
 *   patch:
 *     summary: Update column name or order (admins and members only)
 *     tags: [Columns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: columnId
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
 *       200:
 *         description: Column renamed
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only admins and members can perform this action
 *       404:
 *         description: Column not found
 */
columnsRouter.patch('/:columnId', columnContext, requireWorkspaceMember, updateColumn);

/**
 * @swagger
 * /workspaces/{workspaceId}/columns/reorder:
 *   patch:
 *     summary: Bulk reorder columns (admins and members only)
 *     tags: [Columns]
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
columnsRouter.patch('/reorder', requireWorkspaceMember, reorderColumns);

/**
 * @swagger
 * /workspaces/{workspaceId}/columns/{columnId}:
 *   delete:
 *     summary: Delete a column (admins only)
 *     tags: [Columns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
columnsRouter.delete('/:columnId', columnContext, requireWorkspaceAdmin, deleteColumn);

export default columnsRouter;
