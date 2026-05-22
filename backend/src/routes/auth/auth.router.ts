import { Router }                               from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../lib/prisma';
import { hashPassword, comparePassword }        from '../../utils/encryption';
import { generateToken }                        from '../../utils/jwt';
import { ApiError }                             from '../../utils/ApiError';
import { signupSchema, signinSchema }           from '../../validations/auth';
import { oauthRouter }                          from './oauth/oauth.router';

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
authRouter.post( '/signup', async ( req : Request, res : Response, next : NextFunction ) => {
	console.log("Entrou em /signup");
	const   result = signupSchema.safeParse(req.body);

	if (!result.success)
		return (next(new ApiError( 400, result.error.issues[0].message )));

	const	{ username, email, password, avatarUrl } = result.data;

	try
	{
		if (await prisma.user.findUnique({ where: { email } }))
			return (next(new ApiError(409, "Email already in use")));
		if (await prisma.user.findFirst({ where: { nickname: username }}))
			return (next(new ApiError(409, "Username already in use")));

		const	passwordHash = await hashPassword( password );
		const	user = await prisma.user.create({
			data: { nickname: username, email, passwordHash, avatarUrl: avatarUrl || '', updatedAt: new Date() },
			select: { id: true, nickname: true, email: true, avatarUrl: true }
		});
		const	token = generateToken( user.id, user.email );

		console.log("REGISTOU COM SUCESSO!!!");
		res.status(201).json( { success: true, message: "User created", token, user } );
	}
	catch ( err )
	{
		console.log("FALHOU AO TENTAR REGISTAR!!!");
		next( err );
	}
} );

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
 *               email: { type: string, example: "joao@example.com" }
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
authRouter.post('/signin', async ( req : Request, res : Response, next : NextFunction ) => {
    console.log("Entrou em /signin");
    const	result = signinSchema.safeParse( req.body );

    if (!result.success)
        return (next( new ApiError( 400, result.error.issues[0].message )));

    const	{ identifier, password } = result.data;

    try
    {
        const	user = await prisma.user.findFirst(
        {
            where: { OR: [ { email: identifier }, { nickname: identifier } ] },
            select: { id: true, nickname: true, email: true, passwordHash: true, avatarUrl: true, fortyTwoId: true }
        });

        if (!user)
            return (next(new ApiError(401, "Invalid Credentials")));
        if (!user.passwordHash)
            return (next(new ApiError(401, "This account is registered via OAuth, please sign in with the corresponding provider")));
        if (!(await comparePassword( password, user.passwordHash )))
            return (next(new ApiError(401, "Invalid Credentials")));

        const	token = generateToken( user.id, user.email );
        const	{ passwordHash, ...userWithoutPassword } = user;

        console.log("SIGNIN BEM-SUCEDIDO!!!");
        res.status(200).json( { success: true, message: "Signin successfully", token, userWithoutPassword } ); 
    }
    catch ( err )
    {
        console.log("FALHOU AO TENTAR SIGNIN!!!");
        next( err );
    }
});

authRouter.use( '/42', oauthRouter ); // Rota para OAuth 42

export default	authRouter;
