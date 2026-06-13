import { Router }                                   from 'express';
import { requireWorkspaceAdmin }                    from '../../../middleware/rbac';
import { labelContext, columnContext, taskContext } from '../../../middleware/workspaceContext';
import {
    listWorkspaceLabels, createLabel, updateLabel,
    deleteLabel, listTaskLabels, attachLabel,
    detachLabel
} from '../controller/labels';

const labelRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /workspaces/{workspaceId}/labels:
 *   get:
 *     summary: List workspace labels
 *     tags: [Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Labels list
 *       403:
 *         description: Forbidden
 */
labelRouter.get('/', listWorkspaceLabels);

/**
 * @swagger
 * /workspaces/{workspaceId}/labels:
 *   post:
 *     summary: Create a label (admins only)
 *     tags: [Labels]
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
 *             required: [name, color]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               color:
 *                 type: string
 *                 enum: [red, orange, yellow, green, blue, purple, pink, cyan, teal, indigo, lime, gray, brown]
 *     responses:
 *       201:
 *         description: Label created
 *       400:
 *         description: Invalid color value
 *       403:
 *         description: Only admins can perform this action
 *       409:
 *         description: Label with this name already exists in the workspace
 */
labelRouter.post('/', requireWorkspaceAdmin, createLabel);

/**
 * @swagger
 * /workspaces/{workspaceId}/labels/{labelId}:
 *   patch:
 *     summary: Update a label (admins only)
 *     tags: [Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               color:
 *                 type: string
 *                 enum: [red, orange, yellow, green, blue, purple, pink, cyan, teal, indigo, lime, gray, brown]
 *     responses:
 *       200:
 *         description: Label updated
 *       400:
 *         description: Invalid color value
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Label not found
 *       409:
 *         description: Label with this name already exists in the workspace
 */
labelRouter.patch('/:labelId', labelContext, requireWorkspaceAdmin, updateLabel);

/**
 * @swagger
 * /workspaces/{workspaceId}/labels/{labelId}:
 *   delete:
 *     summary: Delete a label (admins only)
 *     tags: [Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Label deleted
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Label not found
 */
labelRouter.delete('/:labelId', labelContext, requireWorkspaceAdmin, deleteLabel);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/labels:
 *   get:
 *     summary: Get labels attached to a task
 *     tags: [Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Label list
 *       403:
 *         description: Forbidden
 */
labelRouter.get('/', listTaskLabels);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/labels/{labelId}:
 *   post:
 *     summary: Attach a label to the task
 *     tags: [Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Label attached
 *       400:
 *         description: Already attached or label not in workspace
 *       403:
 *         description: Forbidden
 */
labelRouter.post('/:labelId', labelContext, requireWorkspaceAdmin, attachLabel);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/labels/{labelId}:
 *   delete:
 *     summary: Detach a label from the task
 *     tags: [Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Label detached
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Label not attached
 */
labelRouter.delete('/:labelId', labelContext, requireWorkspaceAdmin, detachLabel);

export default labelRouter;
