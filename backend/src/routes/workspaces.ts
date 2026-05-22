import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import {
	workspaceIdParamsSchema,
	workspaceMemberParamsSchema,
	updateWorkspaceMemberRoleSchema,
	createWorkspaceSchema,
	updateWorkspaceSchema,
	addWorkspaceMemberSchema
} from '../validations/workspace';

const router = Router();

const parseOrThrow = <T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ message: string }> } } }, value: unknown): T => {
	const result = schema.safeParse(value);

	if (!result.success)
		throw new ApiError(400, result.error?.issues.map((issue) => issue.message).join(', ') || 'Invalid input');

	return result.data as T;
};

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

router.use(authenticate);

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, maxLength: 1000 }
 *     responses:
 *       201:
 *         description: Workspace created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name, description } = parseOrThrow(createWorkspaceSchema, req.body);

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
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: List all user workspaces
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Workspace list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Workspace' }
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
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
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /workspaces/{id}:
 *   put:
 *     summary: Update workspace details
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, maxLength: 1000 }
 *     responses:
 *       200:
 *         description: Workspace updated
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Workspace not found
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(workspaceIdParamsSchema, req.params);
		const updateData = parseOrThrow(updateWorkspaceSchema, req.body);
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
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /workspaces/{id}:
 *   delete:
 *     summary: Delete a workspace
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Workspace deleted
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Workspace not found
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(workspaceIdParamsSchema, req.params);
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
	} catch (err) {
		next(err);
	}
});


/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     summary: Get workspace details with members, activity logs, and task counts
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Workspace details with members and activity logs
 *       404:
 *         description: Workspace not found
 *       403:
 *         description: Forbidden
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(workspaceIdParamsSchema, req.params);
		const membership = await getWorkspaceMembership(id, req.user!.id);

		const workspace = await prisma.workspace.findUnique({
			where: { id },
			include: {
				members: {
					include: {
						user: {
							select: {
								id: true,
								nickname: true,
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
								nickname: true,
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
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /workspaces/{id}/members:
 *   post:
 *     summary: Add member to workspace
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: integer }
 *               role: { type: string, enum: [admin, member, guest], default: member }
 *     responses:
 *       201:
 *         description: Member added
 *       400:
 *         description: User already member or invalid input
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: User not found
 */
router.post('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(workspaceIdParamsSchema, req.params);
		const { userId, role } = parseOrThrow(addWorkspaceMemberSchema, req.body);
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
							nickname: true,
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
	} catch (err) {
		next(err);
	}
});


/**
 * @swagger
 * /workspaces/{id}/members:
 *   get:
 *     summary: List workspace members
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Member list
 *       403:
 *         description: Forbidden
 */
router.get('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = parseOrThrow(workspaceIdParamsSchema, req.params);
		await getWorkspaceMembership(id, req.user!.id);

		const members = await prisma.workspaceMember.findMany({
			where: { workspaceId: id },
			include: {
				user: {
					select: {
						id: true,
						nickname: true,
						email: true,
						avatarUrl: true
					}
				}
			},
			orderBy: [{ role: 'asc' }, { userId: 'asc' }]
		});

		res.json({ success: true, data: members });
	} catch (err) {
		next(err);
	}
});


/**
 * @swagger
 * /workspaces/{id}/members/{userId}:
 *   get:
 *     summary: Get member details
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Member details
 *       404:
 *         description: Member not found
 */
router.get('/:id/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, req.params);
		const requesterMembership = await getWorkspaceMembership(id, req.user!.id);

		if (requesterMembership.role === 'guest' && req.user!.id !== userId)
			throw new ApiError(403, 'Guests can only view their own profile');

		const member = await prisma.workspaceMember.findFirst({
			where: { workspaceId: id, userId },
			include: {
				user: {
					select: {
						id: true,
						nickname: true,
						email: true,
						avatarUrl: true
					}
				}
			}
		});

		if (!member)
			throw new ApiError(404, 'Member not found in workspace');

		res.json({ success: true, data: member });
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /workspaces/{id}/members/{userId}:
 *   put:
 *     summary: Update a member role
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [admin, member, guest] }
 *     responses:
 *       200:
 *         description: Member updated
 *       403:
 *         description: Only admins can perform this action
 */
router.put('/:id/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, req.params);
		const { role } = parseOrThrow(updateWorkspaceMemberRoleSchema, req.body);
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
							nickname: true,
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
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /workspaces/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a workspace member
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Member removed
 *       403:
 *         description: Only admins can perform this action
 */
router.delete('/:id/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, req.params);
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
	} catch (err) {
		next(err);
	}
});

export default router;
