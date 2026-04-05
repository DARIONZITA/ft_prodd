import { z } from 'zod';

const positiveId = z.coerce.number().int().positive();

export const workspaceIdParamsSchema = z.object({
	id: positiveId
});

export const workspaceMemberParamsSchema = z.object({
	id: positiveId,
	userId: positiveId
});

export const updateWorkspaceMemberRoleSchema = z.object({
	role: z.enum(['admin', 'member', 'guest'])
});
