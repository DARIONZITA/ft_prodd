import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../lib/prisma';
import { hashPassword, comparePassword }        from '../../utils/encryption';
import { generateToken }                        from '../../utils/jwt';
import { ApiError }                             from '../../utils/ApiError';
import { signupSchema, signinSchema }           from '../../validations/auth';
import { presenceStore }                        from '../../ws/store';
import { wsEmitter }                            from '../../ws/emitter';
import { getFriendIds,
        getWorkspaceMembershipIds }             from '../../ws/ws.server';

export async function   signupController( req : Request, res : Response, next : NextFunction )
{
	const   result = signupSchema.safeParse(req.body);

	if (!result.success)
		return (next(new ApiError( 400, result.error.issues[0].message )));

	const	{ username, email, password } = result.data;

	try
	{
		if (await prisma.user.findUnique({ where: { email } }))
			return (next(new ApiError(409, "Email already in use")));
		if (await prisma.user.findFirst({ where: { username }}))
			return (next(new ApiError(409, "Username already in use")));

		const	passwordHash = await hashPassword( password );
		const	user = await prisma.user.create({
			data: { username: username, email, passwordHash, avatarUrl: '' },
			select: { id: true, username: true, email: true, avatarUrl: true }
		});
		const	token = generateToken( user.id, user.email );

		res.status(201).json( { success: true, message: "User created", token, user } );
	}
	catch ( err ) { next( err ); }
}

export async function   signinController( req : Request, res : Response, next : NextFunction )
{
    const	result = signinSchema.safeParse( req.body );

    if (!result.success)
        return (next( new ApiError( 400, "Invalid credentials" )));

    const	{ identifier, password } = result.data;

    try
    {
        const	user = await prisma.user.findFirst(
        {
            where: { OR: [ { email: identifier }, { username: identifier } ] },
            select: { id: true, username: true, email: true, passwordHash: true, avatarUrl: true }
        });

        if (!user)
            return (next(new ApiError(401, "Invalid credentials")));
        if (!user.passwordHash)
            return (next(new ApiError(401, "This account is registered via OAuth, please sign in with the corresponding provider")));
        if (!(await comparePassword( password, user.passwordHash )))
            return (next(new ApiError(401, "Invalid credentials")));

        const	token = generateToken( user.id, user.email );
        const	{ passwordHash, ...userWithoutPassword } = user;

        if (presenceStore.connect( user.id )) //if it's the first login
            wsEmitter.userOnline( user.id, user.username, user.avatarUrl, await getWorkspaceMembershipIds( user.id ), await getFriendIds( user.id ) );

        res.status(200).json( { success: true, message: "Signin successfully", token, user: userWithoutPassword } );
    }
    catch ( err ) { next( err ); }
}

export async function   signoutController( req : Request, res : Response, next : NextFunction )
{
    try
    {
        const   userId = req.user!.id;

        if (presenceStore.disconnect( userId )) //if it's the last logout
        {
            const   user = await prisma.user.findUnique(
            {
                where: { id: userId },
                select: { username: true, avatarUrl: true }
            });

            if (user)
                wsEmitter.userOffline( userId, user.username, await getWorkspaceMembershipIds( userId ), await getFriendIds( userId ) );
        }
        console.log(`[Auth] User ${userId} logged out successfully`);

        res.status(200).json({ success: true, message: "user logged out successfully. Token removed in the client's side"});
    }
    catch ( err ) { next( err ); }
}