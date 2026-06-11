import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../../lib/prisma';
import { ApiError }                             from '../../../utils/ApiError';
import { getWorkspaceRole }                     from '../../../middleware/rbac';
import { WorkspaceRole }                        from '../../../types/constants';
import { Priority }                             from '../../../types/constants';
import { requireFriendship }                    from './friends';
import {
    idSchema, parseOrThrow,
    parseQueryEnum, parseQueryInt,
    parseQueryString, parseQueryBool
} from '../../../validations/utils';

export async function createWorkspace(req: Request, res: Response, next: NextFunction)
{
    try {
        const name = parseQueryString('name', req.body.name, { isOptional: false, minLength: 1, maxLength: 255 })!;
        const description = parseQueryString('description', req.body.description, { default: '', isOptional: true, minLength: 1, maxLength: 1000 })!;

        const newWorkspace = await prisma.$transaction(async (tx) => {
            
            const workspace = await tx.workspace.create({
                data: {
                    name,
                    description
                }
            });

            await tx.workspaceMember.create({
                data: {
                    workspaceId: workspace.id,
                    userId: req.user!.id,
                    role: 'admin'
                }
            });

            return workspace;
        });

        res.status(201).json({
            success: true,
            message: 'Workspace created successfully',
            data: newWorkspace
        });
    }
    catch (err) { next(err); }
}

export async function   listUserWorkspaces(req: Request, res: Response, next: NextFunction)
{
	try {
        const targetUserId = req.params.id ? parseOrThrow(idSchema, 'UserID', req.params.id) : req.user!.id;

		const memberships = await prisma.$transaction(async (tx) => {
			if (targetUserId !== req.user!.id)
				await requireFriendship(req.user!.id, targetUserId, "You must be friends to view this user's workspaces", tx);

			return await tx.workspaceMember.findMany({
				where: { userId: targetUserId },
				include: {
					workspace: {
						select: {
							id: true,
							name: true,
							description: true,
							createdAt: true,
							updatedAt: true,
							_count: { select: { members: true } }
						}
					}
				},
				orderBy: { workspaceId: 'asc' }
			});
		});

		res.json({
			success: true,
			data: memberships.map((membership) => ({
				id: membership.workspace.id,
				name: membership.workspace.name,
				description: membership.workspace.description,
				createdAt: membership.workspace.createdAt,
				updatedAt: membership.workspace.updatedAt,
				role: membership.role,
				memberCount: membership.workspace._count.members
			}))
		});
	}
    catch (err) { next(err); }
}

export async function   updateWorkspace(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'UserID', req.params.id);
        const name = parseQueryString('name', req.body.name, { isOptional: true, minLength: 1, maxLength: 255 });
        const description = parseQueryString('description', req.body.description, { isOptional: true, minLength: 1, maxLength: 1000 });

        if (name === undefined && description === undefined)
            throw new ApiError(400, 'At least one field must be provided');

        const updatedWorkspace = await prisma.$transaction(async (tx) => {
            const workspace = await tx.workspace.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(description !== undefined && { description })
                }
            });

            return workspace;
        });

        res.json({
            success: true,
            message: 'Workspace updated successfully',
            data: updatedWorkspace
        });
    }
    catch (err) { next(err); }
}

export async function   deleteWorkspace(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'UserID', req.params.id);

        const workspace = await prisma.workspace.findUnique({ where: { id } });
        if (!workspace)
            throw new ApiError(404, 'Workspace not found');

        await prisma.$transaction(async (tx) => {
            
            await tx.workspaceMember.deleteMany({ where: { workspaceId: id } });

            await tx.workspace.delete({ where: { id } });
        });

        res.json({
            success: true,
            message: 'Workspace deleted successfully'
        });
    }
    catch (err) { next(err); }
}

export async function   getWorkspaceDetails(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'UserID', req.params.id);
        const requesterRole = await getWorkspaceRole(id, req.user!.id);

        const workspace = await prisma.workspace.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
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
                },
                columns: {
                    include: {
                        _count: {
                            select: { tasks: true }
                        }
                    }
                }
            }
        });

        if (!workspace)
            throw new ApiError(404, 'Workspace not found');

        const totalTaskCount = workspace.columns.reduce((sum: number, col: any) => sum + col._count.tasks, 0);

        const formattedData = {
            id: workspace.id,
            name: workspace.name,
            description: workspace.description,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
            role: requesterRole,
            taskCount: totalTaskCount,
            members: workspace.members
        };

        res.json({ success: true, data: formattedData });
    }
    catch (err) { next(err); }
}

export async function   createWorkspaceMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
        const userId = parseOrThrow(idSchema, 'UserID', req.body.userId);
        const role = parseQueryEnum('role', req.body.role, WorkspaceRole, { default: WorkspaceRole[1], isOptional: true })!;

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            throw new ApiError(404, 'User not found');
        }

        const existingMembership = await prisma.workspaceMember.findFirst({
            where: { workspaceId: id, userId }
        });
        if (existingMembership) {
            throw new ApiError(400, 'User is already a member of this workspace');
        }

        const newMembership = await prisma.$transaction(async (tx) => {
            const member = await tx.workspaceMember.create({
                data: {
                    workspaceId: id,
                    userId,
                    role
                },
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
                where: { id },
                data: { updatedAt: new Date() }
            });

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

export async function listWorkspaceMembers(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseOrThrow(idSchema, 'UserID', req.params.id);

        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId: id },
            include: {
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

        res.json({ success: true, data: members });
    }
    catch (err) { next(err); }
}

export async function   getWorkspaceMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
        const userId = parseOrThrow(idSchema, 'UserID', req.params.userId);
        const requesterRole = await getWorkspaceRole(id, req.user!.id);

        if (requesterRole === 'guest' && req.user!.id !== userId)
            throw new ApiError(403, 'Guests can only view their own profile');

        const member = await prisma.workspaceMember.findFirst({
            where: { workspaceId: id, userId },
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

        if (!member)
            throw new ApiError(404, 'Member not found in workspace');

        res.json({ success: true, data: member });
    }
    catch (err) { next(err); }
}

export async function   updateWorkspaceMemberRole(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
        const userId = parseOrThrow(idSchema, 'UserID', req.params.userId);
        const role = parseQueryEnum('role', req.body.role, WorkspaceRole, { isOptional: false });

        const targetMembership = await prisma.workspaceMember.findFirst({
            where: { workspaceId: id, userId }
        });

        if (!targetMembership)
            throw new ApiError(404, 'Member not found in workspace');

        const updatedMember = await prisma.$transaction(async (tx) => {
            if (targetMembership.role === 'admin' && role !== 'admin') {
                const adminCount = await tx.workspaceMember.count({
                    where: { workspaceId: id, role: 'admin' }
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
                where: { id },
                data: { updatedAt: new Date() }
            });

            return member;
        });

        res.json({ success: true, data: updatedMember });
    }
    catch (err) { next(err);}
}

export async function deleteWorkspaceMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const id = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
        const userId = parseOrThrow(idSchema, 'UserID', req.params.userId);

        const targetMembership = await prisma.workspaceMember.findFirst({
            where: { workspaceId: id, userId }
        });

        if (!targetMembership)
            throw new ApiError(404, 'Member not found in workspace');

        await prisma.$transaction(async (tx) => {
            if (targetMembership.role === 'admin') {
                const adminCount = await tx.workspaceMember.count({
                    where: { workspaceId: id, role: 'admin' }
                });

                if (adminCount <= 1)
                    throw new ApiError(400, 'It is not possible to remove the last admin from the workspace.');
            }

            await tx.workspaceMember.delete({
                where: { id: targetMembership.id }
            });

            await tx.workspace.update({
                where: { id },
                data: { updatedAt: new Date() }
            });
        });

        res.json({ success: true, message: 'Member successfully removed.' });
    }
    catch (err) { next(err); }
}

export async function listWorkspaceColumns(req: Request, res: Response, next: NextFunction)
{
  try {
    const workspaceId = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);

    const columns = await prisma.column.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { tasks: true } }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ success: true, data: columns });
  } catch (err) { next(err); }
}

export async function listWorkspaceTasks(req: Request, res: Response, next: NextFunction)
{
  try {
    const workspaceId = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
    const columnId = parseQueryInt('columnId', req.query.columnId, { isOptional: true, min: 1 });
    const priority = parseQueryEnum('priority', req.query.priority, Priority, { isOptional: true });
    const assigneeId = parseQueryInt('assignee', req.query.assignee, { isOptional: true, min: 1 });
    const isDone = parseQueryBool('isDone', req.query.isDone, { isOptional: true });

    const where: any = { column: { workspaceId } };
    if (columnId !== undefined) where.columnId = columnId;
    if (priority !== undefined) where.priority = priority;
    if (isDone !== undefined) where.isDone = isDone;
    if (assigneeId !== undefined) {
      where.assignments = { some: { userId: assigneeId } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignments: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        column: { select: { id: true, name: true } }
      },
      orderBy: [{ columnId: 'asc' }, { orderInColumn: 'asc' }]
    });

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
}
