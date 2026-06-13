import { Request, Response, NextFunction }	from 'express';
import { WorkspaceRole }					from '@prisma/client';
import { prisma }							from '../lib/prisma';
import { ApiError }							from '../utils/ApiError';

export function requireWorkspaceRole(requiredRoles: WorkspaceRole[])
{
	return async ( req: Request, _res: Response, next: NextFunction ): Promise<void> => {
		try {
			const role = req.workspace?.role;

			if (!role || !requiredRoles.includes(role))
				return next( new ApiError(403, `Only ${requiredRoles.join(', ')} can perform this action`) );
			next();
		} catch (err) {
			next(err);
		}
	};
}

export const requireWorkspaceAdmin = requireWorkspaceRole(['admin']);
export const requireWorkspaceMember = requireWorkspaceRole([ 'admin', 'member' ]);
export const requireWorkspaceAccess = requireWorkspaceRole([ 'admin', 'member', 'guest' ]);

export async function getWorkspaceRole( workspaceId: number, userId: number ): Promise<WorkspaceRole>
{
	const membership = await prisma.workspaceMember.findFirst({ where: { workspaceId, userId } });

	if (!membership)
		throw new ApiError(403, 'No permission for this workspace');
	return membership.role;
}
