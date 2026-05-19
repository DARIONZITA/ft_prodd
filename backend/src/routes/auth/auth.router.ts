import { Router } from 'express';
import { oauthRouter } from './oauth/oauth.router';
import { signinController, signupController } from './auth.controller';

const	authRouter = Router( );

authRouter.post( '/signup', signinController );

authRouter.post('/signin', signupController );

authRouter.use( '/42', oauthRouter ); // Rota para OAuth 42

export default	authRouter;
