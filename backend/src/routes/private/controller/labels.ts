import type { Request, Response, NextFunction } from 'express';
import { NotificationType }                     from '@prisma/client';
import { prisma }                               from '../../../lib/prisma';
import { ApiError }                             from '../../../utils/ApiError';
import { LabelColor }                           from '../../../types/constants';
import { parseQueryEnum, parseQueryString }     from '../../../validations/utils';
import { notify } from '../../../utils/notify';

export async function listWorkspaceLabels(req: Request, res: Response, next: NextFunction)
{
    try {
        const labels = await prisma.label.findMany({
            where: { workspaceId: req.workspace!.id },
            orderBy: { name: 'asc' }
        });

        res.json({ success: true, data: labels });
    }
    catch (err) { next(err); }
}

export async function createLabel(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const name = parseQueryString('createLabel() name', req.body.name, { isOptional: false, minLength: 1, maxLength: 255 })!;
        const color = parseQueryEnum('createLabel() color', req.body.color, LabelColor, { isOptional: false })!;

        const label = await prisma.$transaction(async (tx) => {
            const existing = await tx.label.findFirst({
                where: { workspaceId, name }
            });
            if (existing)
                throw new ApiError(409, `Label "${name}" already exists in this workspace`);

            const lbl = await tx.label.create({ data: { workspaceId, name, color } });

            const members = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id } },
                select: { userId: true }
            });

            if (members.length > 0) {
                await notify(
                    {
                        userIds: members.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `Label "${name}" has been added to workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx
                );
            }

            return lbl;
        });

        res.status(201).json({ success: true, data: label });
    }
    catch (err) { next(err); }
}

export async function updateLabel(req: Request, res: Response, next: NextFunction)
{
    try {
        const labelId = req.label!.id;
        const workspaceId = req.workspace!.id;
        const name = parseQueryString('updateLabel() name', req.body.name, { isOptional: true, minLength: 1, maxLength: 255 });
        const color = parseQueryEnum('updateLabel() color', req.body.color, LabelColor, { isOptional: true });

        if (name === undefined && color === undefined)
            throw new ApiError(400, 'At least one field (name or color) must be provided');
        
        const label = await prisma.$transaction(async (tx) => {
            const lbl = await tx.label.update({
                where: { id: labelId },
                data: {
                    ...(name !== undefined && { name }),
                    ...(color !== undefined && { color })
                }
            });

            const members = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id } },
                select: { userId: true }
            });

            if (members.length > 0) {
                const changes: string[] = [];
                if (name !== undefined) changes.push(`name changed to "${name}"`);
                if (color !== undefined) changes.push(`color changed to "${color}"`);

                await notify(
                    {
                        userIds: members.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `Label "${req.label!.name}" updated: ${changes.join(', ')} in workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx
                );
            }

            return lbl;
        });

        res.json({ success: true, data: label });
    }
    catch (err) { next(err); }
}

export async function deleteLabel(req: Request, res: Response, next: NextFunction)
{
    try {
        const labelId = req.label!.id;
        const workspaceId = req.workspace!.id;
        
        await prisma.$transaction(async (tx) => {
            const members = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id } },
                select: { userId: true }
            });

            await tx.label.delete({ where: { id: labelId } });

            if (members.length > 0) {
                await notify(
                    {
                        userIds: members.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `Label "${req.label!.name}" has been removed from workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx
                );
            }
        });

        res.json({ success: true, message: 'Label deleted successfully' });
    }
    catch (err) { next(err); }
}

export async function listTaskLabels(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskLabels = await prisma.taskLabel.findMany({
      where: { taskId: req.task!.id },
      include: { label: true }
    });

    res.json({ success: true, data: taskLabels });
  } catch (err) { next(err); }
}

export async function attachLabel(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task!.id;
    const labelId = req.label!.id;
    const workspaceId = req.workspace!.id;

    const taskLabel = await prisma.$transaction(async (tx) => {
      const existing = await tx.taskLabel.findUnique({
        where: { taskId_labelId: { taskId, labelId } }
      });
      if (existing)
        throw new ApiError(400, 'Label already attached to this task');

      const tl = await tx.taskLabel.create({
        data: { taskId, labelId },
        include: { label: true }
      });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await notify(
            {
                userIds: members.map(m => m.userId),
                type: NotificationType.task,
                message: `${req.user!.username} attached label "${req.label!.name}" to task "${req.task!.title}" in workspace "${req.workspace!.name}"`
            },
            tx
        );
      }

      return tl;
    });

    res.status(201).json({ success: true, data: taskLabel });
  } catch (err) { next(err); }
}

export async function detachLabel(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task!.id;
    const labelId = req.label!.id;
    const workspaceId = req.workspace!.id;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.taskLabel.findUnique({
        where: { taskId_labelId: { taskId, labelId } }
      });
      if (!existing)
        throw new ApiError(404, 'Label not attached to this task');

      await tx.taskLabel.delete({ where: { id: existing.id } });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await notify(
            {
                userIds: members.map(m => m.userId),
                type: NotificationType.task,
                message: `${req.user!.username} detached label "${req.label!.name}" from task "${req.task!.title}" in workspace "${req.workspace!.name}"`
            },
            tx
        );
      }
    });

    res.json({ success: true, message: 'Label detached successfully' });
  } catch (err) { next(err); }
}
