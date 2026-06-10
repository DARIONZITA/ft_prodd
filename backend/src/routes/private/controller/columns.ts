import { z }                from 'zod';
import { prisma }           from '../../../lib/prisma';
import { WorkspaceRole }    from '@prisma/client';
import { ApiError }         from '../../../utils/ApiError';
import { Priority }         from '../../../types/constants';
import { getWorkspaceRole } from '../../../middleware/rbac';
import type {
  Request,
  Response,
  NextFunction
} from 'express';
import {
  idSchema, parseOrThrow,
  parseQueryInt, parseQueryString, parseQueryEnum
} from '../../../validations/utils';

const orderSchema = z.array( z.object({ id: idSchema, order: z.coerce.number().int().min(0) }) ).min(1);

async function resolveColumnWorkspace( columnId: number )
{
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { workspaceId: true, name: true }
  });
  if (!column)
    throw new ApiError(404, 'Column not found');
  return column;
}

export async function createColumn(req: Request, res: Response, next: NextFunction)
{
  try {
    const workspaceId = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
    const name = parseQueryString('name', req.body.name, { isOptional: false, minLength: 1, maxLength: 255 })!;

    const lastColumn = await prisma.column.findFirst({
      where: { workspaceId },
      orderBy: { order: 'desc' }
    });

    const nextOrder = (lastColumn?.order ?? -1) + 1;

    const column = await prisma.$transaction(async (tx) => {
      const col = await tx.column.create({
        data: { workspaceId, name, order: nextOrder }
      });

      return col;
    });

    res.status(201).json({ success: true, data: column });
  } catch (err) { next(err); }
}

export async function updateColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
    const columnId = parseOrThrow(idSchema, 'ColumnID', req.params.columnId);
    const name = parseQueryString('name', req.body.name, { isOptional: true, minLength: 1, maxLength: 255 });
    const order = parseQueryInt('order', req.body.order, { isOptional: true, min: 0 });

    if (name === undefined && order === undefined)
      throw new ApiError(400, 'At least one field (name or order) must be provided');

    const existing = await prisma.column.findFirst({
      where: { id: columnId, workspaceId }
    });
    if (!existing)
      throw new ApiError(404, 'Column not found');

    const column = await prisma.$transaction(async (tx) => {
      const col = await tx.column.update({
        where: { id: columnId },
        data: {
          ...(name !== undefined && { name }),
          ...(order !== undefined && { order })
        }
      });

      return col;
    });

    res.json({ success: true, data: column });
  } catch (err) { next(err); }
}

export async function deleteColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
    const columnId = parseOrThrow(idSchema, 'ColumnID', req.params.columnId);

    const column = await prisma.column.findFirst({
      where: { id: columnId, workspaceId }
    });
    if (!column)
      throw new ApiError(404, 'Column not found');

    await prisma.$transaction(async (tx) => {
      await tx.taskAssignment.deleteMany({
        where: { task: { columnId } }
      });
      await tx.checklistItem.deleteMany({
        where: { task: { columnId } }
      });
      await tx.comment.deleteMany({
        where: { task: { columnId } }
      });
      const taskIds = (await tx.task.findMany({ where: { columnId }, select: { id: true } })).map((t: { id: number }) => t.id);
      await tx.task.deleteMany({ where: { columnId } });
      await tx.column.delete({ where: { id: columnId } });
    });

    res.json({ success: true, message: 'Column deleted successfully' });
  } catch (err) { next(err); }
}

export async function reorderColumns(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
    const items = parseOrThrow(orderSchema, 'ReorderColumns', req.body.columns ?? req.body);

    const existingColumns = await prisma.column.findMany({
      where: { workspaceId, id: { in: items.map(i => i.id) } }
    });

    if (existingColumns.length !== items.length)
      throw new ApiError(400, 'One or more columns not found');

    await prisma.$transaction(
      items.map(item =>
        prisma.column.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    const columns = await prisma.column.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' }
    });

    res.json({ success: true, data: columns });
  } catch (err) { next(err); }
}

export async function listColumnTasks(req: Request, res: Response, next: NextFunction)
{
  try {
    const columnId = parseOrThrow(idSchema, 'columnID', req.params.id);
    const column = await resolveColumnWorkspace(columnId);
    await getWorkspaceRole(column.workspaceId, req.user!.id);

    const tasks = await prisma.task.findMany({
      where: { columnId },
      include: {
        assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } }
      },
      orderBy: { orderInColumn: 'asc' }
    });

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
}

export async function createColumnTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const columnId = parseOrThrow(idSchema, 'ColumnID', req.params.id);
    const column = await resolveColumnWorkspace(columnId);

    const role = await getWorkspaceRole(column.workspaceId, req.user!.id);
    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't create tasks");

    const title = parseQueryString('title', req.body.title, { isOptional: false, minLength: 1, maxLength: 255 })!;
    const description = parseQueryString('description', req.body.description, { default: '', isOptional: true, maxLength: 10000 })!;
    const priority = parseQueryEnum('priority', req.body.priority, Priority, { default: 'MEDIUM', isOptional: true })!;

    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { orderInColumn: 'desc' }
    });

    const nextOrder = (lastTask?.orderInColumn ?? -1) + 1;

    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: { columnId, title, description, priority, orderInColumn: nextOrder },
        include: {
          assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } }
        }
      });

      return t;
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
}

export async function reorderColumnTasks(req: Request, res: Response, next: NextFunction)
{
  try {
    const columnId = parseOrThrow(idSchema, 'ColumnID', req.params.id);
    const column = await resolveColumnWorkspace(columnId);

    const role = await getWorkspaceRole(column.workspaceId, req.user!.id);
    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't create tasks");

    const items = parseOrThrow(orderSchema, 'tasks', req.body.tasks ?? req.body);
    const existing = await prisma.task.findMany({ where: { columnId, id: { in: items.map(i => i.id) } } });

    if (existing.length !== items.length)
      throw new ApiError(400, 'One or more tasks not found in this column');

    await prisma.$transaction(
      items.map(item =>
        prisma.task.update({ where: { id: item.id }, data: { orderInColumn: item.order } })
      )
    );

    const tasks = await prisma.task.findMany({
      where: { columnId },
      orderBy: { orderInColumn: 'asc' }
    });

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
}
