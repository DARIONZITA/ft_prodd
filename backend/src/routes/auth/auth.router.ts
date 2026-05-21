import { Router }                               from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../index';
import { hashPassword, comparePassword }        from '../../utils/password';
import { generateToken }                        from '../../utils/jwt';
import { ApiError }                             from '../../utils/ApiError';
import { signupSchema, signinSchema }           from '../../validations/auth';
import { oauthRouter }                          from './oauth/oauth.router';

const	authRouter = Router( );

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
