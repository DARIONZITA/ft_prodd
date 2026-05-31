import type { Request, Response, NextFunction }     from 'express';
import { WorkspaceRole }							from '@prisma/client';
import { prisma }									from '../../../lib/prisma';
import { ApiError }									from '../../../utils/ApiError';
import {
	workspaceIdParamsSchema,
	workspaceMemberParamsSchema,
	updateWorkspaceMemberRoleSchema,
	createWorkspaceSchema,
	updateWorkspaceSchema,
    addWorkspaceMemberSchema
}                                                   from '../../../validations/workspace';
import { idSchema, parseOrThrow,
    parseQueryInt, parseQueryString }               from '../../../validations/utils';
import { ActivityLogActionMaxLength }               from '../../../types/constants';


const getWorkspaceMembership = async (workspaceId: number, userId: number) => {
	const membership = await prisma.workspaceMember.findFirst({
		where: { workspaceId, userId }
	});

	if (!membership)
		throw new ApiError(403, 'No permission for this workspace');

	return membership;
};

const ensureAdmin = (role: WorkspaceRole) => {
	if (role !== 'admin')
		throw new ApiError(403, 'Only admins can perform this action');
};

export async function createWorkspace(req: Request, res: Response, next: NextFunction)
{
    try {
        const { name, description } = parseOrThrow(createWorkspaceSchema, 'WorkspaceID', req.body);

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

            await tx.activityLog.create({
                data: {
                    workspaceId: workspace.id,
                    userId: req.user!.id,
                    action: `Created workspace "${name}"`
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
		const memberships = await prisma.workspaceMember.findMany({
			where: { userId: req.user!.id },
			include: {
				workspace: {
					select: {
						id: true,
						name: true,
						description: true,
						createdAt: true,
						updatedAt: true
					}
				}
			},
			orderBy: { workspaceId: 'asc' }
		});

		res.json({
			success: true,
			data: memberships.map((membership) => ({
				...membership.workspace,
				role: membership.role
			}))
		});
	}
    catch (err) { next(err); }
}

export async function   updateWorkspace(req: Request, res: Response, next: NextFunction)
{
    try {
        const { id } = parseOrThrow(workspaceIdParamsSchema, 'workspaceID', req.params);
        const updateData = parseOrThrow(updateWorkspaceSchema, 'UpdateWorkspace', req.body);
        const requesterMembership = await getWorkspaceMembership(id, req.user!.id);
        ensureAdmin(requesterMembership.role);

        if (!updateData.name && updateData.description === undefined) {
            throw new ApiError(400, 'At least one field must be provided');
        }

        const updatedWorkspace = await prisma.$transaction(async (tx) => {
            const workspace = await tx.workspace.update({
                where: { id },
                data: {
                    ...(updateData.name && { name: updateData.name }),
                    ...(updateData.description !== undefined && { description: updateData.description })
                }
            });

            await tx.activityLog.create({
                data: {
                    workspaceId: id,
                    userId: req.user!.id,
                    action: 'Updated workspace details'
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
        const { id } = parseOrThrow(workspaceIdParamsSchema, 'workspaceID', req.params);
        const requesterMembership = await getWorkspaceMembership(id, req.user!.id);
        ensureAdmin(requesterMembership.role);

        const workspace = await prisma.workspace.findUnique({ where: { id } });
        if (!workspace) {
            throw new ApiError(404, 'Workspace not found');
        }

        await prisma.$transaction(async (tx) => {
            
            await tx.activityLog.deleteMany({ where: { workspaceId: id } });

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
        const { id } = parseOrThrow(workspaceIdParamsSchema, 'workspaceID', req.params);
        const membership = await getWorkspaceMembership(id, req.user!.id);

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
                activityLogs: {
                    take: -4,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true
                            }
                        }
                    }
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
            role: membership.role,
            taskCount: totalTaskCount,
            members: workspace.members,
            activityLogs: workspace.activityLogs.reverse()
        };

        res.json({ success: true, data: formattedData });
    }
    catch (err) { next(err); }
}

export async function   createWorkspaceMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const { id } = parseOrThrow(workspaceIdParamsSchema, 'workspaceID', req.params);
        const { userId, role } = parseOrThrow(addWorkspaceMemberSchema, 'AddWorkspaceMember', req.body);
        const requesterMembership = await getWorkspaceMembership(id, req.user!.id);
        ensureAdmin(requesterMembership.role);

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

            await tx.activityLog.create({
                data: {
                    workspaceId: id,
                    userId: req.user!.id,
                    action: `Added user ${userId} to workspace as ${role}`
                }
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
        const { id } = parseOrThrow(workspaceIdParamsSchema, 'workspaceID', req.params);
        await getWorkspaceMembership(id, req.user!.id);

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
        const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, 'WorkspaceMemberParams', req.params);
        const requesterMembership = await getWorkspaceMembership(id, req.user!.id);

        if (requesterMembership.role === 'guest' && req.user!.id !== userId)
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
        const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, 'WorkspaceMemberParams', req.params);
        const { role } = parseOrThrow(updateWorkspaceMemberRoleSchema, 'UpdateWorkspaceMemberRole', req.body);
        const requesterMembership = await getWorkspaceMembership(id, req.user!.id);
        ensureAdmin(requesterMembership.role);

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

            await tx.activityLog.create({
                data: {
                    workspaceId: id,
                    userId: req.user!.id,
                    action: `Updated workspace role for user ${userId} to ${role}`
                }
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
        const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, 'WorkspaceMemberParams', req.params);
        const requesterMembership = await getWorkspaceMembership(id, req.user!.id);
        ensureAdmin(requesterMembership.role);

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

            await tx.activityLog.create({
                data: {
                    workspaceId: id,
                    userId: req.user!.id,
                    action: `Removed user ${userId} from workspace`
                }
            });
        });

        res.json({ success: true, message: 'Member successfully removed.' });
    }
    catch (err) { next(err); }
}

export async function getWorkspaceActivityLog(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
        await getWorkspaceMembership(id, req.user!.id);
		const skip = parseQueryInt('skip', req.query.skip, { default: 0, min: 0 });
		const take = parseQueryInt('take', req.query.take, { default: 42, min: 1, max: 100 });

        const where: any = { workspaceId: id, userId: req.user!.id };

        const activityLogs = await prisma.activityLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            },
            skip,
            take,
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma.activityLog.count({ where });

		res.json({
			success: true,
			data: {
				activityLogs,
				pagination: { skip, take, total }
			}
		});
    }
    catch (err) { next(err); }
}

export async function createWorkspaceActivityLog(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);
        await getWorkspaceMembership(id, req.user!.id);
        const action: string = parseQueryString('action', req.body.action, { isOptional: false, minLength: 1, maxLength: ActivityLogActionMaxLength }) ?? "";

        const activityLog = await prisma.activityLog.create({
            data: {
                workspaceId: id,
                userId: req.user!.id,
                action
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        res.status(201).json({ success: true, data: activityLog });
    }
    catch (err) { next(err); }
}
