import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import badgeRoutes from './routes/badges';
import userRoutes from './routes/users';
import friendRoutes from './routes/friends';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './swagger';

export const app = express();

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
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/badges', badgeRoutes);

app.use(errorHandler);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use(errorHandler);
