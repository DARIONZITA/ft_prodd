import { z } from 'zod';

const positiveId = z.coerce.number().int().positive();
const workspaceName = z.string().min(1).max(255);
const workspaceDescription = z.string().max(1000).optional();
const workspaceDescriptionRequired = z.string().min(1).max(1000);

// Params validations
export const workspaceIdParamsSchema = z.object({
	id: positiveId
});

export const workspaceMemberParamsSchema = z.object({
	id: positiveId,
	userId: positiveId
});

// Body validations
export const createWorkspaceSchema = z.object({
	name: workspaceName,
	description: workspaceDescriptionRequired
});

export const updateWorkspaceSchema = z.object({
	name: workspaceName.optional(),
	description: workspaceDescription
});

export const addWorkspaceMemberSchema = z.object({
	userId: positiveId,
	role: z.enum(['admin', 'member', 'guest']).default('member')
});

export const updateWorkspaceMemberRoleSchema = z.object({
	role: z.enum(['admin', 'member', 'guest'])
});
