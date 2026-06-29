import ratelimit from 'express-rate-limit';
import type { Request, Response } from 'express';

//Limite geral da API

const   createRateLimit = ( max : number, windowMs : number, message : string ) =>
{
    return (ratelimit(
    {
        windowMs,
        max,
        standardHeaders:    true, // Devolve headers `RateLimit-*`
        legacyHeaders:      false, // Desativa os headers `X-RateLimit-*`
        keyGenerator : ( req : Request ) => { return ( req.headers['x-api-key'] as string ); },
        handler : ( req : Request, res : Response ) =>
        {
            res.status( 429 ).json(
            {
                success: false,
                message: message || "API rate limit exceeded. Please try again later.",
                limit: max,
                windowMinutes: windowMs / 60000,
            });
        },
        skipFailedRequests: false, // Conta requisições com falha (4xx e 5xx)
        skipSuccessfulRequests: false, // Conta requisições bem-sucedidas (2xx)
    }));
}

export const    readApiRateLimit = createRateLimit( 30, 60000, "API read limit exceeded. Max 30 reads per minute." );
export const    writeApiRateLimit = createRateLimit( 10, 60000, "API write limit exceeded. Max 10 writes per minute." );
