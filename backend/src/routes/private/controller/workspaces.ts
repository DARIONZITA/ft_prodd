import type { Request, Response, NextFunction }     from 'express';
import { NotificationType }                         from '@prisma/client';
import { prisma }                                   from '../../../lib/prisma';
import { ApiError }                                 from '../../../utils/ApiError';
import { requireFriendship }                        from './friends';
import { idSchema, parseOrThrow, parseQueryString } from '../../../validations/utils';
import { notify } from '../../../utils/notify';

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
                                assignments: { include: { user: { select: { username: true } } } },
                                checklistItems: { orderBy: { id: 'asc' } }
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
                columnType: col.columnType,
                order: col.order,
                tasks: col.tasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    labels: task.taskLabels.map(tl => tl.label.name),
                    assignments: task.assignments.map(a => a.user.username),
                    checklist: task.checklistItems.map(ci => ({
                        id: ci.id,
                        description: ci.description,
                        isCompleted: ci.isCompleted
                    }))
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
                await notify(
                    {
                        userIds: members.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `Workspace "${workspace.name}" updated: ${changes.join(', ')}` 
                    },
                    tx
                );
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
                await notify(
                    {
                        userIds: members.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `Workspace "${req.workspace!.name}" has been deleted by ${req.user!.username}`
                    },
                    tx
                );
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

		const result = await prisma.$transaction(async (tx) => {
			if (targetUserId !== req.user!.id)
				await requireFriendship(req.user!.id, targetUserId, "You must be friends to view this user's workspaces", tx);

			const memberships = await tx.workspaceMember.findMany({
				where: { userId: targetUserId, role: { notIn: ['pending', 'requesting'] } },
				include: {
					workspace: {
						select: {
							id: true,
							name: true,
							description: true,
							createdAt: true,
							updatedAt: true,
							_count: { select: { members: { where: { role: { notIn: ['pending', 'requesting'] } } } } }
						}
					}
				},
				orderBy: { workspaceId: 'asc' }
			});

			const workspaceIds = memberships.map(m => m.workspaceId);
			const currentUserMemberships = await tx.workspaceMember.findMany({
				where: {
					workspaceId: { in: workspaceIds },
					userId: req.user!.id
				}
			});
			const currentUserMembershipMap = new Map(
				currentUserMemberships.map(m => [m.workspaceId, m.role])
			);

			return { memberships, currentUserMembershipMap };
		});

        res.json({
			success: true,
			data: result.memberships.map((membership) => ({
				id: membership.workspace.id,
				name: membership.workspace.name,
				description: membership.workspace.description,
				createdAt: membership.workspace.createdAt,
				updatedAt: membership.workspace.updatedAt,
				role: membership.role,
				memberCount: membership.workspace._count.members,
				currentUserRole: result.currentUserMembershipMap.get(membership.workspaceId) || null
			}))
		});
	}
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   Request to join a workspace (creates member with role=requesting)
───────────────────────────────────────────────────────── */
export async function requestToJoinWorkspace(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = parseOrThrow(idSchema, 'requestToJoinWorkspace() workspaceId', req.params.workspaceId);
        const userId = req.user!.id;

        const newRequest = await prisma.$transaction(async (tx) => {
            const workspace = await tx.workspace.findUnique({
                where: { id: workspaceId },
                include: { members: { where: { role: 'admin' } } }
            });
            if (!workspace)
                throw new ApiError(404, 'Workspace not found');

            const existingMembership = await tx.workspaceMember.findFirst({
                where: { workspaceId, userId }
            });
            if (existingMembership) {
                if (existingMembership.role === 'requesting') {
                    throw new ApiError(400, 'You have already requested to join this workspace');
                } else if (existingMembership.role === 'pending') {
                    throw new ApiError(400, 'You have a pending invitation to this workspace. Please accept it instead');
                } else {
                    throw new ApiError(400, 'You are already a member of this workspace');
                }
            }

            // Create WorkspaceMember with role 'requesting'
            const membership = await tx.workspaceMember.create({
                data: {
                    workspaceId,
                    userId,
                    role: 'requesting',
                    invitedRole: 'member'
                }
            });

            // Create notification for all admins of the workspace
            const admins = workspace.members;
            if (admins.length > 0) {
                await tx.notification.createMany({
                    data: admins.map(admin => ({
                        userId: admin.userId,
                        type: NotificationType.workspace,
                        message: `${req.user!.username} requested to join workspace "${workspace.name}"`
                    }))
                });
            }

            return membership;
        });

        res.status(201).json({
            success: true,
            message: 'Join request sent successfully',
            data: newRequest
        });
    }
    catch (err) { next(err); }
}

