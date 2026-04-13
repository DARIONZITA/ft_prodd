import { WorkspaceRole } from '@prisma/client';
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import {
	workspaceIdParamsSchema,
	workspaceMemberParamsSchema,
	updateWorkspaceMemberRoleSchema
} from '../validations/workspace';

const router = Router();

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: Listar todos os workspaces do utilizador
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de workspaces
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
 *         description: Não autenticado
 */

/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     summary: Obter detalhes de um workspace
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
 *         description: Detalhes do workspace
 *       404:
 *         description: Workspace não encontrado
 *       403:
 *         description: Sem permissão
 */

/**
 * @swagger
 * /workspaces/{id}/members:
 *   get:
 *     summary: Listar membros de um workspace
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
 *         description: Lista de membros
 *       403:
 *         description: Sem permissão
 */

/**
 * @swagger
 * /workspaces/{id}/members/{userId}:
 *   get:
 *     summary: Obter detalhes de um membro
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
 *         description: Detalhes do membro
 *   put:
 *     summary: Atualizar papel de um membro
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
 *               role: { type: string, enum: [admin, editor, guest] }
 *     responses:
 *       200:
 *         description: Membro atualizado
 *       403:
 *         description: Apenas admins podem fazer isso
 *   delete:
 *     summary: Remover membro do workspace
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
 *         description: Membro removido
 *       403:
 *         description: Apenas admins podem fazer isso
 */


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
		throw new ApiError(403, 'Sem permissao para este workspace');

	return membership;
};

const ensureAdmin = (role: WorkspaceRole) => {
	if (role !== 'admin')
		throw new ApiError(403, 'Apenas admins podem executar esta acao');
};

router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
	try
	{
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
	catch (err)
	{
		next(err);
	}
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
	try
	{
		const { id } = parseOrThrow(workspaceIdParamsSchema, req.params);
		const membership = await getWorkspaceMembership(id, req.user!.id);
		const workspace = await prisma.workspace.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				updatedAt: true
			}
		});

		if (!workspace)
			throw new ApiError(404, 'Workspace nao encontrado');

		res.json({ success: true, data: { ...workspace, role: membership.role } });
	}
	catch (err)
	{
		next(err);
	}
});

router.get('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
	try
	{
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
	}
	catch (err)
	{
		next(err);
	}
});

router.get('/:id/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
	try
	{
		const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, req.params);
		const requesterMembership = await getWorkspaceMembership(id, req.user!.id);

		if (requesterMembership.role === 'guest' && req.user!.id !== userId)
			throw new ApiError(403, 'Guests so podem visualizar o proprio perfil');

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
			throw new ApiError(404, 'Membro nao encontrado no workspace');

		res.json({ success: true, data: member });
	}
	catch (err)
	{
		next(err);
	}
});

router.put('/:id/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
	try
	{
		const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, req.params);
		const { role } = parseOrThrow(updateWorkspaceMemberRoleSchema, req.body);
		const requesterMembership = await getWorkspaceMembership(id, req.user!.id);
		ensureAdmin(requesterMembership.role);

		const targetMembership = await prisma.workspaceMember.findFirst({
			where: { workspaceId: id, userId }
		});

		if (!targetMembership)
			throw new ApiError(404, 'Membro nao encontrado no workspace');

		const updatedMember = await prisma.$transaction(async (tx) => {
			if (targetMembership.role === 'admin' && role !== 'admin')
			{
				const adminCount = await tx.workspaceMember.count({
					where: { workspaceId: id, role: 'admin' }
				});

				if (adminCount <= 1)
					throw new ApiError(400, 'Nao e possivel remover o ultimo admin do workspace');
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
	}
	catch (err)
	{
		next(err);
	}
});

router.delete('/:id/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
	try
	{
		const { id, userId } = parseOrThrow(workspaceMemberParamsSchema, req.params);
		const requesterMembership = await getWorkspaceMembership(id, req.user!.id);
		ensureAdmin(requesterMembership.role);

		const targetMembership = await prisma.workspaceMember.findFirst({
			where: { workspaceId: id, userId }
		});

		if (!targetMembership)
			throw new ApiError(404, 'Membro nao encontrado no workspace');

		await prisma.$transaction(async (tx) => {
			if (targetMembership.role === 'admin')
			{
				const adminCount = await tx.workspaceMember.count({
					where: { workspaceId: id, role: 'admin' }
				});

				if (adminCount <= 1)
					throw new ApiError(400, 'Nao e possivel remover o ultimo admin do workspace');
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

		res.json({ success: true, message: 'Membro removido com sucesso' });
	}
	catch (err)
	{
		next(err);
	}
});

export default router;
