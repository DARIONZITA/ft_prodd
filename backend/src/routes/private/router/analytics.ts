import { Router }                   from 'express';
import { authenticate }             from '../../../middleware/auth';
import {
	getWorkspaceOverview,
	getWorkspaceTaskCompletionSeriesHandler,
	getWorkspaceTaskCreationSeriesHandler,
	getWorkspaceTaskPriorityDistributionHandler,
	getWorkspaceTaskStatusDistributionHandler,
	getWorkspaceTaskTrendHandler,
	getWorkspaceMemberWorkloadHandler
}     from '../controller/analytics';
import { requireWorkspaceAdmin }    from '../../../middleware/rbac';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /analytics/workspaces/{id}/overview:
 *   get:
 *     summary: Get workspace analytics overview
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Workspace analytics overview
 *       403:
 *         description: Only admins can access analytics for this workspace
 */
router.get('/workspaces/:id/overview', requireWorkspaceAdmin, getWorkspaceOverview);
/**
 * @swagger
 * /analytics/workspaces/{id}/trend:
 *   get:
 *     summary: Get workspace task trend time-series
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: interval
 *         schema: { type: string, enum: [day, week, month] }
 *     responses:
 *       200:
 *         description: Created and completed task trend series
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsTrendResponse'
 *       403:
 *         description: Only admins can access analytics for this workspace
 */
router.get('/workspaces/:id/trend', requireWorkspaceAdmin, getWorkspaceTaskTrendHandler);
/**
 * @swagger
 * /analytics/workspaces/{id}/series/creation:
 *   get:
 *     summary: Get task creation time-series for a workspace
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: interval
 *         schema: { type: string, enum: [day, week, month] }
 *     responses:
 *       200:
 *         description: Series of task creations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsSeriesResponse'
 *       403:
 *         description: Only admins can access analytics for this workspace
 */
router.get('/workspaces/:id/series/creation', requireWorkspaceAdmin, getWorkspaceTaskCreationSeriesHandler);
/**
 * @swagger
 * /analytics/workspaces/{id}/series/completion:
 *   get:
 *     summary: Get task completion time-series for a workspace
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: interval
 *         schema: { type: string, enum: [day, week, month] }
 *     responses:
 *       200:
 *         description: Series of task completions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsSeriesResponse'
 *       403:
 *         description: Only admins can access analytics for this workspace
 */
router.get('/workspaces/:id/series/completion', requireWorkspaceAdmin, getWorkspaceTaskCompletionSeriesHandler);
/**
 * @swagger
 * /analytics/workspaces/{id}/distributions/priority:
 *   get:
 *     summary: Get distribution of tasks by priority
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Priority distribution
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsDistributionResponse'
 *       403:
 *         description: Only admins can access analytics for this workspace
 */
router.get('/workspaces/:id/distributions/priority', requireWorkspaceAdmin, getWorkspaceTaskPriorityDistributionHandler);
/**
 * @swagger
 * /analytics/workspaces/{id}/distributions/status:
 *   get:
 *     summary: Get distribution of tasks by status
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Status distribution
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsDistributionResponse'
 *       403:
 *         description: Only admins can access analytics for this workspace
 */
router.get('/workspaces/:id/distributions/status', requireWorkspaceAdmin, getWorkspaceTaskStatusDistributionHandler);
/**
 * @swagger
 * /analytics/workspaces/{id}/workload:
 *   get:
 *     summary: Get workload per workspace member
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Member workload list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsWorkloadResponse'
 *       403:
 *         description: Only admins can access analytics for this workspace
 */
router.get('/workspaces/:id/workload', requireWorkspaceAdmin, getWorkspaceMemberWorkloadHandler);

export default router;
