import express, { Request, Response }	from 'express';
import cors								from 'cors';
import http								from 'http';
import helmet							from 'helmet';
import morgan							from 'morgan';
import authRoutes						from './routes/auth/auth.router';
import workspaceRoutes					from './routes/private/router/workspaces';
import badgeRoutes						from './routes/private/router/badges';
import userRoutes						from './routes/private/router/users';
import friendRoutes						from './routes/private/router/friends';
import notificationsRouter				from './routes/private/router/notifications';
import analyticsRouter					from './routes/private/router/analytics';
import columnsRouter					from './routes/private/router/columns';
import tasksRouter						from './routes/private/router/tasks';
import commentsRouter					from './routes/private/router/comments';
import { errorHandler }					from './middleware/errorHandler';
import { setupSwagger }					from './swagger';
import publicAPIRouter					from './routes/public/api.router';
import apiKeyRouter						from './routes/private/router/keys';
import { setupSocketIO }				from './ws/ws.server';

const			app = express();
export const	server = http.createServer( app );

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Setup Swagger
setupSwagger(app);

app.get('/api/health', (_req: Request, res: Response) => {
	res.status(200).json({ success: true, message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicAPIRouter);
app.use('/api/keys', apiKeyRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/columns', columnsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/comments', commentsRouter);

app.use(errorHandler);

setupSocketIO( server );
