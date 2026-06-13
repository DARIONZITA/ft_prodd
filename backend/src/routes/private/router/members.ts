import { Router }                   from 'express';
import { requireWorkspaceAdmin }    from '../../../middleware/rbac';
import {
    listMembers,
    getMember,
    createMember,
    updateMemberRole,
    deleteMember
} from '../controller/members';

const membersRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /workspaces/{workspaceId}/members:
 *   get:
 *     summary: List workspace members
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
 *     summary: Add member to workspace
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
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, member, guest], default: member }
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
membersRouter.post('/:userId', requireWorkspaceAdmin, createMember);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   put:
 *     summary: Update a member role
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
 *       - in: query
 *         name: role
 *         required: true
 *         schema: { type: string, enum: [admin, member, guest] }
 *     responses:
 *       200:
 *         description: Member updated
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Member not found
 */
membersRouter.put('/:userId', requireWorkspaceAdmin, updateMemberRole);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   delete:
 *     summary: Remove a workspace member
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
 *         description: Member removed
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Member not found
 */
membersRouter.delete('/:userId', requireWorkspaceAdmin, deleteMember);

export default membersRouter;