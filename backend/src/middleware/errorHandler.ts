import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const	errorHandler = ( err : unknown, req : Request, res : Response, next : NextFunction ) => {
	if (err instanceof ApiError)
	{
		console.log(`ERRO ACONTECEU!!!: ${err.statusCode}`);
		return (res.status(err.statusCode).json( { success: false, message: err.message } ));
	}

	console.error( "ERRO Não Tratado: ", err );
	return (res.status(500).json( { success: false, message: "ft_prodd: Internal Server Error" } ));
};
