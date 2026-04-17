import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../index';
import { ApiError } from '../utils/ApiError';

export const	authenticate = async ( req : Request, res : Response, next : NextFunction ) : Promise<boolean> => {
	const	authHeader = req.headers.authorization;

	if (!authHeader?.startsWith( 'Bearer ' ))
	{
		next(new ApiError(401, "Token Not Provided"));
		return (false);
	}
	const	token = authHeader.split(' ')[1];

	try
	{
		const	payload = verifyToken( token ) as { id : number };
		const	user = await prisma.user.findUnique( { where: { id: payload.id } } );

		if (!user)
			throw new ApiError(401, 'User not found');
		req.user = user;
		return (true);
	}
	catch ( err )
	{
		next( err );
	}
	return (false);
};
