import { prisma }           from '../../../lib/prisma';
import { ApiError }         from '../../../utils/ApiError';
import { getWorkspaceRole } from '../../../middleware/rbac';
import { WorkspaceRole }    from '@prisma/client';
import type {
  Request,
  Response,
  NextFunction
} from 'express';
import {
  idSchema,
  parseOrThrow,
  parseQueryString
} from '../../../validations/utils';

export function parseMentions(content: string): string[]
{
    const matches = content.match(/@([a-zA-Z0-9_-]+)/g);
    if (!matches)
      return [];
    return [...new Set(matches.map(m => m.slice(1)))];
}

export async function resolveMentionUsers(usernames: string[], workspaceId: number): Promise<number[]>
{
    if (usernames.length === 0)
        return [];
    const users = await prisma.user.findMany({
        where: {
            username: { in: usernames },
            workspaceMemberships: {
                some: { workspaceId }
            }
        },
        select: { id: true }
    });
    return users.map(u => u.id);
}

async function resolveCommentWorkspace(commentId: number)
{
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { task: { select: { id: true, title: true, column: { select: { workspaceId: true, name: true } } } } }
  });
  if (!comment)
    throw new ApiError(404, 'Comment not found');
  return comment;
}

export async function deleteComment(req: Request, res: Response, next: NextFunction)
{
  try {
    const commentId = parseOrThrow(idSchema, 'CommentID', req.params.id);
    const taskComment = await resolveCommentWorkspace(commentId);
    const workspaceId = taskComment.task.column.workspaceId;
    const role = await getWorkspaceRole(workspaceId, req.user!.id);

    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't delete comments");

    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing)
      throw new ApiError(404, 'Comment not found');

    if (existing.authorId !== req.user!.id)
      throw new ApiError(403, 'You can only delete your own comments');

    await prisma.$transaction(async (tx) => {
      await tx.comment.delete({ where: { id: commentId } });
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { next(err); }
}
