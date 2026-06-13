import { Router }                   from 'express';
import { requireWorkspaceMember }   from '../../../middleware/rbac';
import {
    listAssignedUsers,
    assignTask,
    unassignTask
} from '../controller/assignments';

const assignmentsRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/assignments:
 *   get:
 *     summary: List assigned users
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assignment list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
assignmentsRouter.get('/', listAssignedUsers);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/assignments/{userId}:
 *   post:
 *     summary: Assign a user to the task
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
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: User assigned
 *       400:
 *         description: Already assigned or invalid
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task or user not found
 */
assignmentsRouter.post('/:userId', requireWorkspaceMember, assignTask);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/assignments/{userId}:
 *   delete:
 *     summary: Unassign a user
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
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User unassigned
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
assignmentsRouter.delete('/:userId', requireWorkspaceMember, unassignTask);

export default assignmentsRouter;
