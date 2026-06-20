import express, { Request, Response } from 'express';
import cors								            from 'cors';
import cookieParser                  from 'cookie-parser';
import http								            from 'http';
import helmet							            from 'helmet';
import morgan							            from 'morgan';
import authRoutes						          from './routes/auth/auth.router';
import workspaceRoutes                from './routes/private/router/workspaces';
import userRoutes                     from './routes/private/router/users';
import friendRoutes                   from './routes/private/router/friends';
import notificationsRouter            from './routes/private/router/notifications';
import tasksRouter                    from './routes/private/router/tasks';
import { errorHandler }               from './middleware/errorHandler';
import { setupSwagger }               from './swagger';
import publicAPIRouter                from './routes/public/api.router';
import apiKeyRouter                   from './routes/private/router/keys';
import { setupSocketIO }              from './ws/backend/ws.server';
import { authenticate }               from './middleware/auth';

export const app = express();
export const	server = http.createServer( app );

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'https://localhost', credentials: true }));
app.use(cookieParser());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Setup Swagger
setupSwagger(app);

app.get('/api/health', (_req: Request, res: Response) => {
	res.status(200).json({ success: true, message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/users', authenticate, userRoutes);
app.use('/api/friends', authenticate, friendRoutes);
app.use('/api/notifications', authenticate, notificationsRouter);
app.use('/api/workspaces', authenticate, workspaceRoutes);
app.use('/api/columns', authenticate, tasksRouter);
app.use('/api/keys', authenticate, apiKeyRouter);
app.use('/api/public', publicAPIRouter);

app.use(errorHandler);

setupSocketIO( server );