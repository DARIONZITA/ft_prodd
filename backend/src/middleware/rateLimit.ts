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
    windowMs:           15000 * 60,
    max:                100,
    standardHeaders:    true, // Devolve headers `RateLimit-*`
    legacyHeaders:      false, // Desativa os headers `X-RateLimit-*`
    message: {
        success: false,
        message: "Too many Requests. Please try again in approximately 15 minutes.",
    },
    keyGenerator : ( req : Request ) => { return ( extractRequestId( req ) ); },
});

//Limite mais restrito para criações (POST)

export const    apiWriteRateLimit = ratelimit(
{
    windowMs:           60000, // 1 minuto = 60 mil milissegundos
    max:                20,
    standardHeaders:    true,
    legacyHeaders:      false,
    message: {
        success: false,
        message: "API write limit exceeded. Max 20 writes per minute.",
    },
    keyGenerator : ( req : Request ) => { return ( extractRequestId( req ) ); },
});