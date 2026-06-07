import type { Request, Response, NextFunction }         from 'express';
import crypto                                           from 'crypto';
import { Prisma }                                       from '@prisma/client';
import { prisma }                                       from '../../../lib/prisma';
import { ApiError }                                     from '../../../utils/ApiError';
import { hashApiKey }                                   from '../../../utils/encryption';
import { idSchema, parseOrThrow, parseQueryString }	from '../../../validations/utils';

const   MAX_API_KEYS_PER_USER = 3;

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
    try
    {
        const   name = parseQueryString('name', req.body.name, { isOptional: false, minLength: 1, maxLength: 50 })!;
        const   raw_key = `pk_${crypto.randomBytes(32).toString('hex')}`;
        const   keyHash = hashApiKey( raw_key );

        const   result = await prisma.$transaction( async (tx) => {

            const   updatedUser = await tx.user.updateMany(
            {
                where:
                {
                    id: req.user!.id,
                    apiKeyCount: { lt: MAX_API_KEYS_PER_USER }
                },
                data: { apiKeyCount: { increment: 1 } },
            });

            if (updatedUser.count === 0)
                throw new ApiError(429, "Maximum API keys per user reached");

            const   apiKey = await tx.apiKey.create(
            {
                data: { keyHash, name, userId: req.user!.id },
                select: { id: true, name: true, createdAt: true },
            });

            return (apiKey);
        });

        res.status(201).json(
        {
            success: true,
            message: "API Key created. Store it safely - it won't be shown again.",
            data:   { ...result, key: raw_key },
        });
    }
    catch ( err )
    {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
            return (next( new ApiError(409, 'API Key collision detected. Please try again.') ));
        next( err );
    }
}

export async function   deleteApiKey( req : Request, res : Response, next : NextFunction )
{
    try
    {
		const   id = parseOrThrow(idSchema, 'KeyID', req.params.id);

        await prisma.$transaction( async (tx) => {

            const   deletedKeys = await tx.apiKey.deleteMany( { where: { id, userId: req.user!.id } } );

            if (deletedKeys.count === 0)
                throw new ApiError(404, "No API key with the given id was found for this user.");

            await tx.user.update({
                where: { id: req.user!.id },
                data: { apiKeyCount: { decrement: 1 } }
            });
        });

        res.json({ success: true, message: "API Key revoked"});
    }
    catch ( err ) { next( err ); }
}