import type { Request, Response, NextFunction }     from 'express';
import { NotificationType }                         from '@prisma/client';
import { prisma }                                   from '../../../lib/prisma';
import { ApiError }                                 from '../../../utils/ApiError';
import { requireFriendship }                        from './friends';
import { idSchema, parseOrThrow, parseQueryString } from '../../../validations/utils';

export async function   getWorkspaceDetails(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: req.workspace!.id },
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
            role: req.workspace!.role,
            taskCount: totalTaskCount,
            members: workspace.members
        };

        res.json({ success: true, data: formattedData });
    }
    catch (err) { next(err); }
}

export async function   getWorkspaceDashboard(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: req.workspace!.id },
            include: {
                _count: { select: { members: true } },
                columns: {
                    orderBy: { order: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { orderInColumn: 'asc' },
                            include: {
                                taskLabels: { include: { label: { select: { name: true } } } },
                                assignments: { include: { user: { select: { username: true } } } }
                            }
                        }
                    }
                }
            }
        });

        if (!workspace)
            throw new ApiError(404, 'Workspace not found');

        const data = {
            workspace: {
                id: workspace.id,
                name: workspace.name,
                description: workspace.description,
                createdAt: workspace.createdAt
            },
            totalMembers: workspace._count.members,
            columns: workspace.columns.map(col => ({
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
        };

        res.json({ success: true, data });
    }
    catch (err) { next(err); }
}

export async function createWorkspace(req: Request, res: Response, next: NextFunction)
{
    try {
        const name = parseQueryString('createWorkspace() name', req.body.name, { isOptional: false, minLength: 1, maxLength: 255 })!;
        const description = parseQueryString('createWorkspace() description', req.body.description, { default: '', isOptional: true, minLength: 1, maxLength: 1000 })!;

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

export async function   updateWorkspace(req: Request, res: Response, next: NextFunction)
{
    try {
        const name = parseQueryString('updateWorkspace() name', req.body.name, { isOptional: true, minLength: 1, maxLength: 255 });
        const description = parseQueryString('updateWorkspace() description', req.body.description, { isOptional: true, minLength: 1, maxLength: 1000 });

        if (name === undefined && description === undefined)
            throw new ApiError(400, 'At least one field must be provided');

        const updatedWorkspace = await prisma.$transaction(async (tx) => {
            const workspace = await tx.workspace.update({
                where: { id: req.workspace!.id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(description !== undefined && { description })
                }
            });

            const changes: string[] = [];
            if (name !== undefined) changes.push(`name changed to "${name}"`);
            if (description !== undefined) changes.push(`description changed to "${description}"`);

            const members = await tx.workspaceMember.findMany({
                where: { workspaceId: req.workspace!.id, userId: { not: req.user!.id } },
                select: { userId: true }
            });

            if (members.length > 0) {
                await tx.notification.createMany({
                    data: members.map(m => ({
                        userId: m.userId,
                        type: NotificationType.workspace,
                        message: `Workspace "${workspace.name}" updated: ${changes.join(', ')}`
                    }))
                });
            }

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
        await prisma.$transaction(async (tx) => {
            const members = await tx.workspaceMember.findMany({
                where: { workspaceId: req.workspace!.id },
                select: { userId: true }
            });

            if (members.length > 0) {
                await tx.notification.createMany({
                    data: members.map(m => ({
                        userId: m.userId,
                        type: NotificationType.workspace,
                        message: `Workspace "${req.workspace!.name}" has been deleted by ${req.user!.username}`
                    }))
                });
            }

            await tx.workspaceMember.deleteMany({ where: { workspaceId: req.workspace!.id } });
            await tx.workspace.delete({ where: { id: req.workspace!.id } });
        });

        res.json({
            success: true,
            message: 'Workspace deleted successfully'
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
