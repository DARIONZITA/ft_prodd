import { z } from 'zod';

const positiveId = z.coerce.number().int().positive();
const badgeName = z.string().min(1).max(255);
const badgeDescription = z.string().min(1).max(1000);
const badgeIconUrl = z.string().min(1).max(2000);

// Params validations
export const badgeIdParamsSchema = z.object({
	id: positiveId
});

export const badgeUserParamsSchema = z.object({
	id: positiveId,
	userId: positiveId
});

// Body validations
export const createBadgeSchema = z.object({
	name: badgeName,
	description: badgeDescription,
	iconUrl: badgeIconUrl
});

export const updateBadgeSchema = z.object({
	name: badgeName.optional(),
	description: badgeDescription.optional(),
	iconUrl: badgeIconUrl.optional()
});

export const assignBadgeSchema = z.object({
	userId: positiveId
});
