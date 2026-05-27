import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validations/auth';
import { ApiError } from '../utils/ApiError';

const	router = Router( );

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
router.post( '/signup',
	async ( req, res, next ) => {
		console.log("Entrou em /signup");
		const	result = registerSchema.safeParse(req.body);

		if (!result.success)
			return (next(new ApiError(400, result.error.issues.map( e => e.message ).join(', '))));

		const	{ username, email, password, avatarUrl } = result.data;

		try
		{
			const	existing = await prisma.user.findFirst({ where: { OR: [ { email }, { username: username } ] }});

			if (existing)
				throw new ApiError(409, "Email ou username já existe");

			const	passwordHash = await hashPassword( password );
			const	user = await prisma.user.create({
				data: { username: username, email, passwordHash, avatarUrl: avatarUrl || '' },
				select: { id: true, username: true, email: true, avatarUrl: true }
			});
			const	token = generateToken( user.id, user.email );

			console.log("REGISTOU COM SUCESSO!!!");
			res.status(201).json( { success: true, message: "Utilizador criado", token, user } );
		}
		catch ( err )
		{
			console.log("FALHOU AO TENTAR REGISTAR!!!");
			next( err );
		}
	}
);

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
router.post('/signin',
	async ( req, res, next ) => {
		console.log("Entrou em /signin");
		const	result = loginSchema.safeParse( req.body );

		if (!result.success)
			return (next( new ApiError( 400, result.error.issues.map( e => e.message ).join(', '))));

		const	{ email, password } = result.data;
	
		try
		{
			const	user = await prisma.user.findUnique( { where: { email } } );

			if (!user)
				throw new ApiError(401, "Credenciais Inválidas");

			const	valid = await comparePassword( password, user.passwordHash );

			if (!valid)
				throw new ApiError(401, "Credenciais Inválidas");

			await prisma.user.update( { where: { id: user.id }, data: { updatedAt: new Date() } } );

			const	token = generateToken( user.id, user.email );

			console.log("SIGNIN BEM-SUCEDIDO!!!");
			res.json( { success: true, message: "Signin bem-sucedido", token, user } ); 
		}
		catch ( err )
		{
			console.log("FALHOU AO TENTAR SIGNIN!!!");
			next( err );
		}
	}
);

export default	router;
