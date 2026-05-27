import type { Request, Response, NextFunction }         from 'express';
import crypto                                           from 'crypto';
import { prisma }                                       from '../../../lib/prisma';
import { ApiError }                                     from '../../../utils/ApiError';
import { createApiKeySchema, requestParamsIdSchema }    from '../../../validations/api';
import { hashApiKey }                                   from '../../../utils/encryption';

export async function   listApiKeys( req : Request, res : Response, next : NextFunction )
{
    try
    {
        const   keys = await prisma.apiKey.findMany(
        {
            where:  { userId: req.user!.id },
            select: { id: true, name: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' } ,
        });
        res.status(200).json({ success: true, data: keys });
    }
    catch ( err ) { next( err ); }
}

export async function   createApiKey( req : Request, res : Response, next : NextFunction )
{
    const   result = createApiKeySchema.safeParse( req.body );

    if (!result.success)
        return (next( new ApiError( 400, result.error.issues[0].message )));

    try
    {
        const   raw_key = `pk_${crypto.randomBytes(32).toString('hex')}`;
        const   keyHash = hashApiKey( raw_key );

        const   apiKey = await prisma.apiKey.create(
        {
            data: { keyHash, name: result.data.name, userId: req.user!.id },
            select: { id: true, name: true, createdAt: true },
        });

        res.status(201).json(
        {
            success: true,
            message: "API Key created. Store it safely - it won't be shown again.",
            data:   { ...apiKey, key: raw_key },
        });
    }
    catch ( err ) { next( err ); }
}

export async function   deleteApiKey( req : Request, res : Response, next : NextFunction )
{
    const   params_result = requestParamsIdSchema.safeParse( req.params );

    if (!params_result.success)
        return (next( new ApiError(400, `Invalid Key ID: ${params_result.error.issues[0].message}` )));

    try
    {
        const   id = params_result.data.id;
        const   apiKey = await prisma.apiKey.findFirst( { where: { id } } );

        if (!apiKey)
            return (next( new ApiError(404, "API Key not found") ));
        if (apiKey.userId !== req.user!.id)
            return (next( new ApiError(403, "Forbidden")));

        await prisma.apiKey.delete( { where: { id } } );
        res.json({ success: true, message: "API Key revoked"});
    }
    catch ( err ) { next( err ); }
}