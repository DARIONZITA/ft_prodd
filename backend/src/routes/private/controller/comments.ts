import { prisma }           from '../../../lib/prisma';
import { ApiError }         from '../../../utils/ApiError';
import { getWorkspaceRole } from '../../../middleware/rbac';
import { WorkspaceRole, NotificationType }    from '@prisma/client';
import type {
  Request,
  Response,
  NextFunction
} from 'express';
import {
  idSchema,
  parseOrThrow,
} from '../../../validations/utils';
import { wsEmitter } from '../../../ws/emitter';
import { notify } from '../../../utils/notify';

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
    include: { task: { select: { id: true, title: true, column: { select: { workspaceId: true, name: true, workspace: { select: { name: true } } } }, assignments: { select: { userId: true } } } } }
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

    wsEmitter.commentDeleted(workspaceId, taskComment.task.id, commentId);
  
    // 2. Notificação persistida para cada utilizador mencionado
    //    (excepto o próprio autor)

    const alreadyNotifiedIds = new Set<number>([req.user!.id]); // Exclude author
    const assignedUserIds = taskComment.task.assignments.map(a => a.userId);

    //--------NOTIFICATION----------

    await notify(
    {
      userIds: assignedUserIds as number[],
      message: `${req.user!.username} deleted a comment on task "${taskComment.task.title}" from column "${taskComment.task.column.name}" in workspace "${taskComment.task.column.workspace.name}"`,
      type: NotificationType.comment,
      relatedTaskId: taskComment.task.id,
      relatedWorkspaceId: workspaceId,
      data: { commentId: taskComment.id, taskTitle: taskComment.task.title, columnName: taskComment.task.column.name, workspaceName: taskComment.task.column.workspace.name }
    },
      alreadyNotifiedIds, // Exclude author
    );

    //-----------------------------

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { next(err); }
}
