import { Router } from 'express';
import { oauthLogin, oauthCallback } from './oauth.controller';

const   oauthRouter = Router();

oauthRouter.get( '/login', oauthLogin );
oauthRouter.get( '/callback', oauthCallback );

export { oauthRouter };
