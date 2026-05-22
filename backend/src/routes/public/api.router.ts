import { Router }           from 'express';
import { apiKeyAuth }       from '../../middleware/apiKey';
import { apiRateLimit, apiWriteRateLimit }     from '../../middleware/rateLimit';
import { createWorkspace, deleteWorkspace, getWorkspaceDetails, listUserWorkspaces, updateWorkspace } from '../../controllers/private/workspaces.controller';

const   publicAPIRouter = Router( );

publicAPIRouter.use( apiRateLimit );

publicAPIRouter.use( apiKeyAuth );

publicAPIRouter.get('/workspaces', listUserWorkspaces);

publicAPIRouter.get('/workspaces/:id', getWorkspaceDetails);

publicAPIRouter.post('/workspaces', apiWriteRateLimit, createWorkspace);

publicAPIRouter.put('/workspaces/:id', apiWriteRateLimit, updateWorkspace);

publicAPIRouter.delete('/workspaces/:id', deleteWorkspace);

export default  publicAPIRouter;