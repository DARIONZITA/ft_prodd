import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../config/env'
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';
import { OauthCallbackSchema, IntraUserSchema, TokenResponseSchema } from '../validations/auth'
import { ApiError } from '../utils/ApiError';

const   router = Router();

const   stateStore = new Map<string, { codeVerifier : string, expiresAt : number }>( );

function    generatePKCE( )
{
    const   codeVerifier = crypto.randomBytes(64).toString('base64url');
    const   codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const   state = crypto.randomBytes(32).toString('hex');

    stateStore.set( state, { codeVerifier, expiresAt: Date.now() + 10 * 60 * 1000 } );

    return ( { state, codeChallenge } );
}

function    consumeState( state : string ) : string | null
{
    const   entry = stateStore.get( state );

    stateStore.delete( state );

    if (!entry || entry.expiresAt < Date.now( ))
        return (null);

    return (entry.codeVerifier);
}

router.get( '/login', (req, res) => {
    console.log("Iniciando login OAuth 42...");
    const   { state, codeChallenge } = generatePKCE( );

    const   params = new URLSearchParams(
    {
        client_id:              env.INTRA_42_CLIENT_ID,
        redirect_uri:           env.INTRA_42_CALLBACK_URL,
        response_type:          'code',
        scope:                  'public',
        state,
        code_challenge:         codeChallenge,
        code_challenge_method:  'S256',
    });
    res.redirect(`https://api.intra.42.fr/oauth/authorize?${params}`);
});

router.get( '/callback', async ( req, res, next ) => {
    console.log("Recebendo callback do OAuth 42...");
    const   result = OauthCallbackSchema.safeParse(req.query);

    if (!result.success)
        return (next( new ApiError(400, result.error.issues[0].message) ));

    const   { code, state, error } = result.data;

    if (error)
        return (next( new ApiError(400, 'Authorization denied by user') ));

    const   codeVerifier = consumeState( state );

    if (!codeVerifier)
        return (next( new ApiError(400, 'Invalid or expired state') ));

    try
    {
        const   tokenRes = await fetch( 'https://api.intra.42.fr/oauth/token',
        {
            method: 'POST',
            headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type:     'authorization_code',
                client_id:      env.INTRA_42_CLIENT_ID,
                client_secret:  env.INTRA_42_CLIENT_SECRET,
                code,
                redirect_uri:   env.INTRA_42_CALLBACK_URL,
                code_verifier:  codeVerifier,
            }),
        });

        if (!tokenRes.ok)
            return (next( new ApiError(401, 'Failed to exchange code for token') ));

        const   tokenResult = TokenResponseSchema.safeParse( await tokenRes.json( ) );

        if (!tokenResult.success)
            return (next( new ApiError(400, tokenResult.error.issues[0].message) ));

        const   { access_token } = tokenResult.data;
        const   meRes = await fetch('https://api.intra.42.fr/v2/me',
        {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!meRes.ok)
            return (next( new ApiError( 401, 'Failed to fetch user from 42' )));

        const   intraUserResult = IntraUserSchema.safeParse( await meRes.json() );

        if (!intraUserResult.success)
            return (next( new ApiError(400, intraUserResult.error.issues[0].message) ));

        const   intraUser = intraUserResult.data;
        const   intraID = intraUser.id;
        const   intraEmail = intraUser.email ?? '';
        const   intraNickname = intraUser.login;
        const   intraAvatar = intraUser.image?.link ?? '';

        let user = await prisma.user.findUnique(
        {
            where: { fortyTwoId: intraID },
            select: { id: true, nickname: true, email: true, avatarUrl: true },
        });

        if (!user)
        {
            const   emailExists = await prisma.user.findUnique(
            {
                where: { email: intraEmail },
                select: { id: true, nickname: true, email: true, avatarUrl: true, fortyTwoId: true },
            });

            if (emailExists)
            {
                if (emailExists.fortyTwoId)
                    return (next(new ApiError(409, "This 42 account is already linked to another user")));

                //Associar conta 42 à conta existente com mesmo email ou dar erro, ainda precisa decidir
                user = await prisma.user.update(
                {
                    where: { id: emailExists.id },
                    data: { fortyTwoId: intraID },
                    select: { id: true, nickname: true, email: true, avatarUrl: true },
                });
            }
            else
            {
                // Criar nova conta para usuário 42
               // if (await prisma.user.findFirst({ where: { intraNickname } }))
                //     nickname = `${intraNickname}_${intraID}`;

                user = await prisma.user.create(
                {
                    data: { nickname: intraNickname, email: intraEmail, avatarUrl: intraAvatar, fortyTwoId: intraID, passwordHash: '' },
                    select: { id: true, nickname: true, email: true, avatarUrl: true },
                });
            }
        }
        const   token = generateToken( user.id, user.email );
        const   redirect = new URL( `${env.FRONTEND_URL}/oauth/callback` );

        redirect.searchParams.set( 'token', token );

        console.log("OAUTH 42 BEM-SUCEDIDO!!!");
        res.redirect(redirect.toString());
    }
    catch ( err )
    {
        console.log("FALHOU NO OAUTH CALLBACK!!!", err);
        const   redirect = new URL( `${env.FRONTEND_URL}/oauth/callback` );

        redirect.searchParams.set( 'error', 'Oauth authentication failed' );
        res.redirect( redirect.toString() );
    }
});

export default router;