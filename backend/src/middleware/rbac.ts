import { Request, Response, NextFunction }	from 'express';
import { WorkspaceRole }					from '@prisma/client';
import { prisma }							from '../lib/prisma';
import { ApiError }							from '../utils/ApiError';
import { parseOrThrow }						from '../validations/utils';
import { idSchema }							from '../validations/utils';

export function requireWorkspaceRole(requiredRoles: WorkspaceRole[])
{
	return async ( req: Request, res: Response, next: NextFunction ): Promise<void> => {
		try {
			const workspaceId = parseOrThrow(idSchema, 'WorkspaceID', req.params.id);

			const membership = await prisma.workspaceMember.findFirst({
				where: {
					workspaceId,
					userId: req.user!.id
				}
			});

			if (!membership)
				return next(new ApiError(403, 'No permission for this workspace'));

			if (!requiredRoles.includes(membership.role)) {
				return next(
					new ApiError(
						403,
						`Only ${requiredRoles.join(', ')} can perform this action`
					)
				);
			}

			(req as any).membership = membership;
			next();
		} catch (err) {
			next(err);
		}
	};
}

export const requireWorkspaceAdmin = requireWorkspaceRole(['admin']);
export const requireWorkspaceAdminMember = requireWorkspaceRole([ 'admin', 'member' ]);

export async function getWorkspaceRole( workspaceId: number, userId: number ): Promise<WorkspaceRole>
{
	const membership = await prisma.workspaceMember.findFirst({ where: { workspaceId, userId } });

	if (!membership)
		throw new ApiError(403, 'No permission for this workspace');
	return membership.role;
}
