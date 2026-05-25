import ratelimit from 'express-rate-limit';
import type { Request } from 'express';

function    extractRequestId( req : Request ) : string
{
    const   apiKey = req.headers['x-api-key'];

    if (typeof apiKey === "string" && apiKey.length === 67) //Se algum dia mudarmos como criamos as API keys isso tem de se trocar
        return (apiKey);
    if (req.ip)
        return (req.ip);
    return ('unknown');
}

//Limite geral da API

export const    apiRateLimit = ratelimit(
{
    windowMs:           60000,
    max:                30,
    standardHeaders:    true, // Devolve headers `RateLimit-*`
    legacyHeaders:      false, // Desativa os headers `X-RateLimit-*`
    message: {
        success: false,
        message: "Too many Requests. Please try again in approximately 1 minute.",
    },
    keyGenerator : ( req : Request ) => { return ( extractRequestId( req ) ); },
});

//Limite mais restrito para criações (POST)

export const    apiWriteRateLimit = ratelimit(
{
    windowMs:           60000, // 1 minuto = 60 mil milissegundos
    max:                10, // Limite de 10 requisições por minuto para operações de escrita
    standardHeaders:    true,
    legacyHeaders:      false,
    message: {
        success: false,
        message: "API write limit exceeded. Max 10 writes per minute.",
    },
    keyGenerator : ( req : Request ) => { return ( extractRequestId( req ) ); },
});