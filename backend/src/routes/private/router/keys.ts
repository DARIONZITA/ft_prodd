import { Router }                                   from 'express';
import { authenticate }                             from '../../../middleware/auth';
import { createApiKey, deleteApiKey, listApiKeys }  from '../controller/keys';

const   apiKeyRouter = Router( );

apiKeyRouter.use( authenticate );

/**
 * @swagger
 * /keys:
 *   get:
 *     summary: List all API keys for the authenticated user
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ApiKey' }
 *       401:
 *         description: Unauthorized
 */

apiKeyRouter.get('/', listApiKeys);


/**
 * @swagger
 * /keys:
 *   post:
 *     summary: Create a new API key (MAX 3 per user)
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "My API Key" }
 *     responses:
 *       201:
 *         description: API key created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too Many Requests - Maximum API keys per user reached
 */

apiKeyRouter.post('/', createApiKey);


/** * @swagger
 * /keys/{id}:
 *   delete:
 *     summary: Delete an API key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: API key deleted
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: API key not found
 */
apiKeyRouter.delete('/:id', deleteApiKey);

export default  apiKeyRouter;