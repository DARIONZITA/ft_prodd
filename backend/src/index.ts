import 'dotenv/config';
import { env }      from './config/env';
import { server }   from './app';

// Porta
const	PORT = env.PORT;

server.listen(PORT, () => { console.log(`🚀 Server running on http://0.0.0.0:${PORT}`); });
