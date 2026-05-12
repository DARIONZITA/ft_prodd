import type { Request, Response, NextFunction } from 'express';
import { pkceStore } from '../../middleware/pkce.store';
import { handleOauthCallback } from './oauth.service';
import { OauthCallbackSchema } from '../../validations/auth';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';

/**
 * GET /auth/oauth/login
 * 
 * Inicia o fluxo OAuth. Gera state + PKCE e redireciona para o 42 Intra.
 * O utilizador autentica-se lá, e o 42 redireciona de volta para o callback.
 */
export async function   oauthLogin( req : Request, res : Response ) : Promise<void>
{
    const   { state, codeChallenge } = pkceStore.generate( );
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
}

/**
 * GET /auth/oauth/callback
 * 
 * O 42 Intra redireciona aqui depois do utilizador autorizar.
 * O URL vai conter: ?code=XXX&state=YYY
 * 
 * Se o utilizador recusou: ?error=access_denied
 */
export async function   oauthCallback( req : Request, res : Response, next : NextFunction ) : Promise<void>
{
    const   result = OauthCallbackSchema.safeParse(req.query);

    if (!result.success)
        return (next( new ApiError(400, result.error.issues[0].message) ));

    const   { code, state, error } = result.data;

    if (error)
        return (next( new ApiError(400, `Authorization denied by user or OAuth error: ${error}`) ));

    const   codeVerifier = pkceStore.consume( state );

    if (!codeVerifier)
        return (next( new ApiError(400, 'Invalid or expired state parameter') ));

    const   callbackResult = await handleOauthCallback( code, codeVerifier );

    if (!callbackResult.success || !callbackResult.token)
        return (next( new ApiError( callbackResult.httpCode, callbackResult.message ) ));

    const   token = callbackResult.token; // assured by the service's return type
    const   redirectUrl = new URL( `${env.FRONTEND_URL}/oauth/callback` );

    redirectUrl.searchParams.set( 'token', token );
    console.log("OAuth callback successful, redirecting to frontend with token...");
    res.redirect( redirectUrl.toString( ) );
}