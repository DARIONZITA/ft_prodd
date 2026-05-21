import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { env } from './config/env';

// Load environment variables
dotenv.config();

// add helper to avoid logging during tests
const log = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'test') console.log(...args);
}

const app: Application = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ===========================
// MIDDLEWARES
// ===========================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ===========================
// ROUTES
// ===========================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes (to be implemented)
app.use('/api/auth', (req, res) => res.json({ message: 'Auth routes coming soon' }));
app.use('/api/workspaces', (req, res) => res.json({ message: 'Workspace routes coming soon' }));
app.use('/api/tasks', (req, res) => res.json({ message: 'Task routes coming soon' }));
app.use('/api/users', (req, res) => res.json({ message: 'User routes coming soon' }));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ===========================
// SOCKET.IO
// ===========================

io.on('connection', (socket) => {
  log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    log(`Client disconnected: ${socket.id}`);
  });

  // Socket events to be implemented
  socket.on('join-workspace', (workspaceId: string) => {
    socket.join(`workspace:${workspaceId}`);
    log(`Socket ${socket.id} joined workspace ${workspaceId}`);
  });

  socket.on('leave-workspace', (workspaceId: string) => {
    socket.leave(`workspace:${workspaceId}`);
  });
});

// ===========================
// SERVER START
// ===========================

const PORT = env.PORT;

if (require.main === module) {
  server.listen(PORT, () => {
    log(`
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║   🚀 ft_transcendence Backend Server                  ║
  ║                                                        ║
  ║   Environment: ${process.env.NODE_ENV?.padEnd(36) || 'development'.padEnd(36)}║
  ║   Port:        ${PORT.toString().padEnd(36)}║
  ║   Database:    PostgreSQL                              ║
  ║   Cache:       Redis                                   ║
  ║   WebSocket:   Socket.IO                               ║
  ║                                                        ║
  ║   Health:      http://0.0.0.0:${PORT}/health${' '.repeat(16)}║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
    `);
  });
}

export { app, server, io };
