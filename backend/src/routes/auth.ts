import { Router } from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { signupSchema, signinSchema } from '../validations/auth';
import { ApiError } from '../utils/ApiError';

const	router = Router( );

router.post( '/signup',
	async ( req, res, next ) => {
		console.log("Entrou em /signup");
		const	result = signupSchema.safeParse(req.body);

		if (!result.success)
			return (next(new ApiError( 400, result.error.issues[0].message )));

		const	{ username, email, password, avatarUrl } = result.data;

		try
		{
			const	existing = await prisma.user.findFirst({ where: { OR: [ { email }, { nickname: username } ] }});

			if (existing)
				return (next(new ApiError(409, "Email ou username já existe")));

			const	passwordHash = await hashPassword( password );
			const	user = await prisma.user.create({
				data: { nickname: username, email, passwordHash, avatarUrl: avatarUrl || '', updatedAt: new Date() },
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

router.post('/signin',
	async ( req, res, next: any ) => {
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
				select: { id: true, nickname: true, email: true, passwordHash: true, avatarUrl: true }
			});

			if (!user)
				return (next(new ApiError(401, "Credenciais Inválidas")));

			const	{ passwordHash, ...userWithoutPassword } = user;

			if (!(await comparePassword( password, passwordHash )))
				return (next(new ApiError(401, "Credenciais Inválidas")));

			const	token = generateToken( user.id, user.email );

			console.log("SIGNIN BEM-SUCEDIDO!!!");
			res.status(200).json( { success: true, message: "Signin bem-sucedido", token, userWithoutPassword } ); 
		}
		catch ( err )
		{
			console.log("FALHOU AO TENTAR SIGNIN!!!");
			next( err );
		}
	}
);

export default	router;
