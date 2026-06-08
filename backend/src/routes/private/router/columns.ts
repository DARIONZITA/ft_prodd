import { Router }       from 'express';
import { authenticate } from '../../../middleware/auth';
import {
  listColumnTasks,
  createColumnTask,
  reorderColumnTasks
} from '../controller/columns';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /columns/{id}/tasks:
 *   get:
 *     summary: List tasks in a column (ordered)
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
 *         description: Tasks list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Column not found
 */
router.get('/:id/tasks', listColumnTasks);

/**
 * @swagger
 * /columns/{id}/tasks:
 *   post:
 *     summary: Create a task in a column
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
 *             required: [title]
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, maxLength: 10000 }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH] }
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
router.post('/:id/tasks', createColumnTask);

/**
 * @swagger
 * /columns/{id}/tasks/reorder:
 *   patch:
 *     summary: Bulk reorder tasks within a column
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
router.patch('/:id/tasks/reorder', reorderColumnTasks);

export default router;
