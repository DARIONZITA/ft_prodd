import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../../lib/prisma';
import { ApiError }                             from '../../../utils/ApiError';
import { idSchema, parseOrThrow }               from '../../../validations/utils';
import { WorkspaceRole, NotificationType }      from '@prisma/client';

export async function listAssignedUsers(req: Request, res: Response, next: NextFunction)
{
  try {
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: req.task!.id },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } }
    });

    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
}

export async function assignTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task!.id;
    const workspaceId = req.workspace!.id;
    const targetUserId = parseOrThrow(idSchema, 'assignTask() targetUserID', req.params.userId);

    const assignment = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUniqueOrThrow({ where: { id: taskId }, select: { creatorId: true } });
      const isAdmin = req.workspace?.role === WorkspaceRole.admin;
      const isCreator = req.user!.id === task.creatorId;

      if (!isAdmin && !isCreator)
        throw new ApiError(403, 'Only admins or the task creator can assign users');

      const targetUser = await tx.user.findUnique({ where: { id: targetUserId }, select: { username: true } });
      if (!targetUser)
        throw new ApiError(404, 'User not found');

      const membership = await tx.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        select: { role: true }
      });
      if (!membership)
        throw new ApiError(400, 'User is not a member of this workspace');
      if (membership.role === WorkspaceRole.guest)
        throw new ApiError(403, "Can't assign tasks to guests");

      const existing = await tx.taskAssignment.findUnique({
        where: { taskId_userId: { taskId, userId: targetUserId } }
      });
      if (existing)
        throw new ApiError(400, 'User is already assigned to this task');

      const a = await tx.taskAssignment.create({
        data: { taskId, userId: targetUserId, assignedById: req.user!.id },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } }
      });

      const isSelfAssign = req.user!.id === targetUserId;
      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        const message = isSelfAssign
          ? `${req.user!.username} self-assigned to task "${req.task!.title}" in workspace "${req.workspace!.name}"`
          : `${req.user!.username} assigned ${targetUser.username} to task "${req.task!.title}" in workspace "${req.workspace!.name}"`;

        await tx.notification.createMany({
          data: members.map(m => ({ userId: m.userId, type: NotificationType.workspace, message }))
        });
      }

      return a;
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (err) { next(err); }
}

export async function unassignTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task!.id;
    const workspaceId = req.workspace!.id;
    const targetUserId = parseOrThrow(idSchema, 'unassignTask() targetUserID', req.params.userId);

    await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({ where: { id: targetUserId }, select: { username: true } });
      if (!targetUser)
        throw new ApiError(404, 'User not found');

      const assignment = await tx.taskAssignment.findUnique({
        where: { taskId_userId: { taskId, userId: targetUserId } }
      });
      if (!assignment)
        throw new ApiError(404, 'Assignment not found');

      const isAdmin = req.workspace?.role === WorkspaceRole.admin;
      const isAssigner = req.user!.id === assignment.assignedById;

      if (!isAdmin && !isAssigner)
        throw new ApiError(403, 'Only admins or the person who assigned the task can unassign users');

      await tx.taskAssignment.delete({ where: { id: assignment.id } });

      const isSelfUnassign = req.user!.id === targetUserId;
      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        const message = isSelfUnassign
          ? `${req.user!.username} self-unassigned from task "${req.task!.title}" in workspace "${req.workspace!.name}"`
          : `${req.user!.username} unassigned ${targetUser.username} from task "${req.task!.title}" in workspace "${req.workspace!.name}"`;

        await tx.notification.createMany({
          data: members.map(m => ({ userId: m.userId, type: NotificationType.task, message }))
        });
      }
    });

    res.json({ success: true, message: 'User unassigned successfully' });
  } catch (err) { next(err); }
}
