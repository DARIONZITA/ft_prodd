import { Router }                               from 'express';
import { apiKeyAuth }                           from '../../middleware/apiKey';
import { apiRateLimit, apiWriteRateLimit }      from '../../middleware/rateLimit';
import { createWorkspace, deleteWorkspace,
    getWorkspaceDetails, listUserWorkspaces,
    updateWorkspace }                           from '../private/workspaces.controller';

const   publicAPIRouter = Router( );

publicAPIRouter.use( apiRateLimit );

publicAPIRouter.use( apiKeyAuth );

/**
 * @swagger
 * /public/workspaces:
 *   get:
 *      summary: List public workspaces, accessible and protected through Public API Key. Rate limited to 30 requests per minute.
 *      tags: [Public API]
 *      security:
 *          - ApiKeyAuth: []
 *      responses:
 *         200:
 *           description: Workspace list
 *           content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          success: { type: boolean }
 *                          data:
 *                              type: array
 *                              items: { $ref: '#/components/schemas/Workspace' }
 *         401:
 *           description: Unauthorized - Invalid or missing API key
 *         429:
 *           description: Too many requests - Rate limit exceeded
*/

publicAPIRouter.get('/workspaces', listUserWorkspaces);


/**
 * @swagger
 * /public/workspaces/{id}:
 *   get:
 *      summary: Get a public workspace details, accessible and protected through Public API Key. Rate limited to 30 requests per minute.
 *      tags: [Public API]
 *      security:
 *          - ApiKeyAuth: []
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema: { type: integer }
 *      responses:
 *          200:
 *              description: Workspace details with members and activity logs
 *          404:
 *              description: Workspace not found
 *          403:
 *              description: Forbidden
 *          401:
 *              description: Unauthorized - Invalid or missing API key
 *          429:
 *              description: Too many requests - Rate limit exceeded
*/

publicAPIRouter.get('/workspaces/:id', getWorkspaceDetails);


/**
 * @swagger
 * /public/workspaces:
 *   post:
 *     summary: Create a new workspace through Public API Key. Rate limited to 10 writes per minute, besides the general rate limit of 30 requests per minute.
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, maxLength: 1000 }
 *     responses:
 *       201:
 *         description: Workspace created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *       429:
 *         description: Too many requests - Rate limit exceeded
 */

publicAPIRouter.post('/workspaces', apiWriteRateLimit, createWorkspace);


/**
 * @swagger
 * /public/workspaces/{id}:
 *   put:
 *     summary: Update workspace details through Public API Key. Rate limited to 10 writes per minute, besides the general rate limit of 30 requests per minute.
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 255 }
 *               description: { type: string, maxLength: 1000 }
 *     responses:
 *       200:
 *         description: Workspace updated
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Workspace not found
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *       429:
 *         description: Too many requests - Rate limit exceeded
 */

publicAPIRouter.put('/workspaces/:id', apiWriteRateLimit, updateWorkspace);


/**
 * @swagger
 * /public/workspaces/{id}:
 *   delete:
 *     summary: Delete a workspace through Public API Key. Rate limited to 10 writes per minute, besides the general rate limit of 30 requests per minute.
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Workspace deleted
 *       403:
 *         description: Only admins can perform this action
 *       404:
 *         description: Workspace not found
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *       429:
 *         description: Too many requests - Rate limit exceeded
 */

publicAPIRouter.delete('/workspaces/:id', apiWriteRateLimit, deleteWorkspace);

export default  publicAPIRouter;