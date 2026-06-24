import type { Request, Response, NextFunction }     from 'express';
import { NotificationType }                         from '@prisma/client';
import { prisma }                                   from '../../../lib/prisma';
import { ApiError }                                 from '../../../utils/ApiError';
import { WorkspaceRole }                            from '../../../types/constants';
import { idSchema, parseOrThrow, parseQueryEnum }   from '../../../validations/utils';
import { notify } from '../../../utils/notify';
const MEMBER_SELECT = {
    role: true,
    invitedRole: true,
    invitedById: true,
    createdAt: true,
    user: {
        select: { id: true, username: true, email: true, avatarUrl: true }
    },
    invitedBy: {
        select: { id: true, username: true, avatarUrl: true }
    }
} as const;

export async function listMembers(req: Request, res: Response, next: NextFunction)
{
    try {
        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId: req.workspace!.id, role: { notIn: ['pending', 'requesting'] } },
            select: MEMBER_SELECT,
            orderBy: [{ role: 'asc' }, { userId: 'asc' }]
        });

        res.json({
            success: true,
            data: members.map(m => ({
                role: m.role,
                joinedAt: m.createdAt,
                userId: m.user.id,
                user: m.user
            }))
        });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   Get single member
───────────────────────────────────────────────────────── */
export async function getMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const userId = parseOrThrow(idSchema, 'getMember() UserID', req.params.userId);

        const member = await prisma.workspaceMember.findFirst({
            where: { workspaceId: req.workspace!.id, userId },
            select: MEMBER_SELECT
        });

        if (!member)
            throw new ApiError(404, 'Member not found in workspace');

        res.json({
            success: true,
            data: { role: member.role, joinedAt: member.createdAt, user: member.user }
        });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   Send invitation (creates member with role=pending)
───────────────────────────────────────────────────────── */
export async function createMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const userId = parseOrThrow(idSchema, 'createMember() UserID', req.params.userId);

        // The intended role after acceptance (defaults to member); pending is not allowed as intended role
        const intendedRole = parseQueryEnum('role', req.body.role ?? req.query.role, WorkspaceRole, { default: 'member', isOptional: true })!;
        const safeIntendedRole = intendedRole === 'pending' ? 'member' : intendedRole;

        const newMembership = await prisma.$transaction(async (tx) => {
            const targetUser = await tx.user.findUnique({ where: { id: userId } });
            if (!targetUser)
                throw new ApiError(404, 'User not found');

            const existingMembership = await tx.workspaceMember.findFirst({
                where: { workspaceId, userId }
            });
            if (existingMembership)
                throw new ApiError(400, 'User is already a member or has a pending invitation for this workspace');

            // Create with role=pending — user must accept
            const member = await tx.workspaceMember.create({
                data: {
                    workspaceId,
                    userId,
                    role: 'pending',
                    invitedRole: safeIntendedRole,
                    invitedById: req.user!.id
                },
                select: MEMBER_SELECT
            });

            await tx.workspace.update({
                where: { id: workspaceId },
                data: { updatedAt: new Date() }
            });

            // Notify the invited user
            await notify(
                {
                    userIds: [userId],
                    type: NotificationType.workspace,
                    message: `${req.user!.username} invited you to workspace "${req.workspace!.name}" as ${safeIntendedRole}`
                },
                tx
            );
            return member;
        });

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            data: newMembership
        });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   List pending invitations for the current user (all workspaces)
───────────────────────────────────────────────────────── */
export async function listMyInvitations(req: Request, res: Response, next: NextFunction)
{
    try {
        const invitations = await prisma.workspaceMember.findMany({
            where: { userId: req.user!.id, role: 'pending' },
            include: {
                workspace: { select: { id: true, name: true, description: true, createdAt: true } },
                invitedBy: { select: { id: true, username: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: invitations.map(inv => ({
                workspaceId: inv.workspaceId,
                workspace: inv.workspace,
                invitedRole: inv.invitedRole,
                invitedBy: inv.invitedBy,
                invitedAt: inv.createdAt
            }))
        });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   Accept invitation (current user accepts for a specific workspace)
───────────────────────────────────────────────────────── */
export async function acceptInvitation(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = parseOrThrow(idSchema, 'acceptInvitation() workspaceId', req.params.workspaceId);

        const result = await prisma.$transaction(async (tx) => {
            const invitation = await tx.workspaceMember.findFirst({
                where: { workspaceId, userId: req.user!.id, role: 'pending' }
            });

            if (!invitation)
                throw new ApiError(404, 'No pending invitation found for this workspace');

            const member = await tx.workspaceMember.update({
                where: { id: invitation.id },
                data: { role: invitation.invitedRole },
                select: MEMBER_SELECT
            });

            await tx.workspace.update({
                where: { id: workspaceId },
                data: { updatedAt: new Date() }
            });

            // Notify other members
            const otherMembers = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id }, role: { not: 'pending' } },
                select: { userId: true }
            });

            if (otherMembers.length) {
                await notify(
                    {
                        userIds: otherMembers.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `${member.user.username} has been added to workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx,
                    invitation.invitedById ? new Set([invitation.invitedById]) : undefined  // Exclude the acting user from receiving this notification
                );
            }
            if (invitation.invitedById !== null)
            {
                await notify(
                    {
                        userIds: [invitation.invitedById],
                        type: NotificationType.workspace,
                        message: `${req.user!.username} has accepted your invitation to join workspace "${req.workspace!.name}"`
                    },
                    tx
                );
            }

            return member;
        });

        res.json({ success: true, message: 'Invitation accepted', data: result });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   Decline invitation (current user declines for a specific workspace)
───────────────────────────────────────────────────────── */
export async function declineInvitation(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = parseOrThrow(idSchema, 'declineInvitation() workspaceId', req.params.workspaceId);

        await prisma.$transaction(async (tx) => {
            const invitation = await tx.workspaceMember.findFirst({
                where: { workspaceId, userId: req.user!.id, role: 'pending' }
            });

            if (!invitation)
                throw new ApiError(404, 'No pending invitation found for this workspace');

            await tx.workspaceMember.delete({ where: { id: invitation.id } });
            if (invitation.invitedById !== null)
            {
                await notify(
                    {
                        userIds: [invitation.invitedById],
                        type: NotificationType.workspace,
                        message: `${req.user!.username} has declined your invitation to join workspace "${req.workspace!.name}"`
                    },
                    tx
                );
            }
        });

        res.json({ success: true, message: 'Invitation declined' });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   Update member role
───────────────────────────────────────────────────────── */
export async function updateMemberRole(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const userId = parseOrThrow(idSchema, 'updateMemberRole() UserID', req.params.userId);
        const role = parseQueryEnum('role', req.body.role ?? req.query.role, WorkspaceRole, { isOptional: false });

        if (!role || role === 'pending')
            throw new ApiError(400, 'Invalid role value');

        const updatedMember = await prisma.$transaction(async (tx) => {
            const targetMembership = await tx.workspaceMember.findFirst({
                where: { workspaceId, userId }
            });

            if (!targetMembership)
                throw new ApiError(404, 'Member not found in workspace');

            if (targetMembership.role === 'admin' && role !== 'admin') {
                const adminCount = await tx.workspaceMember.count({
                    where: { workspaceId, role: 'admin' }
                });

                if (adminCount <= 1)
                    throw new ApiError(400, 'It is not possible to remove the last admin from the workspace.');
            }

            const member = await tx.workspaceMember.update({
                where: { id: targetMembership.id },
                data: { role },
                select: MEMBER_SELECT
            });

            await tx.workspace.update({
                where: { id: workspaceId },
                data: { updatedAt: new Date() }
            });

            const otherMembers = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id }, role: { not: 'pending' } },
                select: { userId: true }
            });

            if (otherMembers.length > 0)
            {
                await notify(
                    {
                        userIds: otherMembers.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `${member.user.username}'s role has been changed to ${role} in workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx,
                    new Set([userId])  // Exclude the target user from receiving this notification
                );
            }
            await notify(
                {
                    userIds: [userId],
                    type: NotificationType.workspace,
                    message: `Your role has been changed to ${role} in workspace "${req.workspace!.name}" by ${req.user!.username}`
                },
                tx
            );

            return member;
        });

        res.json({ success: true, data: updatedMember });
    }
    catch (err) { next(err);}
}

/* ─────────────────────────────────────────────────────────
   Remove member
───────────────────────────────────────────────────────── */
export async function deleteMember(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const userId = parseOrThrow(idSchema, 'deleteMember() UserID', req.params.userId);

        const result = await prisma.$transaction(async (tx) => {
             const targetMembership = await tx.workspaceMember.findFirst({
                where: { workspaceId, userId }
            });

            if (!targetMembership)
                throw new ApiError(404, 'Member not found in workspace');

            if (targetMembership.role === 'admin') {
                const adminCount = await tx.workspaceMember.count({
                    where: { workspaceId, role: 'admin' }
                });

                if (adminCount <= 1)
                    throw new ApiError(400, 'It is not possible to remove the last admin from the workspace.');
            }

            const targetUser = await tx.user.findUnique({
                where: { id: userId },
                select: { username: true }
            });

            const taskIds = await tx.task.findMany({
                where: { column: { workspaceId }, assignments: { some: { userId } } },
                select: { id: true }
            }).then(ts => ts.map(t => t.id));

            if (taskIds.length > 0) {
                await tx.taskAssignment.deleteMany({
                    where: { taskId: { in: taskIds }, userId }
                });
            }

            await tx.workspaceMember.delete({
                where: { id: targetMembership.id }
            });

            const remainingMembers = await tx.workspaceMember.count({
                where: { workspaceId }
            });

            if (remainingMembers === 0) {
                await tx.workspace.delete({ where: { id: workspaceId } });
                return { message: 'Member removed and workspace deleted (no members left).' };
            }

            await tx.workspace.update({
                where: { id: workspaceId },
                data: { updatedAt: new Date() }
            });

            const otherMembers = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { not: req.user!.id }, role: { not: 'pending' } },
                select: { userId: true }
            });

            if (otherMembers.length > 0) {
                await notify(
                    {
                        userIds: otherMembers.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `${targetUser!.username} has been removed from workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx
                );
            }
            await notify(
                {
                    userIds: [userId],
                    type: NotificationType.workspace,
                    message: `You have been removed from workspace "${req.workspace!.name}" by ${req.user!.username}`
                },
                tx
            );

            return { message: 'Member successfully removed.' };
        });

        res.json({ success: true, message: result.message });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   List pending join requests for the workspace (admin only)
───────────────────────────────────────────────────────── */
export async function listJoinRequests(req: Request, res: Response, next: NextFunction)
{
    try {
        const requests = await prisma.workspaceMember.findMany({
            where: { workspaceId: req.workspace!.id, role: 'requesting' },
            select: MEMBER_SELECT,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: requests.map(r => ({
                userId: r.user.id,
                user: r.user,
                requestedAt: r.createdAt
            }))
        });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   Accept join request (admin accepts a request from a user)
───────────────────────────────────────────────────────── */
export async function acceptJoinRequest(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const targetUserId = parseOrThrow(idSchema, 'acceptJoinRequest() targetUserId', req.params.userId);

        const result = await prisma.$transaction(async (tx) => {
            const membership = await tx.workspaceMember.findFirst({
                where: { workspaceId, userId: targetUserId, role: 'requesting' }
            });

            if (!membership)
                throw new ApiError(404, 'No pending join request found for this user in this workspace');

            const updatedMember = await tx.workspaceMember.update({
                where: { id: membership.id },
                data: { role: membership.invitedRole },
                select: MEMBER_SELECT
            });

            await tx.workspace.update({
                where: { id: workspaceId },
                data: { updatedAt: new Date() }
            });

            // Notify the user who requested to join
            await notify(
                {
                    userIds: [targetUserId],
                    type: NotificationType.workspace,
                    message: `Your request to join workspace "${req.workspace!.name}" has been accepted`
                },
                tx
            );
            // Notify other active members
            const otherMembers = await tx.workspaceMember.findMany({
                where: { workspaceId, userId: { notIn: [req.user!.id, targetUserId] }, role: { notIn: ['pending', 'requesting'] } },
                select: { userId: true }
            });

            if (otherMembers.length > 0)
            {
                await notify(
                    {
                        userIds: otherMembers.map(m => m.userId),
                        type: NotificationType.workspace,
                        message: `${updatedMember.user.username} has joined workspace "${req.workspace!.name}" by ${req.user!.username}`
                    },
                    tx
                );
            }

            return updatedMember;
        });

        res.json({ success: true, message: 'Join request accepted', data: result });
    }
    catch (err) { next(err); }
}

/* ─────────────────────────────────────────────────────────
   Decline join request (admin denies a request from a user)
───────────────────────────────────────────────────────── */
export async function declineJoinRequest(req: Request, res: Response, next: NextFunction)
{
    try {
        const workspaceId = req.workspace!.id;
        const targetUserId = parseOrThrow(idSchema, 'declineJoinRequest() targetUserId', req.params.userId);

        await prisma.$transaction(async (tx) => {
            const invitation = await tx.workspaceMember.findFirst({
                where: { workspaceId, userId: targetUserId, role: 'requesting' }
            });

            if (!invitation)
                throw new ApiError(404, 'No pending join request found for this user in this workspace');

            await tx.workspaceMember.delete({ where: { id: invitation.id } });

            // Notify the user who requested to join
            await notify(
                {
                    userIds: [targetUserId],
                    type: NotificationType.workspace,
                    message: `Your request to join workspace "${req.workspace!.name}" has been declined`
                },
                tx
            );
        });

        res.json({ success: true, message: 'Join request declined' });
    }
    catch (err) { next(err); }
}

