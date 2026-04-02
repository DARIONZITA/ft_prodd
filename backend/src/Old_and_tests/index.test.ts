import request from 'supertest';
// A importação correta para o cliente socket.io é 'io' como padrão, e 'Socket' como tipo
import Client from 'socket.io-client'; 
import { app, server, io} from './index';
import { PrismaClient } from '@prisma/client';
import { Socket } from 'socket.io';
import { describe } from 'node:test';

describe('Backend Server Tests', () => {
  // Alterado para usar o tipo correto do socket cliente
  let clientSocket: any;
  const prisma = new PrismaClient();

  beforeAll(() => {
    return new Promise((resolve) =>{
      server.listen(0, () =>{
        const addr = server.address();
        const port = (addr && typeof addr === 'object') ? addr.port : 3000;
        clientSocket = Client(`http://localhost:${port}`);
        clientSocket.on('connect', resolve);
      })
    })
  });

  afterAll(async () => {
    if (clientSocket) clientSocket.disconnect();
    server.close();
    await prisma.$disconnect();
  });

  describe('Prisma Client', () => {
    it('should be able to instantiate Prisma Client', () => {
      expect(prisma).toBeDefined();
      expect(prisma).toBeInstanceOf(PrismaClient);
    });
  });

  describe('HTTP Endpoints', () => {
    it('GET /health should return 200 and status OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
    });
  });

  describe('Socket.IO', () => {
    it('should allow a client to join a workspace', (done) => {
      const workspaceId = '123';
      const messageTest = 'Hello, workspace!';
      clientSocket.on("new-message", (msg: string) =>{
        expect(msg).toBe(messageTest);
        done();
      })
      clientSocket.emit('join-workspace', workspaceId);
      // Simulate server emitting a message to the workspace room
      setTimeout(() => {
        io.to(`workspace:${workspaceId}`).emit('new-message', messageTest);
      }, 100);
    });
  });
});