import 'dotenv/config';
import { env } from './config/env';
import { app } from './app';

// Porta
const	PORT = env.PORT;

app.listen(PORT, () => { console.log(`🚀 Servidor rodando em http://localhost:${PORT}`); });
