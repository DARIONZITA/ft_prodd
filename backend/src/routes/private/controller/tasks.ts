import { prisma }           from '../../../lib/prisma';
import { ApiError }         from '../../../utils/ApiError';
import { getWorkspaceRole } from '../../../middleware/rbac';
import { Priority }         from '../../../types/constants';
import {
  WorkspaceRole,
  NotificationType
} from '@prisma/client';
import {
  parseMentions,
  resolveMentionUsers
} from './comments';
import type {
  Request,
  Response,
  NextFunction
} from 'express';
import {
  idSchema, parseOrThrow,
  parseQueryEnum, parseQueryInt,
  parseQueryString, parseQueryDate,
  parseQueryBool
} from '../../../validations/utils';
import { wsEmitter }    from '../../../ws/emitter';
import { notify } from '../../../utils/notify';

async function resolveTaskWorkspace(taskId: number)
{
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true, column: { select: { id: true, workspaceId: true, name: true, workspace: { select: { name: true } } } }, assignments: { select: { userId: true } } }
  });
  if (!task)
    throw new ApiError(404, 'Task not found');
  return task;
}

export async function getTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const task = await resolveTaskWorkspace(taskId);
    await getWorkspaceRole(task.column.workspaceId, req.user!.id);

    const taskDetails = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: { select: { id: true, name: true, workspaceId: true } },
        assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        checklistItems: { orderBy: { id: 'asc' } },
        comments: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' }
        },
        taskLabels: { include: { label: true } }
      }
    });

    if (!taskDetails)
      throw new ApiError(404, 'Task not found');

    res.json({ success: true, data: taskDetails });
  } catch (err) { next(err); }
}

export async function updateTask(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    const workspaceId = columnTask.column.workspaceId;
    const role = await getWorkspaceRole(workspaceId, req.user!.id);

    if (role === WorkspaceRole.guest)
      throw new ApiError(403, 'Guests cannot update tasks');

    const title = parseQueryString('title', req.body.title, { isOptional: true, minLength: 1, maxLength: 255 });
    const description = parseQueryString('description', req.body.description, { isOptional: true, maxLength: 10000 });
    const priority = parseQueryEnum('priority', req.body.priority, Priority, { isOptional: true });
    const dueDate = parseQueryDate('dueDate', req.query.dueDate, { isOptional: true })!;
    const isDone = parseQueryBool('isDone', req.body.isDone, { isOptional: true });
    const columnId = parseQueryInt('columnId', req.body.columnId, { isOptional: true, min: 1 });

    if (columnId !== undefined)
    {
      const col = await prisma.column.findUnique({ where: { id: columnId } });
      if (!col || col.workspaceId !== workspaceId)
        throw new ApiError(400, 'Target column does not belong to the same workspace');
    }

    if (title === undefined && description === undefined && priority === undefined && dueDate === undefined && isDone === undefined && columnId === undefined)
      throw new ApiError(400, 'At least one field must be provided');

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate;
    if (isDone !== undefined) {
      data.isDone = isDone;
      data.dateCompleted = isDone ? new Date() : null;
    }
    if (columnId !== undefined) data.columnId = columnId;

    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id: taskId },
        data,
        include: {
          column: { select: { id: true, name: true } },
          assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } }
        }
      });

      return t;
    });

    //--------NOTIFICATION----------

    await notify(
    {
        userIds: task.assignments.map(a => a.userId),
        message: `${req.user!.username} updated task "${task.title}" from column "${columnTask.column.name}"`,
        type: NotificationType.taskUpdated,
        relatedTaskId: taskId,
        relatedWorkspaceId: workspaceId,
        data: { taskTitle: task.title, columnName: columnTask.column.name, workspaceName: columnTask.column.workspace.name }
    });

    //------------------------------

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const task = await resolveTaskWorkspace(taskId);
    const workspaceId = task.column.workspaceId;
    const role = await getWorkspaceRole(workspaceId, req.user!.id);

    if (role !== WorkspaceRole.admin)
      throw new ApiError(403, 'Only admins can delete tasks');

    await prisma.$transaction(async (tx) => {
      await tx.taskAssignment.deleteMany({ where: { taskId } });
      await tx.checklistItem.deleteMany({ where: { taskId } });
      await tx.comment.deleteMany({ where: { taskId } });
      // await tx.notification.deleteMany({ where: { relatedTaskId: taskId } });
      await tx.taskLabel.deleteMany({ where: { taskId } });
      await tx.task.delete({ where: { id: taskId } });
    });

    //--------NOTIFICATION----------

    await notify(
    {
        userIds: task.assignments.map(a => a.userId),
        message: `${req.user!.username} deleted task "${task.title}" from column "${task.column.name}" in workspace "${task.column.workspace.name}"`,
        type: NotificationType.taskDeleted,
        relatedTaskId: taskId,
        relatedWorkspaceId: workspaceId,
        data: { taskTitle: task.title, columnName: task.column.name, workspaceName: task.column.workspace.name }
    });

    //-----------------------------
  
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) { next(err); }
}

export async function moveTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    const workspaceId = columnTask.column.workspaceId;

    const role = await getWorkspaceRole(workspaceId, req.user!.id);
    if (role === WorkspaceRole.guest)
      throw new ApiError(403, 'Guests cannot move tasks');

    const targetColumnId = parseOrThrow(idSchema, 'ColumnID', req.body.columnId);
    const afterTaskId = parseQueryInt('afterTaskId', req.body.afterTaskId, { isOptional: true, min: 0 });

    const targetColumn = await prisma.column.findUnique({ where: { id: targetColumnId } });
    if (!targetColumn || targetColumn.workspaceId !== workspaceId)
      throw new ApiError(400, 'Target column does not belong to the same workspace');

    const task = await prisma.$transaction(async (tx) => {
      const tasksInColumn = await tx.task.findMany({
          where: { columnId: targetColumnId },
          orderBy: { orderInColumn: 'asc' },
          select: { id: true, orderInColumn: true }
      });

      const afterIndex = afterTaskId ? tasksInColumn.findIndex(t => t.id === afterTaskId) : -1;
      const tasksToShift = tasksInColumn.slice(afterIndex + 1);
      await Promise.all(tasksToShift.map((t, i) =>
          tx.task.update({
              where: { id: t.id },
              data: { orderInColumn: afterIndex + 2 + i }
          })
      ));

      const t = await tx.task.update({
          where: { id: taskId },
          data: { columnId: targetColumnId, orderInColumn: afterIndex + 1 },
          include: {
              column: { select: { id: true, name: true, workspace: { select: { id: true, name: true } } } },
              assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } }
          }
      });

      return t;
    });

    //--------NOTIFICATION----------

    await notify(
    {
      userIds: task.assignments.map(a => a.userId),
      message: `${req.user!.username} moved task "${task.title}" from column "${columnTask.column.name}" to column "${task.column.name}" in workspace "${task.column.workspace.name}"`,
      type: NotificationType.taskAssignment,
      relatedTaskId: taskId,
      relatedWorkspaceId: workspaceId,
      data: { taskTitle: task.title, columnId: task.column.id, columnName: task.column.name, workspaceName: task.column.workspace.name, oldColumnName: columnTask.column.name, oldColumnId: columnTask.column.id }
    });

    //-----------------------------

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
}



// ─────────────────────────── Assignments ────────────────────────────────

export async function listAssignments(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const task = await resolveTaskWorkspace(taskId);
    await getWorkspaceRole(task.column.workspaceId, req.user!.id);

    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } }
    });

    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
}

export async function createAssignment(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const task = await resolveTaskWorkspace(taskId);
    const workspaceId = task.column.workspaceId;

    let role = await getWorkspaceRole(workspaceId, req.user!.id); 
    if (role !== WorkspaceRole.admin)
      throw new ApiError(403, 'Only admins can assign tasks');
    
    const userId = parseOrThrow(idSchema, 'UserID', req.params.userId);
    role = await getWorkspaceRole(workspaceId, userId);
    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Can't assign tasks to guests");
    
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    if (!user)
      throw new ApiError(404, 'User not found');

    const existing = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId } }
    });
    if (existing)
      throw new ApiError(400, 'User is already assigned to this task');

    const assignment = await prisma.$transaction(async (tx) => {
      const a = await tx.taskAssignment.create({
        data: { taskId, userId },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } }
      });

      return a;
    });

    //--------NOTIFICATION----------

    await notify(
    {
        userIds: [userId],
        message: `${req.user!.username} assigned you to task "${task.title}" from column "${task.column.name}" in workspace "${task.column.workspace.name}"`,
        type: NotificationType.taskAssignment,
        relatedTaskId: taskId,
        relatedWorkspaceId: workspaceId,
        data: { taskTitle: task.title, columnName: task.column.name, workspaceName: task.column.workspace.name }
    });

    //------------------------------

    res.status(201).json({ success: true, data: assignment });
  } catch (err) { next(err); }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const task = await resolveTaskWorkspace(taskId);
    const workspaceId = task.column.workspaceId;
    let role = await getWorkspaceRole(workspaceId, req.user!.id); 

    if (role !== WorkspaceRole.admin)
      throw new ApiError(403, 'Only admins can unassign tasks');

    const userId = parseOrThrow(idSchema, 'UserID', req.params.userId);
    await getWorkspaceRole(workspaceId, userId);
    
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    if (!user)
      throw new ApiError(404, 'User not found');

    const assignment = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId } }
    });
    if (!assignment)
      throw new ApiError(404, 'Assignment not found');

    await prisma.$transaction(async (tx) => {
      await tx.taskAssignment.delete({ where: { id: assignment.id } });
    });

    //--------NOTIFICATION----------

    await notify(
    {
        userIds: [userId],
        message: `${req.user!.username} unassigned you from task "${task.title}" of column "${task.column.name}" in workspace "${task.column.workspace.name}"`,
        type: NotificationType.taskAssignment,
        relatedTaskId: taskId,
        relatedWorkspaceId: workspaceId,
        data: { taskTitle: task.title, columnName: task.column.name, workspaceName: task.column.workspace.name }
    });

    //-----------------------------

    res.json({ success: true, message: 'User unassigned successfully' });
  } catch (err) { next(err); }
}



// ─────────────────────────── Checklist ──────────────────────────────────

export async function listChecklist(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    await getWorkspaceRole(columnTask.column.workspaceId, req.user!.id); 

    const items = await prisma.checklistItem.findMany({
      where: { taskId },
      orderBy: { id: 'asc' }
    });

    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}
  
export async function createChecklistItem(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    const role = await getWorkspaceRole(columnTask.column.workspaceId, req.user!.id); 

    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't create checklist items");

    const text = parseQueryString('text', req.body.text, { isOptional: false, minLength: 1, maxLength: 500 })!;

    const item = await prisma.checklistItem.create({
      data: { taskId, text }
    });

    await notify(
    {
      userIds: columnTask.assignments.map(a => a.userId),
      message: `${req.user!.username} added a checklist item on task "${columnTask.title}" in column "${columnTask.column.name}" in workspace "${columnTask.column.workspace.name}"`,
      type: NotificationType.taskUpdated,
      relatedTaskId: taskId,
      relatedWorkspaceId: columnTask.column.workspaceId,
      data: { taskTitle: columnTask.title, columnName: columnTask.column.name, workspaceName: columnTask.column.workspace.name }
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateChecklistItem(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    const role = await getWorkspaceRole(columnTask.column.workspaceId, req.user!.id); 

    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't update checklist items");

    const itemId = parseOrThrow(idSchema, 'ItemID', req.params.itemId);
    const text = parseQueryString('text', req.body.text, { isOptional: true, minLength: 1, maxLength: 500 });
    const isCompleted = parseQueryBool('isCompleted', req.body.isCompleted, { isOptional: true });

    if (text === undefined && isCompleted === undefined)
      throw new ApiError(400, 'At least one field must be provided');

    const existing = await prisma.checklistItem.findFirst({ where: { id: itemId, taskId } });
    if (!existing)
      throw new ApiError(404, 'Checklist item not found');

    const data: any = {};
    if (text !== undefined) data.text = text;
    if (isCompleted !== undefined) data.isCompleted = isCompleted;

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data
    });
    await notify(
    {
      userIds: columnTask.assignments.map(a => a.userId),
      message: `${req.user!.username} updated a checklist item on task "${columnTask.title}" in column "${columnTask.column.name}" in workspace "${columnTask.column.workspace.name}"`,
      type: NotificationType.taskUpdated,
      relatedTaskId: taskId,
      relatedWorkspaceId: columnTask.column.workspaceId,
      data: { taskTitle: columnTask.title, columnName: columnTask.column.name, workspaceName: columnTask.column.workspace.name }
    });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteChecklistItem(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    const role = await getWorkspaceRole(columnTask.column.workspaceId, req.user!.id); 

    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't update checklist items");

    const itemId = parseOrThrow(idSchema, 'ItemID', req.params.itemId);

    const existing = await prisma.checklistItem.findFirst({ where: { id: itemId, taskId } });
    if (!existing)
      throw new ApiError(404, 'Checklist item not found');

    await prisma.checklistItem.delete({ where: { id: itemId } });

    await notify(
    {
      userIds: columnTask.assignments.map(a => a.userId),
      message: `${req.user!.username} deleted a checklist item on task "${columnTask.title}" in column "${columnTask.column.name}" in workspace "${columnTask.column.workspace.name}"`,
      type: NotificationType.taskUpdated,
      relatedTaskId: taskId,
      relatedWorkspaceId: columnTask.column.workspaceId,
      data: { taskTitle: columnTask.title, columnName: columnTask.column.name, workspaceName: columnTask.column.workspace.name }
    });

    res.json({ success: true, message: 'Checklist item deleted' });
  } catch (err) { next(err); }
}



// ─────────────────────────── Labels ─────────────────────────────────────

export async function listTaskLabels(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    await getWorkspaceRole(columnTask.column.workspaceId, req.user!.id);

    const taskLabels = await prisma.taskLabel.findMany({
      where: { taskId },
      include: { label: true }
    });

    res.json({ success: true, data: taskLabels });
  } catch (err) { next(err); }
}

export async function attachLabel(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    const workspaceId = columnTask.column.workspaceId;
    const role = await getWorkspaceRole(workspaceId, req.user!.id);

    if (role !== WorkspaceRole.admin)
      throw new ApiError(403, "Only admins can attach labels to tasks");

    const labelId = parseOrThrow(idSchema, 'LabelID', req.params.labelId);

    const label = await prisma.label.findUnique({ where: { id: labelId } });
    if (!label || label.workspaceId !== workspaceId)
      throw new ApiError(400, 'Label not found or does not belong to this workspace');

    const existing = await prisma.taskLabel.findUnique({
      where: { taskId_labelId: { taskId, labelId } }
    });
    if (existing)
      throw new ApiError(400, 'Label already attached to this task');

    const taskLabel = await prisma.taskLabel.create({
      data: { taskId, labelId },
      include: { label: true }
    });

    await notify(
    {
      userIds: columnTask.assignments.map(a => a.userId),
      message: `${req.user!.username} attached label "${taskLabel.label.name}" to task "${columnTask.title}" in column "${columnTask.column.name}" in workspace "${columnTask.column.workspace.name}"`,
      type: NotificationType.taskUpdated,
      relatedTaskId: taskId,
      relatedWorkspaceId: workspaceId,
      data: { taskTitle: columnTask.title, labelId: taskLabel.label.id, columnName: columnTask.column.name, workspaceName: columnTask.column.workspace.name }
    });
    res.status(201).json({ success: true, data: taskLabel });
  } catch (err) { next(err); }
}

export async function detachLabel(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const columnTask = await resolveTaskWorkspace(taskId);
    const workspaceId = columnTask.column.workspaceId;
    const role = await getWorkspaceRole(workspaceId, req.user!.id);

    if (role !== WorkspaceRole.admin)
      throw new ApiError(403, "Only admins can detach labels from tasks");

    const labelId = parseOrThrow(idSchema, 'LabelID', req.params.labelId);

    const existing = await prisma.taskLabel.findUnique({
      where: { taskId_labelId: { taskId, labelId } },
      include: { label: { select: { id: true, name: true } } }
    });
    if (!existing)
      throw new ApiError(404, 'Label not attached to this task');

    await prisma.taskLabel.delete({ where: { id: existing.id } });

    await notify(
    {
      userIds: columnTask.assignments.map(a => a.userId),
      message: `${req.user!.username} detached label "${existing.label.name}" from task "${columnTask.title}" in column "${columnTask.column.name}" in workspace "${columnTask.column.workspace.name}"`,
      type: NotificationType.taskUpdated,
      relatedTaskId: taskId,
      relatedWorkspaceId: workspaceId,
      data: { taskTitle: columnTask.title, labelId: existing.label.id, columnName: columnTask.column.name, workspaceName: columnTask.column.workspace.name }
    });
    res.json({ success: true, message: 'Label detached successfully' });
  } catch (err) { next(err); }
}



// ─────────────────────────── Labels ─────────────────────────────────────

export async function listTaskComments(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const skip = parseQueryInt('skip', req.query.skip, { default: 0, isOptional: true, min: 0 });
    const take = parseQueryInt('take', req.query.take, { default: 42, isOptional: true, min: 1, max: 100 });
    const task = await resolveTaskWorkspace(taskId);
    const role = await getWorkspaceRole(task.column.workspaceId, req.user!.id); 

    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't see task comments");

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

export async function createTaskComment(req: Request, res: Response, next: NextFunction)
{
  try {
    const taskId = parseOrThrow(idSchema, 'TaskID', req.params.id);
    const task = await resolveTaskWorkspace(taskId);
    const workspaceId = task.column.workspaceId;
    const role = await getWorkspaceRole(workspaceId, req.user!.id); 

    if (role === WorkspaceRole.guest)
      throw new ApiError(403, "Guests can't create task comments");

    const content = parseQueryString('content', req.body.content, { isOptional: false, minLength: 1, maxLength: 10000 })!;

    const mentionedUsernames = parseMentions(content);

    const { comment, mentionedUserIds } = await prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          taskId,
          authorId: req.user!.id,
          content
        },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } }
        }
      });

      const mentionedUserIds = await resolveMentionUsers(mentionedUsernames, workspaceId);
      if (mentionedUserIds.length > 0) {
        await tx.notification.createMany({
            data: mentionedUserIds.map(userId => ({
              userId,
              message: `${req.user!.username} mentioned you in a comment on task "${task.title}" from column "${task.column.name}"`,
              type: NotificationType.mention
            }))
        });
      }

      return ({ comment: c, mentionedUserIds });
    });

    const result = await prisma.comment.findUnique({
      where: { id: comment.id },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } }
    });

    //--------NOTIFICATION----------


    // 1. Broadcast do novo comentário ao workspace (excepto o autor)
    wsEmitter.commentNew( workspaceId, taskId, comment, req.user!.id );

    // 2. Notificação persistida para cada utilizador mencionado
    //    (excepto o próprio autor)

    let alreadyNotifiedIds = new Set<number>([req.user!.id]); // Exclude author

    await notify(
    {
      userIds: mentionedUserIds as number[],
      message: `${req.user!.username} mentioned you in a comment on task "${task.title}" from column "${task.column.name}" in workspace "${task.column.workspace.name}"`,
      type: NotificationType.mention,
      relatedTaskId: taskId,
      relatedWorkspaceId: workspaceId,
      data: { commentId: comment.id, taskTitle: task.title, columnName: task.column.name, workspaceName: task.column.workspace.name }
    },
      alreadyNotifiedIds, // Exclude author
      true // Add mentioned users to the exclusion set to avoid duplicate notifications
    );
    // 3. Notificação para assignees da task que receberam um comentário
    //    (excepto o autor e já mencionados)

    const assigneeUserIds = task.assignments.map(a => a.userId);

    await notify(
    {
      userIds: assigneeUserIds,
      message: `${req.user!.username} commented on task "${task.title}" from column "${task.column.name}" in workspace "${task.column.workspace.name}"`,
      type: NotificationType.comment,
      relatedTaskId: taskId,
      relatedWorkspaceId: workspaceId,
      data: { commentId: comment.id, taskTitle: task.title, columnName: task.column.name, workspaceName: task.column.workspace.name }
    },
      alreadyNotifiedIds, // Exclude author and already mentioned
    );

    //-----------------------------

    res.status(201).json({ success: true, data: result });
  }
  catch (err) { next(err); }
}
