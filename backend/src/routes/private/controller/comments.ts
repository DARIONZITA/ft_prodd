import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../../lib/prisma';
import { parseQueryInt, parseQueryString }      from '../../../validations/utils';
import { NotificationType }                     from '@prisma/client';
import { wsEmitter } from '../../../ws/backend/emitter';
import { notify } from '../../../utils/notify';

function parseMentions(content: string): string[]
{
    const matches = content.match(/@([a-zA-Z0-9_-]+)/g);
    if (!matches)
      return [];
    return [...new Set(matches.map(m => m.slice(1)))];
}

async function resolveMentionUsers(usernames: string[], workspaceId: number): Promise<number[]>
{
    if (!usernames.length)
        return [];
    const users = await prisma.user.findMany({
        where: {
            username: { in: usernames },
            workspaceMemberships: { some: { workspaceId } }
        },
        select: { id: true }
    });
    return users.map(u => u.id);
}

export async function listComments(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task?.id;
    const skip = parseQueryInt('skip', req.query.skip, { default: 0, isOptional: true, min: 0 });
    const take = parseQueryInt('take', req.query.take, { default: 42, isOptional: true, min: 1, max: 100 });

    const [comments, total] = await prisma.$transaction([
        prisma.comment.findMany({
            where: { taskId },
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { createdAt: 'asc' },
            skip,
            take
        }),
        prisma.comment.count({ where: { taskId } })
    ]);

    res.json({ success: true, data: { comments, pagination: { skip, take, total } } });
  } catch (err) { next(err); }
}

export async function createComment(req: Request, res: Response, next: NextFunction)
{
  try {
    const task = req.task!;
    const workspace = req.workspace!;
    const content = parseQueryString('content', req.body.content, { isOptional: false, minLength: 1, maxLength: 10000 })!;

    const mentionedUsernames = parseMentions(content);

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: { taskId: task.id, authorId: req.user!.id, content }
      });

      const mentionedUserIds = await resolveMentionUsers(mentionedUsernames, workspace.id);
      if (mentionedUserIds.length > 0) {
        await notify(
          {
            userIds: mentionedUserIds,
            message: `${req.user!.username} mentioned you in a comment on task "${task!.title}" from column "${req.column!.name}" in workspace "${workspace.name}"`,
            type: NotificationType.mention,
            data: { taskId: task.id, commentId: c.id },
          },
          tx
        );
      }
      return c;
    });
    const commentWithUser = await prisma.comment.findUnique({
      where: { id: comment.id },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } }
    });
    wsEmitter.commentNew(workspace.id, task.id, commentWithUser, req.user!.id);
    res.status(201).json({ success: true, data: commentWithUser });
  } catch (err) { next(err); }
}
