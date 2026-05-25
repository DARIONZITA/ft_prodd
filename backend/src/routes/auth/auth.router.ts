import { Router }                               from 'express';
import { oauthRouter }                          from './oauth/oauth.router';
import { signinController, signupController }from './auth.controller';

const	authRouter = Router( );

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: "joao_silva" }
 *               email: { type: string, example: "joao@example.com" }
 *               password: { type: string, example: "password123" }
 *               avatarUrl: { type: string, example: "https://..." }
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email or username already exists
 */
authRouter.post( '/signup', signupController );

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Sign in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier: { type: string, example: "joao@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200:
 *         description: Sign-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/signin', signinController);

authRouter.use( '/42', oauthRouter ); // Rota para OAuth 42

export default	authRouter;
