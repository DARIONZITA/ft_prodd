import { Router }                   from 'express';
import { requireWorkspaceMember }   from '../../../middleware/rbac';
import {
    getChecklist, createChecklistItem,
    updateChecklistItem, deleteChecklistItem
} from '../controller/checklists';

const checklistsRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/checklists:
 *   get:
 *     summary: Get checklist items
 *     tags: [Tasks]
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
 *         description: Checklist items
 *       403:
 *         description: Forbidden
 */
checklistsRouter.get('/', getChecklist);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/checklists:
 *   post:
 *     summary: Add a checklist item
 *     tags: [Tasks]
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
 *       - in: query
 *         name: description
 *         required: true
 *         schema: { type: string, minLength: 1, maxLength: 500 }
 *     responses:
 *       201:
 *         description: Item created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 */
checklistsRouter.post('/', requireWorkspaceMember, createChecklistItem);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/checklists/{itemId}:
 *   patch:
 *     summary: Update checklist item description or completion
 *     tags: [Tasks]
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
 *         name: itemId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string, minLength: 1, maxLength: 500 }
 *               isCompleted: { type: boolean }
 *     responses:
 *       200:
 *         description: Item updated
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 */
checklistsRouter.patch('/:itemId', requireWorkspaceMember, updateChecklistItem);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/checklists/{itemId}:
 *   delete:
 *     summary: Remove a checklist item
 *     tags: [Tasks]
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
 *         name: itemId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Item removed
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 */
checklistsRouter.delete('/:itemId', requireWorkspaceMember, deleteChecklistItem);

export default checklistsRouter;
