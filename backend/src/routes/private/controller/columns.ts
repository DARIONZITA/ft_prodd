import type { Request, Response, NextFunction }     from 'express';
import { z }                                        from 'zod';
import { prisma }                                   from '../../../lib/prisma';
import { ApiError }                                 from '../../../utils/ApiError';
import { NotificationType }                         from '@prisma/client';
import { idSchema, parseOrThrow, parseQueryString } from '../../../validations/utils';

const orderSchema = z.array( z.object({ id: idSchema, order: z.coerce.number().int().min(0) }) ).min(1);

export async function listColumns(req: Request, res: Response, next: NextFunction)
{
  try {
    const workspaceId = req.workspace!.id;

    const columns = await prisma.column.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          orderBy: { orderInColumn: 'asc' },
          include: {
            taskLabels: {
              include: { label: { select: { name: true } } }
            },
            assignments: {
              include: { user: { select: { username: true } } }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: columns.map(col => ({
        id: col.id,
        name: col.name,
        order: col.order,
        tasks: col.tasks.map(task => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          labels: task.taskLabels.map(tl => tl.label.name),
          assignments: task.assignments.map(a => a.user.username)
        }))
      }))
    });
  } catch (err) { next(err); }
}

export async function createColumn(req: Request, res: Response, next: NextFunction)
{
  try {
    const workspaceId = req.workspace!.id;
    const name = parseQueryString('createColumn() name', req.body.name, { isOptional: false, minLength: 1, maxLength: 255 })!;

    const column = await prisma.$transaction(async (tx) => {
      const lastColumn = await prisma.column.findFirst({
        where: { workspaceId },
        orderBy: { order: 'desc' }
      });

      const nextOrder = (lastColumn?.order ?? -1) + 1;

      const col = await tx.column.create({
        data: { workspaceId, name, order: nextOrder }
      });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await tx.notification.createMany({
          data: members.map(m => ({
            userId: m.userId,
            type: NotificationType.workspace,
            message: `Column "${name}" has been added to workspace "${req.workspace!.name}" by ${req.user!.username}`
          }))
        });
      }

      return col;
    });

    res.status(201).json({ success: true, data: column });
  } catch (err) { next(err); }
}

export async function updateColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace!.id;
    const columnId = parseOrThrow(idSchema, 'updateColumn() ColumnID', req.params.columnId);
    const name = parseQueryString('updateColumn() name', req.body.name, { isOptional: false, minLength: 1, maxLength: 255 })!;

    const column = await prisma.$transaction(async (tx) => {
      const existing = await prisma.column.findFirst({
        where: { id: columnId, workspaceId }
      });
      if (!existing)
        throw new ApiError(404, 'Column not found');

      const col = await tx.column.update({
        where: { id: columnId },
        data: { name }
      });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await tx.notification.createMany({
          data: members.map(m => ({
            userId: m.userId,
            type: NotificationType.workspace,
            message: `Column "${existing.name}" has been renamed to "${name}" in workspace "${req.workspace!.name}" by ${req.user!.username}`
          }))
        });
      }

      return col;
    });

    res.json({ success: true, data: column });
  } catch (err) { next(err); }
}

export async function reorderColumns(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace!.id;
    const items = parseOrThrow(orderSchema, 'reorderColumns() orderSchema', req.body.columns ?? req.body);

    const columns = await prisma.$transaction(async (tx) => {
      const existingColumns = await tx.column.findMany({
        where: { workspaceId, id: { in: items.map(i => i.id) } }
      });

      if (existingColumns.length !== items.length)
        throw new ApiError(400, 'One or more columns not found');

      for (const item of items) {
        await tx.column.update({
          where: { id: item.id },
          data: { order: item.order }
        });
      }

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await tx.notification.createMany({
          data: members.map(m => ({
            userId: m.userId,
            type: NotificationType.workspace,
            message: `Columns have been reordered in workspace "${req.workspace!.name}" by ${req.user!.username}`
          }))
        });
      }

      return await tx.column.findMany({
        where: { workspaceId },
        orderBy: { order: 'asc' }
      });
    });

    res.json({ success: true, data: columns });
  } catch (err) { next(err); }
}

export async function deleteColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace!.id;
    const columnId = parseOrThrow(idSchema, 'deleteColumn() ColumnID', req.params.columnId);

    await prisma.$transaction(async (tx) => {
      const column = await tx.column.findFirst({
        where: { id: columnId, workspaceId }
      });
      if (!column)
        throw new ApiError(404, 'Column not found');

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      await tx.column.delete({ where: { id: columnId } });

      if (members.length > 0) {
        await tx.notification.createMany({
          data: members.map(m => ({
            userId: m.userId,
            type: NotificationType.workspace,
            message: `Column "${column.name}" has been removed from workspace "${req.workspace!.name}" by ${req.user!.username}`
          }))
        });
      }
    });

    res.json({ success: true, message: 'Column deleted successfully' });
  } catch (err) { next(err); }
}
