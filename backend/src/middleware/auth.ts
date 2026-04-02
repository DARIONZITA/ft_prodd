import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../index';
import { ApiError } from '../utils/ApiError';

export const	authenticate = async ( req : Request, res : Response, next : NextFunction ) => {
	const	authHeader = req.headers.authorization;

	if (!authHeader?.startsWith( 'Bearer ' ))
		return (next(new ApiError(401, "Token Não fornecido")));
		//throw new ApiError(401, "Token Não fornecido");

	const	token = authHeader.split(' ')[1];

	try
	{
		const	payload = verifyToken( token ) as { id : number };
		const	user = await prisma.user.findUnique( { where: { id: payload.id } } );

		if (!user)
			throw new ApiError(401, 'Utilizador não encontrado');
		req.user = user;
		next();
	}
	catch ( err )
	{
		next( err );
	}
};
