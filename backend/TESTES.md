# Testes (Jest + TypeScript)

Este documento explica como os testes do backend funcionam e como rodá-los localmente.

**O que usamos**
- Jest como runner de testes.
- `ts-jest` para executar TypeScript no Jest.
- `supertest` para testar rotas HTTP.
- `socket.io-client` para testar eventos WebSocket (Socket.IO).
- `@prisma/client` (no exemplo) e `jest-mock-extended` para mocks do Prisma.

**Requisitos**
- Node.js + npm
- Dependências instaladas: execute `npm install` no diretório `backend`

Como instalar dependências de teste (se necessário):

```bash
npm install --save-dev ts-jest @types/jest jest-mock-extended supertest @types/supertest socket.io-client @types/socket.io-client
```

Como rodar os testes

```bash
# Executa todos os testes
npm test

# Modo watch (bom para desenvolvimento)
npm run test:watch

# Executa um único arquivo de teste (exemplo)
npx jest src/index.test.ts

# Rodar um único teste com nome parcial
npx jest -t "nome do teste"
```

Padrões de arquivos
- O Jest procura por `*.test.ts`, `*.spec.ts` e pastas `__tests__/**` (configurado no `package.json`).

Boas práticas no projeto
- Use `NODE_ENV=test` durante a execução dos testes. O projeto já contém um helper `log(...)` que suprime logs quando `NODE_ENV === 'test'`.
- Abra o servidor numa porta dinâmica (ex.: `server.listen(0)`) nos testes para evitar conflitos; recupere a porta com `server.address()`.
- Sempre fechar recursos em `afterAll`: desconectar `PrismaClient` (`await prisma.$disconnect()`), desconectar sockets clientes (`client.disconnect()`), e fechar o servidor (`server.close()`).

Exemplos rápidos

- Teste HTTP com `supertest`

```ts
import request from 'supertest';
import { app } from './index';

it('GET /health retorna 200', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('status', 'OK');
});
```

- Teste Socket.IO com `socket.io-client`

```ts
import Client from 'socket.io-client';
let client: any;

beforeAll((done) => {
  // supondo server.listen(0) no teste
  const port = /* porta obtida de server.address() */;
  client = Client(`http://localhost:${port}`);
  client.on('connect', () => done());
});

afterAll(() => {
  if (client) client.disconnect();
});

it('conecta e envia join-workspace', (done) => {
  client.emit('join-workspace', '123');
  setTimeout(() => {
    expect(client.connected).toBe(true);
    done();
  }, 50);
});
```

- Uso do `PrismaClient` nos testes

Você pode instanciar o `PrismaClient` para testes que realmente falam com o banco, porém isso exige um banco de teste disponível (Docker, CI). Em unit tests prefira mockar:

```ts
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const prismaMock = mockDeep<PrismaClient>();
// injete prismaMock nos serviços que usam o Prisma
```

Dicas de depuração
- Se o Jest reclamar de logs após os testes (`Cannot log after tests are done`), verifique se o servidor/sockets foram fechados ou se o projeto suprime logs quando `NODE_ENV === 'test'`.
- Use `--runInBand` para rodar testes sequencialmente e facilitar debugging:

```bash
npx jest --runInBand
```

- `--detectOpenHandles` ajuda a localizar recursos não fechados:

```bash
npx jest --detectOpenHandles
```

Onde olhar no repositório
- Teste de exemplo: [src/index.test.ts](src/index.test.ts)
- Arquivo de inicialização do app/servidor: [src/index.ts](src/index.ts)
- Configurações de teste: [package.json](package.json)

Se quiser, posso:
- Adicionar exemplos de mocks para serviços que usam Prisma.
- Incluir um guide rápido para rodar testes com um banco Postgres de teste via Docker Compose.
