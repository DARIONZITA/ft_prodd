import 'dotenv/config';
import { env } from './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

export const	prisma = new PrismaClient( { datasources: { db: { url: env.DATABASE_URL }, } } );

const   app = express();

// Middlewares

//adiciona cabeçalhos HTTP de segurança.
app.use(helmet());

//define quais domínios podem acessar a API. Aqui, só o frontend local http://localhost:3000.
//credentials: true permite cookies/headers de autenticação.
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

//log detalhado de cada requisição HTTP..
app.use(morgan('combined'));

//parseia JSON no body da request, com limite de 10MB.
app.use(express.json({ limit: '10mb' }));

// Rotas
app.use('/api/auth', authRoutes);

// ← Middleware global de erro (deve ser o ÚLTIMO!)
app.use(errorHandler);

// Porta
const	PORT = env.PORT;

app.listen(PORT, () => { console.log(`🚀 Servidor rodando em http://localhost:${PORT}`); });
