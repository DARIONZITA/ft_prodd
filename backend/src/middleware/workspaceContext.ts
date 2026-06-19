import { Request, Response, NextFunction }  from 'express';
import { Prisma }                           from '@prisma/client';
import { prisma }                           from '../lib/prisma';
import { ApiError }                         from '../utils/ApiError';
import { idSchema, parseOrThrow }           from '../validations/utils';

async function loadWorkspaceAccess( workspaceId: number, userId: number )
{
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
        select: {
            role: true,
            workspace: { select: { id: true, name: true } }
        }
    });

    if (!membership)
        throw new ApiError(403, 'No permission for this workspace');

    return {
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: membership.role
    };
}

const   workspaceContext = async ( req : Request, _res : Response, next : NextFunction ) => {
    try {
        const id = parseOrThrow(idSchema, 'workspaceId', req.params.workspaceId);

        req.workspace = await loadWorkspaceAccess( id, req.user!.id );

        if (req.workspace.role === 'pending') {
            const isAcceptOrDecline = req.path.endsWith('/invite/accept') || req.path.endsWith('/invite/decline');
            if (!isAcceptOrDecline) {
                throw new ApiError(403, 'No permission for this workspace (pending invitation)');
            }
        }

        next();
    } catch (err) { next( err ); }
}

export const    columnContext = async ( req : Request, _res : Response, next : NextFunction ) => {
    try {
        const id = parseOrThrow(idSchema, 'ColumnID', req.params.columnId);
        
        const select = {
            id: true,
            name: true,
            ...(!req.workspace && {
                workspace: {
                select: { id: true, name: true }
            }}),
        } satisfies Prisma.ColumnSelect;

        const column = await prisma.column.findUnique({ where: { id }, select });
        if (!column)
            throw new ApiError(404, 'Column not found');

        if (!req.workspace)
            req.workspace = await loadWorkspaceAccess( column.workspace.id, req.user!.id );

        req.column = { id: column.id, name: column.name };

        next();
    } catch (err) { next( err ); }
}

export const    taskContext = async ( req : Request, _res : Response, next : NextFunction ) => {
    try {
        const id = parseOrThrow(idSchema, 'TaskID', req.params.taskId);

        const task = await prisma.task.findFirst({
            where: { id, columnId: req.column!.id, },
            select: { id: true, title: true, creatorId: true },
        });

        if (!task)
            throw new ApiError(404, 'Task not found');

        req.task = task;

        next();
    } catch (err) { next( err ); }
}

export const    labelContext = async ( req : Request, _res : Response, next : NextFunction ) => {
    try {
        const id = parseOrThrow(idSchema, 'LabelID', req.params.labelId);

        const label = await prisma.label.findFirst({
            where: { id, workspaceId: req.workspace!.id },
            select: { id: true, name: true, color: true },
        });

        if (!label)
            throw new ApiError(404, 'Label not found');

        req.label = label;

        next();
    } catch (err) { next( err ); }
}

export default workspaceContext;
