import { Request, Response, NextFunction } from 'express';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

export const	authenticate = async ( req : Request, res : Response, next : NextFunction ) => {
	const	authHeader = req.headers.authorization;
	const	cookieToken = req.cookies?.token;
	let	token: string | undefined;

	if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
		token = authHeader.split(' ')[1];
	else if (cookieToken && typeof cookieToken === 'string')
		token = cookieToken;

	if (!token)
		return (next(new ApiError(401, "Missing or invalid token")));

	try
	{
		const	payload = verifyToken( token ) as { id : number };
		const	user = await prisma.user.findUnique( { where: { id: payload.id } } );

		if (!user)
			return (next(new ApiError(401, 'User not found')));
		req.user = user;
		next( );
	}
	catch ( err )
	{
		if (err instanceof TokenExpiredError)
			return (next(new ApiError(401, "Token expired")));
		if (err instanceof JsonWebTokenError)
			return (next(new ApiError(401, "Invalid token")));
		next( err );
	}
};
