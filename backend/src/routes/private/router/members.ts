import { Router }                   from 'express';
import { requireWorkspaceAdmin }    from '../../../middleware/rbac';
import {
    listMembers,
    getMember,
    createMember,
    updateMemberRole,
    deleteMember,
    acceptInvitation,
    declineInvitation,
    listJoinRequests,
    acceptJoinRequest,
    declineJoinRequest,
} from '../controller/members';

const membersRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /workspaces/{workspaceId}/members:
 *   get:
 *     summary: List active workspace members (excludes pending)
 *     tags: [Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Member list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workspace not found
 */
membersRouter.get('/', listMembers);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/requests:
 *   get:
 *     summary: List pending join requests (admin only)
 *     tags: [Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of join requests
 *       403:
 *         description: Forbidden
 */
membersRouter.get('/requests', requireWorkspaceAdmin, listJoinRequests);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/requests/{userId}/accept:
 *   post:
 *     summary: Accept a join request (admin only)
 *     tags: [Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Request accepted
 *       404:
 *         description: Request not found
 */
membersRouter.post('/requests/:userId/accept', requireWorkspaceAdmin, acceptJoinRequest);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/requests/{userId}/decline:
 *   delete:
 *     summary: Decline a join request (admin only)
 *     tags: [Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Request declined
 *       404:
 *         description: Request not found
 */
membersRouter.delete('/requests/:userId/decline', requireWorkspaceAdmin, declineJoinRequest);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   get:
 *     summary: Get member details
 *     tags: [Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
membersRouter.get('/:userId', getMember);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   post:
 *     summary: Invite a user to the workspace (role=pending until accepted)
 *     tags: [Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
 *               role: { type: string, enum: [admin, member, guest], default: member }
 *     responses:
 *       201:
 *         description: Invitation sent
 *       400:
 *         description: User already member or invited
 *       403:
 *         description: Only admins can invite
 *       404:
 *         description: User not found
 */
membersRouter.post('/:userId', requireWorkspaceAdmin, createMember);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/invite/accept:
 *   post:
 *     summary: Accept a pending invitation (current user)
 *     tags: [Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Invitation accepted
 *       404:
 *         description: No pending invitation
 */
membersRouter.post('/invite/accept', acceptInvitation);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/invite/decline:
 *   delete:
 *     summary: Decline a pending invitation (current user)
 *     tags: [Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Invitation declined
 *       404:
 *         description: No pending invitation
 */
membersRouter.delete('/invite/decline', declineInvitation);


/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   put:
 *     summary: Update a member role
 *     tags: [Members]
 */
membersRouter.put('/:userId', requireWorkspaceAdmin, updateMemberRole);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   delete:
 *     summary: Remove a workspace member
 *     tags: [Members]
 */
membersRouter.delete('/:userId', requireWorkspaceAdmin, deleteMember);

export default membersRouter;