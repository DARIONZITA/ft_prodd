import { z }                                    from 'zod';
import { prisma }                               from '../../../lib/prisma';
import { ApiError }                             from '../../../utils/ApiError';
import { Priority }                             from '../../../types/constants';
import { WorkspaceRole, NotificationType }      from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
import {
  idSchema, parseOrThrow,
  parseQueryEnum, parseQueryInt,
  parseQueryString, parseQueryDate,
  parseQueryBool
} from '../../../validations/utils';
import { wsEmitter }    from '../../../ws/emitter';
import { notify } from '../../../utils/notify';

const orderSchema = z.array( z.object({ id: idSchema, order: z.coerce.number().int().min(0) }) ).min(1);

export async function listColumnTasks(req: Request, res: Response, next: NextFunction)
{
  try {
    const skip = parseQueryInt('skip', req.query.skip, { default: 0, isOptional: true, min: 0 });
    const take = parseQueryInt('take', req.query.take, { default: 42, isOptional: true, min: 1, max: 100 });
    const columnId = req.column!.id;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: { columnId },
        orderBy: { orderInColumn: 'asc' },
        include: {
          taskLabels: { include: { label: { select: { name: true } } } },
          assignments: { include: { user: { select: { username: true } } } }
        },
        skip,
        take
      }),
      prisma.task.count({ where: { columnId } })
    ]);

    res.json({
      success: true,
      data: {
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          labels: task.taskLabels.map(tl => tl.label.name),
          assignments: task.assignments.map(a => a.user.username)
        })),
        pagination: { skip, take, total }
      }
    });
  } catch (err) { next(err); }
}

export async function createColumnTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const columnId = req.column!.id;
    const title = parseQueryString('createColumnTask() title', req.body.title, { isOptional: false, minLength: 1, maxLength: 255 })!;
    const description = parseQueryString('createColumnTask() description', req.body.description, { default: '', isOptional: true, maxLength: 10000 })!;
    const priority = parseQueryEnum('createColumnTask() priority', req.body.priority, Priority, { default: 'MEDIUM', isOptional: true })!;
    const dueDate = parseQueryDate('createColumnTask() dueDate', req.body.dueDate, { isOptional: true });

    // Optional: list of user IDs to assign immediately
    const assigneeIds: number[] = Array.isArray(req.body.assignees)
      ? req.body.assignees.map(Number).filter((n: number) => !isNaN(n) && n > 0)
      : [];

    // Optional: list of label IDs to attach immediately
    const labelIds: number[] = Array.isArray(req.body.labels)
      ? req.body.labels.map(Number).filter((n: number) => !isNaN(n) && n > 0)
      : [];

    // Optional: backlog task ID to link (creates a LINK:: checklist item in that task)
    const linkedBacklogId: number | null = req.body.linkedBacklogId
      ? Number(req.body.linkedBacklogId)
      : null;

    const task = await prisma.$transaction(async (tx) => {
      const lastTask = await tx.task.findFirst({
        where: { columnId },
        orderBy: { orderInColumn: 'desc' }
      });
  
      const nextOrder = (lastTask?.orderInColumn ?? -1) + 1;

      const t = await tx.task.create({
        data: { columnId, creatorId: req.user!.id, title, description, priority, dueDate, orderInColumn: nextOrder },
        include: {
          assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } }
        }
      });

      // Assign members if provided
      if (assigneeIds.length > 0) {
        await tx.taskAssignment.createMany({
          data: assigneeIds.map(userId => ({ taskId: t.id, userId, assignedById: req.user!.id })),
          skipDuplicates: true
        });
      }

      // Attach labels if provided
      if (labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: labelIds.map(labelId => ({ taskId: t.id, labelId })),
          skipDuplicates: true
        });
      }

      // If linked to a backlog task, create the LINK checklist item in it
      if (linkedBacklogId) {
        const backlogTask = await tx.task.findUnique({ where: { id: linkedBacklogId } });
        if (backlogTask) {
          await tx.checklistItem.create({
            data: { taskId: linkedBacklogId, description: `LINK::${t.id}::${title}` }
          });
        }
      }

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId: req.workspace!.id, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await notify(
          {
              userIds: members.map(m => m.userId),
              message: `${req.user!.username} created task "${title}" in column "${req.column!.name}" of workspace "${req.workspace!.name}"`,
              type: NotificationType.task
          },
          tx
        );
      }

      return t;
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
}


export async function getTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task?.id;
    const skip = parseQueryInt('skip', req.query.skip, { default: 0, isOptional: true, min: 0 });
    const take = parseQueryInt('take', req.query.take, { default: 42, isOptional: true, min: 1, max: 100 });

    const [taskDetails, totalComments] = await prisma.$transaction([
      prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
          checklistItems: { orderBy: { id: 'asc' } },
          comments: {
            skip,
            take,
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { createdAt: 'asc' }
          },
          taskLabels: { include: { label: true } }
        }
      }),
      prisma.comment.count({ where: { taskId } })
    ]);

    if (!taskDetails)
      throw new ApiError(404, 'Task not found');

    res.json({
      success: true,
      data: {
        ...taskDetails,
        comments: {
          items: taskDetails.comments,
          pagination: { skip, take, total: totalComments }
        }
      }
    });
  } catch (err) { next(err); }
}

export async function updateTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task?.id;
    const workspaceId = req.workspace!.id;
    const title = parseQueryString('title', req.body.title, { isOptional: true, minLength: 1, maxLength: 255 });
    const description = parseQueryString('description', req.body.description, { isOptional: true, maxLength: 10000 });
    const priority = parseQueryEnum('priority', req.body.priority, Priority, { isOptional: true });
    const dueDate = parseQueryDate('dueDate', req.body.dueDate, { isOptional: true });
    const isDone = parseQueryBool('isDone', req.body.isDone, { isOptional: true });
    
    if (title === undefined && description === undefined && priority === undefined && dueDate === undefined && isDone === undefined)
      throw new ApiError(400, 'At least one field must be provided');

    if (isDone !== undefined && req.workspace?.role !== WorkspaceRole.admin)
      throw new ApiError(403, 'Only admins can update the completion status of a task');

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate;
    if (isDone !== undefined) {
      data.isDone = isDone;
      data.dateCompleted = isDone ? new Date() : null;
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id: taskId }, data });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      const updated = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
          checklistItems: { orderBy: { id: 'asc' } },
          comments: {
            take: 42,
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { createdAt: 'asc' }
          },
          taskLabels: { include: { label: true } }
        }
      });

      const totalComments = await tx.comment.count({ where: { taskId } });

      if (members.length > 0)
      {
        await notify(
          {
            userIds: members.map(m => m.userId),
            type: NotificationType.task,
            message: `${req.user!.username} updated task "${req.task?.title}" in column "${req.column!.name}" of workspace "${req.workspace!.name}"`
          },
          tx
        );
      }
      return { updated, totalComments };
    });

    res.json({
      success: true,
      data: {
        ...result.updated,
        comments: {
          items: result.updated!.comments,
          pagination: { skip: 0, take: 42, total: result.totalComments }
        }
      }
    });
  } catch (err) { next(err); }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task?.id;
    const workspaceId = req.workspace?.id;

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: taskId } });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await notify(
          {
            userIds: members.map(m => m.userId),
            type: NotificationType.task,
            message: `${req.user!.username} deleted task "${req.task?.title}" in column "${req.column!.name}" of workspace "${req.workspace!.name}"`
          },
          tx
        );
      }
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) { next(err); }
}

export async function moveTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = req.task?.id;
    const workspaceId = req.workspace?.id;
    const targetColumnId = parseOrThrow(idSchema, 'TargetColumnID', req.body.targetColumnId);
    const afterTaskId = parseQueryInt('afterTaskId', req.body.afterTaskId, { isOptional: true, min: 0 });

    const task = await prisma.$transaction(async (tx) => {
      const targetColumn = await tx.column.findUnique({ where: { id: targetColumnId } });
      if (!targetColumn || targetColumn.workspaceId !== workspaceId)
        throw new ApiError(400, 'Target column does not belong to the same workspace');

      const tasksInColumn = await tx.task.findMany({
          where: { columnId: targetColumnId },
          orderBy: { orderInColumn: 'asc' },
          select: { id: true, orderInColumn: true }
      });

      const prevColumnId = (await tx.task.findUniqueOrThrow({ where: { id: taskId }, select: { columnId: true } })).columnId;

      const afterIndex = afterTaskId ? tasksInColumn.findIndex(t => t.id === afterTaskId) : -1;
      const tasksToShift = tasksInColumn.slice(afterIndex + 1);
      await Promise.all(tasksToShift.map((t, i) =>
          tx.task.update({
              where: { id: t.id },
              data: { orderInColumn: afterIndex + 2 + i }
          })
      ));

      await tx.task.update({
          where: { id: taskId },
          data: { columnId: targetColumnId, orderInColumn: afterIndex + 1 }
      });
      if (prevColumnId !== targetColumnId) {
        const prevTasks = await tx.task.findMany({
          where: { columnId: prevColumnId },
          orderBy: { orderInColumn: 'asc' },
          select: { id: true }
        });
        await Promise.all(prevTasks.map((t, i) =>
          tx.task.update({ where: { id: t.id }, data: { orderInColumn: i } })
        ));
      }

      const targetTasks = await tx.task.findMany({
        where: { columnId: targetColumnId },
        orderBy: { orderInColumn: 'asc' },
        select: { id: true }
      });
      await Promise.all(targetTasks.map((t, i) =>
        tx.task.update({ where: { id: t.id }, data: { orderInColumn: i } })
      ));

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await notify(
          {
            userIds: members.map(m => m.userId),
            type: NotificationType.task,
            message: `${req.user!.username} moved task "${req.task?.title}" to column "${targetColumn.name}" in workspace "${req.workspace!.name}"`
          },
          tx
         );
      }

      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
          checklistItems: { orderBy: { id: 'asc' } },
          taskLabels: { include: { label: true } }
        }
      });
    });

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
}

export async function reorderColumnTasks(req: Request, res: Response, next: NextFunction)
{
  try {
    const columnId = req.column!.id;
    const items = parseOrThrow(orderSchema, 'tasks', req.body.tasks ?? req.body);

    const tasks = await prisma.$transaction(async (tx) => {
      const existing = await tx.task.findMany({ where: { columnId, id: { in: items.map(i => i.id) } } });

      if (existing.length !== items.length)
        throw new ApiError(400, 'One or more tasks not found in this column');

      const sortedOrders = items.map(i => i.order).sort((a, b) => a - b);
      if (sortedOrders.some((o, i) => o !== i))
        throw new ApiError(400, 'Task order sequence must be contiguous starting from 0');

      for (const item of items)
        await tx.task.update({ where: { id: item.id }, data: { orderInColumn: item.order } });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId: req.workspace!.id, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0)
      {
        await notify(
          {
            userIds: members.map(m => m.userId),
            type: NotificationType.task,
            message: `Tasks have been reordered in column "${req.column!.name}" of workspace "${req.workspace!.name}" by ${req.user!.username}`
          },
          tx
        );
      }

      return tx.task.findMany({ where: { columnId }, orderBy: { orderInColumn: 'asc' } });
    });

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
}
