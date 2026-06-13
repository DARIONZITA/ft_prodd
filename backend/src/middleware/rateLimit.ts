import ratelimit from 'express-rate-limit';
import type { Request } from 'express';

//Limite geral da API

export const    readApiRateLimit = ratelimit(
{
    windowMs:           60000,
    max:                30,
    standardHeaders:    true, // Devolve headers `RateLimit-*`
    legacyHeaders:      false, // Desativa os headers `X-RateLimit-*`
    message: {
        success: false,
        message: "API read limit exceeded. Max 30 reads per minute.",
    },
    keyGenerator : ( req : Request ) => { return ( req.headers['x-api-key'] as string ); },
});

//Limite mais restrito para criações (POST)

export const    writeApiRateLimit = ratelimit(
{
    windowMs:           60000, // 1 minuto = 60 mil milissegundos
    max:                10, // Limite de 10 requisições por minuto para operações de escrita
    standardHeaders:    true,
    legacyHeaders:      false,
    message: {
        success: false,
        message: "API write limit exceeded. Max 10 writes per minute.",
    },
    keyGenerator : ( req : Request ) => { return ( req.headers['x-api-key'] as string ); },
});