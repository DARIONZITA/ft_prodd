import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../../lib/prisma';
import { ApiError }                             from '../../../utils/ApiError';
import { WorkspaceRole, NotificationType }      from '@prisma/client';
import {
  idSchema, parseOrThrow,
  parseQueryString, parseQueryBool
}                                               from '../../../validations/utils';

export async function getChecklist(req: Request, res: Response, next: NextFunction)
{
  try {
    const items = await prisma.checklistItem.findMany({
      where: { taskId: req.task!.id },
      orderBy: { id: 'asc' }
    });

    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function createChecklistItem(req: Request, res: Response, next: NextFunction)
{
  try {
    const description = parseQueryString('createChecklistItem() description', req.body.description, { isOptional: false, minLength: 1, maxLength: 500 })!;

    const item = await prisma.$transaction(async (tx) => {
      const isAdmin = req.workspace?.role === WorkspaceRole.admin;
      const isCreator = req.user!.id === req.task!.creatorId;

      if (!isAdmin && !isCreator)
        throw new ApiError(403, 'Only admins or the task creator can add checklist items');

      const i = await tx.checklistItem.create({ data: { taskId: req.task!.id, description } });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId: req.workspace!.id, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await tx.notification.createMany({
          data: members.map(m => ({
            userId: m.userId,
            type: NotificationType.task,
            message: `${req.user!.username} added checklist item "${description}" to task "${req.task!.title}" in column "${req.column!.name}" of workspace "${req.workspace!.name}"`
          }))
        });
      }

      return i;
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateChecklistItem(req: Request, res: Response, next: NextFunction)
{
  try {
    const itemId = parseOrThrow(idSchema, 'ItemID', req.params.itemId);
    const description = parseQueryString('updateChecklistItem() description', req.body.description, { isOptional: true, minLength: 1, maxLength: 500 });
    const isCompleted = parseQueryBool('isCompleted', req.body.isCompleted, { isOptional: true });

    if (description === undefined && isCompleted === undefined)
      throw new ApiError(400, 'At least one field must be provided');

    const item = await prisma.$transaction(async (tx) => {
      const isAdmin = req.workspace?.role === WorkspaceRole.admin;
      const isCreator = req.user!.id === req.task!.creatorId;

      if (!isAdmin && !isCreator)
        throw new ApiError(403, 'Only admins or the task creator can update checklist items');

      const existing = await tx.checklistItem.findFirst({ where: { id: itemId, taskId: req.task!.id } });
      if (!existing)
        throw new ApiError(404, 'Checklist item not found');

      const data: any = {};
      let message = '';

      if (description !== undefined) {
        data.description = description;
        message = `${req.user!.username} updated checklist item "${existing.description}" to "${description}" on task "${req.task!.title}" in column "${req.column!.name}" of workspace "${req.workspace!.name}"`;
      }
      if (isCompleted !== undefined) {
        data.isCompleted = isCompleted;
        message = isCompleted
          ? `${req.user!.username} marked checklist item "${existing.description}" as complete on task "${req.task!.title}" in column "${req.column!.name}" of workspace "${req.workspace!.name}"`
          : `${req.user!.username} marked checklist item "${existing.description}" as incomplete on task "${req.task!.title}" in column "${req.column!.name}" of workspace "${req.workspace!.name}"`;
      }

      const updated = await tx.checklistItem.update({ where: { id: itemId }, data });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId: req.workspace!.id, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await tx.notification.createMany({
          data: members.map(m => ({ userId: m.userId, type: NotificationType.task, message }))
        });
      }

      return updated;
    });

    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteChecklistItem(req: Request, res: Response, next: NextFunction)
{
  try {
    const itemId = parseOrThrow(idSchema, 'ItemID', req.params.itemId);

    await prisma.$transaction(async (tx) => {
      const isAdmin = req.workspace?.role === WorkspaceRole.admin;
      const isCreator = req.user!.id === req.task!.creatorId;

      if (!isAdmin && !isCreator)
        throw new ApiError(403, 'Only admins or the task creator can delete checklist items');

      const existing = await tx.checklistItem.findFirst({ where: { id: itemId, taskId: req.task!.id } });
      if (!existing)
        throw new ApiError(404, 'Checklist item not found');

      await tx.checklistItem.delete({ where: { id: itemId } });

      const members = await tx.workspaceMember.findMany({
        where: { workspaceId: req.workspace!.id, userId: { not: req.user!.id } },
        select: { userId: true }
      });

      if (members.length > 0) {
        await tx.notification.createMany({
          data: members.map(m => ({
            userId: m.userId,
            type: NotificationType.task,
            message: `${req.user!.username} removed checklist item "${existing.description}" from task "${req.task!.title}" in column "${req.column!.name}" of workspace "${req.workspace!.name}"`
          }))
        });
      }
    });

    res.json({ success: true, message: 'Checklist item deleted' });
  } catch (err) { next(err); }
}
