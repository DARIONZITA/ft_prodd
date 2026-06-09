import { Router }       from 'express';
import { authenticate } from '../../../middleware/auth';
import {
  deleteComment,
  listMentions
} from '../controller/comments';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Forbidden (not your comment)
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', deleteComment);

/**
 * @swagger
 * /comments/{id}/mentions:
 *   get:
 *     summary: Get mentions in a comment
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Mention list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 */
router.get('/:id/mentions', listMentions);

export default router;
