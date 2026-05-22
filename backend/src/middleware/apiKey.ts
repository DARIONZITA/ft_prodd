import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../lib/prisma';
import { hashApiKey }                           from '../utils/encryption';
import { ApiError }                             from '../utils/ApiError';

export async function   apiKeyAuth( req : Request, _res : Response, next : NextFunction )
{
    const   key = req.headers['x-api-key'];

    if (!key || typeof key !== "string")
        return (next( new ApiError( 401, "Missing or malformed X-API-Key header")));

    const   apiKey = await prisma.apiKey.findUnique(
    {
        where: { keyHash: hashApiKey( key ) },
        include: { user: { select: { id: true, email: true, nickname : true } } },
    });

    if (!apiKey)
        return (next( new ApiError( 401, "Invalid API key" ) ));

    req.user = apiKey.user;
    next();
}
