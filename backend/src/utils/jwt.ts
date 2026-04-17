import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const	SECRET = env.JWT_SECRET;

export const	generateToken = ( user_id : number, user_email : string ) : string => {
	return (jwt.sign(
			{ id: user_id, email: user_email }, //payload do token - aqui podes adicionar mais campos se quiseres, mas cuidado com o tamanho do token!
			SECRET, //Chave secreta para assinar o token (deve ser longa e complexa, idealmente 256 bits ou mais)
			{ expiresIn: '1d' } // opcional: define a validade do token (ex: '1h' para 1 hora, '7d' para 7 dias) - importante para segurança!
		));
};

export const	verifyToken = ( token : string ) : any => { return (jwt.verify(token, SECRET)); };
