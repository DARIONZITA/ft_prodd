import { Router }                                           from 'express';
import { oauthCallbackController, oauthLoginController }    from './oauth.controller';

const   oauthRouter = Router();

/**
 * GET /auth/oauth/login
 * 
 * Inicia o fluxo OAuth. Gera state + PKCE e redireciona para o 42 Intra.
 * O utilizador autentica-se lá, e o 42 redireciona de volta para o callback.
 */

oauthRouter.get( '/login', oauthLoginController);

/**
 * GET /auth/oauth/callback
 * 
 * O 42 Intra redireciona aqui depois do utilizador autorizar.
 * O URL vai conter: ?code=XXX&state=YYY
 * 
 * Se o utilizador recusou: ?error=access_denied
 */

oauthRouter.get( '/callback', oauthCallbackController );

export { oauthRouter };
