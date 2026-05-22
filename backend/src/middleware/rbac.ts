import { Request, Response, NextFunction } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

export type PermissionCheck = (role: WorkspaceRole) => boolean;


export const requireWorkspaceRole = (requiredRoles: WorkspaceRole[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const workspaceId = parseInt(req.params.id);

			if (isNaN(workspaceId)) {
				return next(new ApiError(400, 'Invalid workspace ID'));
			}

			const membership = await prisma.workspaceMember.findFirst({
				where: {
					workspaceId,
					userId: req.user!.id
				}
			});

			if (!membership) {
				return next(new ApiError(403, 'No permission for this workspace'));
			}

			if (!requiredRoles.includes(membership.role)) {
				return next(new ApiError(403, `Only ${requiredRoles.join(', ')} can perform this action`));
			}

			(req as any).membership = membership;
			next();
		} catch (err) {
			next(err);
		}
	};
};


export const requireWorkspaceAdmin = requireWorkspaceRole(['admin']);


export const requireWorkspaceMember = requireWorkspaceRole(['admin', 'member', 'guest']);

export const isWorkspaceAdmin = async (workspaceId: number, userId: number): Promise<boolean> => {
	const membership = await prisma.workspaceMember.findFirst({
		where: { workspaceId, userId }
	});
	return membership?.role === 'admin' || false;
};


export const isWorkspaceMember = async (workspaceId: number, userId: number): Promise<boolean> => {
	const membership = await prisma.workspaceMember.findFirst({
		where: { workspaceId, userId }
	});
	return !!membership;
};


export const getWorkspaceRole = async (workspaceId: number, userId: number): Promise<WorkspaceRole | null> => {
	const membership = await prisma.workspaceMember.findFirst({
		where: { workspaceId, userId }
	});
	return membership?.role || null;
};
