import 'dotenv/config';
import { env } from './config/env';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

export const	prisma = new PrismaClient( { datasources: { db: { url: env.DATABASE_URL }, } } );

const   app = express();

//adiciona cabeçalhos HTTP de segurança na resposta.
app.use(helmet());

//define quais domínios podem acessar a API. Aqui, só o frontend local http://localhost:3000.
//credentials: true permite cookies/headers de autenticação.
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

//log detalhado de cada requisição HTTP..
app.use(morgan('combined'));

//parseia JSON no body da request, com limite de 10MB.
app.use(express.json());

// Rotas
app.get('/api/health', (_req: Request, res: Response) => {
	res.status(200).json({ success: true, message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);

// ← Middleware global de erro (deve ser o ÚLTIMO!)
app.use(errorHandler);

// Porta
const	PORT = env.PORT;

app.listen(PORT, () => { console.log(`🚀 Server running on http://localhost:${PORT}`); });
