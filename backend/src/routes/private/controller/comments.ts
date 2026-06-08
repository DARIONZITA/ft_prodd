import { prisma }           from '../../../lib/prisma';
import { ApiError }         from '../../../utils/ApiError';
import { getWorkspaceRole } from '../../../middleware/rbac';
import {
  WorkspaceRole,
  NotificationType
} from '@prisma/client';
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

export async function updateComment(req: Request, res: Response, next: NextFunction)
{
  try {
    const commentId = parseOrThrow(idSchema, 'CommentID', req.params.id);
    const taskComment = await resolveCommentWorkspace(commentId);
    const workspaceId = taskComment.task.column.workspaceId;
    const role = await getWorkspaceRole(workspaceId, req.user!.id);

    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't update comments");

    const content = parseQueryString('content', req.body.content, { isOptional: false, minLength: 1, maxLength: 10000 })!;

    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing)
      throw new ApiError(404, 'Comment not found');

    if (existing.authorId !== req.user!.id)
      throw new ApiError(403, 'You can only edit your own comments');

    const mentionedUsernames = parseMentions(content);

    const comment = await prisma.$transaction(async (tx) => {
      const existingMentions = await tx.commentMention.findMany({
          where: { commentId },
          select: { userId: true }
      });

      const existingUserIds = new Set(existingMentions.map(m => m.userId));
      const mentionedUserIds = await resolveMentionUsers(mentionedUsernames, workspaceId);
      const newUserIds = new Set(mentionedUserIds);

      const toAdd = mentionedUserIds.filter(id => !existingUserIds.has(id));
      const toRemove = [...existingUserIds].filter(id => !newUserIds.has(id));

      if (toRemove.length > 0)
          await tx.commentMention.deleteMany({
              where: { commentId, userId: { in: toRemove } }
          });

      if (toAdd.length > 0) {
          await tx.commentMention.createMany({
              data: toAdd.map(userId => ({ commentId, userId }))
          });

          await tx.notification.createMany({
              data: toAdd.map(userId => ({
                  userId,
                  message: `${req.user!.username} mentioned you in a comment on task "${taskComment.task.title}" from column "${taskComment.task.column.name}"`,
                  type: NotificationType.mention,
                  relatedTaskId: taskComment.task.id,
                  relatedWorkspaceId: workspaceId
              }))
          });
      }

      return tx.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          commentMentions: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } }
        }
      });
    });

    res.json({ success: true, data: comment });
  } catch (err) { next(err); }
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
      await tx.commentMention.deleteMany({ where: { commentId } });
      await tx.comment.delete({ where: { id: commentId } });
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { next(err); }
}

export async function listMentions(req: Request, res: Response, next: NextFunction)
{
  try {
    const commentId = parseOrThrow(idSchema, 'CommentID', req.params.id);
    const taskComment = await resolveCommentWorkspace(commentId);
    const workspaceId = taskComment.task.column.workspaceId;
    await getWorkspaceRole(workspaceId, req.user!.id);

    const mentions = await prisma.commentMention.findMany({
      where: { commentId },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } }
    });

    res.json({ success: true, data: mentions });
  } catch (err) { next(err); }
}
