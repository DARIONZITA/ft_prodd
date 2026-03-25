import { Router } from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validations/auth';
import { ApiError } from '../utils/ApiError';

const	router = Router( );

router.post( '/register',
	async ( req, res, next ) => {
		console.log("Entrou em /register");
		const	result = registerSchema.safeParse(req.body);

		if (!result.success)
			return (next(new ApiError(400, result.error.issues.map( e => e.message ).join(', '))));

		const	{ nickname, email, password, avatarUrl } = result.data;

		try
		{
			const	existing = await prisma.user.findFirst({ where: { OR: [ { email }, { nickname } ] }});

			if (existing)
				throw new ApiError(409, "Email ou nickname já existe");

			const	passwordHash = await hashPassword( password );
			const	user = await prisma.user.create({
				data: { nickname, email, passwordHash, avatarUrl: avatarUrl || '' },
				select: { id: true, nickname: true, email: true, avatarUrl: true }
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

router.post('/login',
	async ( req, res, next ) => {
		console.log("Entrou em /login");
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

			console.log("LOGIN BEM-SUCEDIDO!!!");
			res.json( { success: true, message: "Login bem-sucedido", token, user } ); 
		}
		catch ( err )
		{
			console.log("FALHOU AO TENTAR LOGIN!!!");
			next( err );
		}
	}
);

export default	router;
