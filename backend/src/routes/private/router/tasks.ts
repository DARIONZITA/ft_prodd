import { Router }                       from 'express';
import labelsRoutes                     from './labels';
import assignmentsRouter                from './assignments';
import { requireWorkspaceMember }       from '../../../middleware/rbac';
import { columnContext, taskContext }   from '../../../middleware/workspaceContext';
import { listComments, createComment }  from '../controller/comments';
import {
  getTask, updateTask, deleteTask, moveTask,
  listAssignments, createAssignment, deleteAssignment,
  listChecklist, createChecklistItem, updateChecklistItem,
  deleteChecklistItem, listTaskLabels, attachLabel, detachLabel,
  listTaskComments, createTaskComment
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
 * /tasks/{id}:
 *   get:
 *     summary: Get task detail
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.get('/:id', getTask);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update task fields
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               columnId: { type: integer }
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
router.patch('/:id', updateTask);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.delete('/:id', deleteTask);

/**
 * @swagger
 * /tasks/{id}/move:
 *   patch:
 *     summary: Move task to another column
 *     tags: [Tasks]
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
 *             required: [columnId]
 *             properties:
 *               columnId: { type: integer }
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
router.patch('/:id/move', moveTask);



// ── Assignments ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /tasks/{id}/assignments:
 *   get:
 *     summary: List assigned users
 *     tags: [Task Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Assignment list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
router.get('/:id/assignments', listAssignments);

/**
 * @swagger
 * /tasks/{id}/assignments/{userId}:
 *   post:
 *     summary: Assign a user to the task
 *     tags: [Task Assignments]
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
 *       201:
 *         description: User assigned
 *       400:
 *         description: Already assigned or invalid
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task or user not found
 */
router.post('/:id/assignments/:userId', createAssignment);

/**
 * @swagger
 * /tasks/{id}/assignments/{userId}:
 *   delete:
 *     summary: Unassign a user
 *     tags: [Task Assignments]
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
 *         description: User unassigned
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
router.delete('/:id/assignments/:userId', deleteAssignment);



// ── Checklist ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /tasks/{id}/checklist:
 *   get:
 *     summary: Get checklist items
 *     tags: [Task Checklist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Checklist items
 *       403:
 *         description: Forbidden
 */
router.get('/:id/checklist', listChecklist);

/**
 * @swagger
 * /tasks/{id}/checklist:
 *   post:
 *     summary: Add a checklist item
 *     tags: [Task Checklist]
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
 *             required: [text]
 *             properties:
 *               text: { type: string, minLength: 1, maxLength: 500 }
 *     responses:
 *       201:
 *         description: Item created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 */
router.post('/:id/checklist', createChecklistItem);

/**
 * @swagger
 * /tasks/{id}/checklist/{itemId}:
 *   patch:
 *     summary: Update checklist item text or completion
 *     tags: [Task Checklist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               text: { type: string, minLength: 1, maxLength: 500 }
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
router.patch('/:id/checklist/:itemId', updateChecklistItem);

/**
 * @swagger
 * /tasks/{id}/checklist/{itemId}:
 *   delete:
 *     summary: Remove a checklist item
 *     tags: [Task Checklist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.delete('/:id/checklist/:itemId', deleteChecklistItem);



// ── Labels ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /tasks/{id}/labels:
 *   get:
 *     summary: Get labels attached to a task
 *     tags: [Task Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Label list
 *       403:
 *         description: Forbidden
 */
router.get('/:id/labels', listTaskLabels);

/**
 * @swagger
 * /tasks/{id}/labels/{labelId}:
 *   post:
 *     summary: Attach a label to the task
 *     tags: [Task Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.post('/:id/labels/:labelId', attachLabel);

/**
 * @swagger
 * /tasks/{id}/labels/{labelId}:
 *   delete:
 *     summary: Detach a label from the task
 *     tags: [Task Labels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.delete('/:id/labels/:labelId', detachLabel);



// ── Comments ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /tasks/{id}/comments:
 *   get:
 *     summary: List comments for a task
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.get('/:id/comments', listTaskComments);

/**
 * @swagger
 * /tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments]
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
 *             required: [content]
 *             properties:
 *               content: { type: string, minLength: 1, maxLength: 10000 }
 *     responses:
 *       201:
 *         description: Comment created
 *       403:
 *         description: Forbidden
 */
router.post('/:id/comments', createTaskComment);

export default router;
