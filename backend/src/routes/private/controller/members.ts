import type { Request, Response, NextFunction }     from 'express';
import { NotificationType }                         from '@prisma/client';
import { prisma }                                   from '../../../lib/prisma';
import { ApiError }                                 from '../../../utils/ApiError';
import { WorkspaceRole }                            from '../../../types/constants';
import { idSchema, parseOrThrow, parseQueryEnum }   from '../../../validations/utils';
import { notify } from '../../../utils/notify';

export async function listMembers(req: Request, res: Response, next: NextFunction)
{
    try {
        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId: req.workspace!.id },
            select: {
                role: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: [{ role: 'asc' }, { userId: 'asc' }]
        });

        res.json({
            success: true,
            data: members.map(m => ({
                role: m.role,
                joinedAt: m.createdAt,
                user: m.user
            }))
        });
    }
    catch (err) { next(err); }
}

export async function   getMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const userId = parseOrThrow(idSchema, 'getMember() UserID', req.params.userId);

        const member = await prisma.workspaceMember.findFirst({
            where: { workspaceId: req.workspace!.id, userId },
            select: {
                role: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        if (!member)
            throw new ApiError(404, 'Member not found in workspace');

        res.json({
            success: true,
            data: {
                role: member.role,
                joinedAt: member.createdAt,
                user: member.user
            }
        });
    }
    catch (err) { next(err); }
}

export async function   createMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const userId = parseOrThrow(idSchema, 'createMember() UserID', req.params.userId);
        const role = parseQueryEnum('role', req.query.role, WorkspaceRole, { default: WorkspaceRole[1], isOptional: true })!;
        
        const newMembership = await prisma.$transaction(async (tx) => {
            const targetUser = await prisma.user.findUnique({ where: { id: userId } });
            if (!targetUser)
                throw new ApiError(404, 'User not found');
    
            const existingMembership = await prisma.workspaceMember.findFirst({
                where: { workspaceId, userId }
            });
            if (existingMembership)
                throw new ApiError(400, 'User is already a member of this workspace');

            const member = await tx.workspaceMember.create({
                data: { workspaceId, userId, role },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            avatarUrl: true
                        }
                    }
                }
            });

            await tx.workspace.update({
                where: { id: workspaceId },
                data: { updatedAt: new Date() }
            });

            const otherMembers = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id } },
                select: { userId: true }
            });

            if (otherMembers.length) {
                await notify(
                    {
                        userIds: otherMembers.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `${member.user.username} has been added to workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx
                );
            }

            return member;
        });

        res.status(201).json({
            success: true,
            message: 'Member added successfully',
            data: newMembership
        });
    }
    catch (err) { next(err); }
}

export async function   updateMemberRole(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const userId = parseOrThrow(idSchema, 'updateMemberRole() UserID', req.params.userId);
        const role = parseQueryEnum('role', req.query.role, WorkspaceRole, { isOptional: false });

        const updatedMember = await prisma.$transaction(async (tx) => {
            const targetMembership = await prisma.workspaceMember.findFirst({
                where: { workspaceId, userId }
            });

            if (!targetMembership)
                throw new ApiError(404, 'Member not found in workspace');

            if (targetMembership.role === 'admin' && role !== 'admin') {
                const adminCount = await tx.workspaceMember.count({
                    where: { workspaceId, role: 'admin' }
                });

                if (adminCount <= 1)
                    throw new ApiError(400, 'It is not possible to remove the last admin from the workspace.');
            }

            const member = await tx.workspaceMember.update({
                where: { id: targetMembership.id },
                data: { role },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            avatarUrl: true
                        }
                    }
                }
            });

            await tx.workspace.update({
                where: { id: workspaceId },
                data: { updatedAt: new Date() }
            });

            const otherMembers = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id } },
                select: { userId: true }
            });

            if (otherMembers.length > 0) {
                await notify(
                    {
                        userIds: otherMembers.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `${member.user.username}'s role has been changed to ${role} in workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx
                );
            }

            return member;
        });

        res.json({ success: true, data: updatedMember });
    }
    catch (err) { next(err);}
}

export async function deleteMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const userId = parseOrThrow(idSchema, 'deleteMember() UserID', req.params.userId);

        const result = await prisma.$transaction(async (tx) => {
             const targetMembership = await prisma.workspaceMember.findFirst({
                where: { workspaceId, userId }
            });

            if (!targetMembership)
                throw new ApiError(404, 'Member not found in workspace');

            if (targetMembership.role === 'admin') {
                const adminCount = await tx.workspaceMember.count({
                    where: { workspaceId, role: 'admin' }
                });

                if (adminCount <= 1)
                    throw new ApiError(400, 'It is not possible to remove the last admin from the workspace.');
            }

            const targetUser = await tx.user.findUnique({
                where: { id: userId },
                select: { username: true }
            });

            const taskIds = await tx.task.findMany({
                where: { column: { workspaceId }, assignments: { some: { userId } } },
                select: { id: true }
            }).then(ts => ts.map(t => t.id));

            if (taskIds.length > 0) {
                await tx.taskAssignment.deleteMany({
                    where: { taskId: { in: taskIds }, userId }
                });
            }

            await tx.workspaceMember.delete({
                where: { id: targetMembership.id }
            });

            const remainingMembers = await tx.workspaceMember.count({
                where: { workspaceId }
            });

            if (remainingMembers === 0) {
                await tx.workspace.delete({ where: { id: workspaceId } });
                return { message: 'Member removed and workspace deleted (no members left).' };
            }

            await tx.workspace.update({
                where: { id: workspaceId },
                data: { updatedAt: new Date() }
            });

            const otherMembers = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id } },
                select: { userId: true }
            });

            if (otherMembers.length > 0) {
                await notify(
                    {
                        userIds: otherMembers.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `${targetUser!.username} has been removed from workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx
                );
            }

            return { message: 'Member successfully removed.' };
        });

        res.json({ success: true, message: result.message });
    }
    catch (err) { next(err); }
}
