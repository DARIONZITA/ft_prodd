import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

export const	authenticate = async ( req : Request, res : Response, next : NextFunction ) => {
	const	authHeader = req.headers.authorization;

	if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith( 'Bearer ' ))
		return (next(new ApiError(401, "Invalid token format")));

	const	token = authHeader.split(' ')[1];

	try
	{
		const	payload = verifyToken( token ) as { id : number };
		const	user = await prisma.user.findUnique( { where: { id: payload.id } } );

		if (!user)
			return (next(new ApiError(401, 'User not found')));
		req.user = user;
		next();
	}
	catch ( err )
	{
		next( err );
	}
};
