import type { Request, Response, NextFunction }     from 'express';
import { pkceStore }                                from '../../../middleware/pkce.store';
import { handleOauthCallback }                      from './oauth.service';
import { OauthCallbackSchema }                      from '../../../validations/auth';
import { env }                                      from '../../../config/env';
import { presenceStore }                            from '../../../ws/backend/store';
import { wsEmitter }                                from '../../../ws/backend/emitter';
import { getFriendAndWorkspaceMembersIds }          from '../../../ws/backend/ws.server';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
};

export async function   oauthLoginController( req : Request, res : Response )
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

export async function   oauthCallbackController( req : Request, res : Response, next : NextFunction )
{
    const   result = OauthCallbackSchema.safeParse(req.query);

    if (!result.success)
        return (res.redirect(`${env.FRONTEND_URL}/oauth/callback?error=Invalid%20callback%20parameters:%20${encodeURIComponent(result.error.issues[0].message)}`));

    const   data = result.data;

    if ('error' in data)
    {
        const   message = data.error_description ? `${data.error_description}` : `OAuth Error: ${data.error}`;

        return (res.redirect(`${env.FRONTEND_URL}/oauth/callback?error=${encodeURIComponent(message)}`));
    }

    const   codeVerifier = pkceStore.consume( data.state );

    if (!codeVerifier)
        return (res.redirect(`${env.FRONTEND_URL}/oauth/callback?error=Invalid%20or%20expired%20state%20parameter`));

    const   callbackResult = await handleOauthCallback( data.code, codeVerifier );

    if (!callbackResult.user || !callbackResult.success || !callbackResult.token)
        return (res.redirect(`${env.FRONTEND_URL}/oauth/callback?error=${encodeURIComponent(callbackResult.message)}`));

    const   token = callbackResult.token;
    const   user = callbackResult.user;

    res.cookie('token', token, COOKIE_OPTIONS);

    console.log("OAuth callback successful, redirecting to frontend...");

    if (presenceStore.connect( user.id )) //if it's the first login
    {
        const   { workspaceIds, friendIds } = await getFriendAndWorkspaceMembersIds( user.id );
        wsEmitter.userOnline( user.id, user.username, user.avatarUrl, workspaceIds, friendIds );
    }
    res.redirect( `${env.FRONTEND_URL}/oauth/callback` );
}