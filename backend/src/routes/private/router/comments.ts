import { Router }         from 'express';
import { authenticate }   from '../../../middleware/auth';
import { deleteComment }  from '../controller/comments';

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

export default router;
