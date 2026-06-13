import { Router }                       from 'express';
import labelsRoutes                     from './labels';
import assignmentsRouter                from './assignments';
import { requireWorkspaceMember }       from '../../../middleware/rbac';
import { columnContext, taskContext }   from '../../../middleware/workspaceContext';
import { listComments, createComment }  from '../controller/comments';
import {
  reorderColumnTasks, listColumnTasks,
  createColumnTask, getTask,
  updateTask, deleteTask, moveTask
} from '../controller/tasks';

const tasksRouter = Router();

tasksRouter.use('/:columnId/tasks/:taskId/labels', columnContext, taskContext, labelsRoutes);
tasksRouter.use('/:columnId/tasks/:taskId/assignments', columnContext, taskContext, assignmentsRouter);

/**
 * @swagger
 * /columns/{columnId}/tasks:
 *   get:
 *     summary: List tasks in a column (ordered, paginated)
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: take
 *         schema: { type: integer, default: 42, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated tasks list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Column not found
 */
tasksRouter.get('/:columnId/tasks', columnContext, listColumnTasks);

/**
 * @swagger
 * /columns/{columnId}/tasks:
 *   post:
 *     summary: Create a task in a column
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *             required: [title]
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, maxLength: 10000 }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH], default: MEDIUM }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Column not found
 */
tasksRouter.post('/:columnId/tasks', columnContext, requireWorkspaceMember, createColumnTask);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}:
 *   get:
 *     summary: Get task detail
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
 *         description: Task detail
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
tasksRouter.get('/:columnId/tasks/:taskId', columnContext, taskContext, getTask);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}:
 *   patch:
 *     summary: Update task fields
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, maxLength: 10000 }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               isDone: { type: boolean }
 *     responses:
 *       200:
 *         description: Task updated
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
tasksRouter.patch('/:columnId/tasks/:taskId', columnContext, taskContext, requireWorkspaceMember, updateTask);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task
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
 *         description: Task deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
tasksRouter.delete('/:columnId/tasks/:taskId', columnContext, taskContext, requireWorkspaceMember, deleteTask);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/move:
 *   patch:
 *     summary: Move task to another column
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetColumnId]
 *             properties:
 *               targetColumnId: { type: integer }
 *               afterTaskId: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Task moved
 *       400:
 *         description: Invalid input or column not in same workspace
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
tasksRouter.patch('/:columnId/tasks/:taskId/move', columnContext, taskContext, requireWorkspaceMember, moveTask);

/**
 * @swagger
 * /columns/{columnId}/tasks/reorder:
 *   patch:
 *     summary: Bulk reorder tasks within a column
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *             required: [tasks]
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id, order]
 *                   properties:
 *                     id: { type: integer }
 *                     order: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Tasks reordered
 *       400:
 *         description: Invalid payload
 *       403:
 *         description: Forbidden
 */
tasksRouter.patch('/:columnId/tasks/reorder', columnContext, requireWorkspaceMember, reorderColumnTasks);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/comments:
 *   get:
 *     summary: List comments for a task
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
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: take
 *         schema: { type: integer, default: 42 }
 *     responses:
 *       200:
 *         description: Comment list
 *       403:
 *         description: Forbidden
 */
tasksRouter.get('/:columnId/tasks/:taskId/comments', columnContext, taskContext, listComments);

/**
 * @swagger
 * /columns/{columnId}/tasks/{taskId}/comments:
 *   post:
 *     summary: Add a comment to a task
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, minLength: 1, maxLength: 10000 }
 *     responses:
 *       201:
 *         description: Comment created
 *       403:
 *         description: Forbidden
 */
tasksRouter.post('/:columnId/tasks/:taskId/comments', columnContext, taskContext, requireWorkspaceMember, createComment);

export default tasksRouter;
