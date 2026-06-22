import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../../lib/prisma';
import { hashPassword, comparePassword }        from '../../utils/encryption';
import { generateToken }                        from '../../utils/jwt';
import { ApiError }                             from '../../utils/ApiError';
import { signupSchema, signinSchema }           from '../../validations/auth';
import { presenceStore }                        from '../../ws/backend/store';
import { wsEmitter }                            from '../../ws/backend/emitter';
import { getFriendAndWorkspaceMembersIds }      from '../../ws/backend/ws.server';
import { avatarDir }                            from '../../types/constants';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 1 day (same as JWT expiry)
};

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
			data: { username, email, passwordHash, avatarUrl: `${avatarDir}default.svg` },
			select: { id: true, username: true, email: true, avatarUrl: true }
		});
		const	token = generateToken( user.id, user.email );

		res.cookie('token', token, COOKIE_OPTIONS);
		res.status(201).json( { success: true, message: "User created", user } );
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

        if (presenceStore.connect( user.id )) // if it's the first login
        {
            const   { workspaceIds, friendIds } = await getFriendAndWorkspaceMembersIds( user.id );
            wsEmitter.userOnline( user.id, user.username, user.avatarUrl, workspaceIds, friendIds );
        }

        res.cookie('token', token, COOKIE_OPTIONS);
        res.status(200).json( { success: true, message: "Signin successfully", user: userWithoutPassword } );
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
                select: { username: true }
            });

            if (user)
            {
                const   { workspaceIds, friendIds } = await getFriendAndWorkspaceMembersIds( userId );
                wsEmitter.userOffline( userId, user.username, workspaceIds, friendIds );
            }
        }
        res.clearCookie('token', { path: '/' });
        console.log(`[Auth] User ${userId} logged out successfully`);

        res.status(200).json({ success: true, message: "user logged out successfully"});
    }
    catch ( err ) { next( err ); }
}