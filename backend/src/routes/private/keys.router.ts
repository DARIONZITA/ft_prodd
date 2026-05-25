import { Router }                                   from 'express';
import { authenticate }                             from '../../middleware/auth';
import { createApiKey, deleteApiKey, listApiKeys }  from './keys.controller';

const   apiKeyRouter = Router( );

apiKeyRouter.use( authenticate );

apiKeyRouter.get('/', listApiKeys);

apiKeyRouter.post('/', createApiKey);

apiKeyRouter.delete('/:id', deleteApiKey);

export default  apiKeyRouter;