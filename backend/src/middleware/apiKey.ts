import type { Request, Response, NextFunction } from 'express';
import { prisma }                               from '../lib/prisma';
import { hashApiKey }                           from '../utils/encryption';
import { ApiError }                             from '../utils/ApiError';

export async function   apiKeyAuth( req : Request, _res : Response, next : NextFunction )
{
    const   key = req.headers['x-api-key'];

    if (!key)
        return (next( new ApiError( 401, "Missing X-API-Key header" ) ));
    if (typeof key !== "string")
        return (next( new ApiError( 401, "X-API-Key header must be a string" ) ));
    if (key.trim() === "")
        return (next( new ApiError( 401, "X-API-Key header cannot be empty" ) ));

    const   apiKey = await prisma.apiKey.findUnique(
    {
        where: { keyHash: hashApiKey( key ) },
        include: { user: { select: { id: true, email: true, username : true } } },
    });

    if (!apiKey)
        return (next( new ApiError( 401, "Invalid API key" ) ));

    req.user = apiKey.user;
    next();
}
