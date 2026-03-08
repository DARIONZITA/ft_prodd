import { PrismaClient } from '@prisma/client';

describe('Prisma Database Tests - Workspace', () => {
  const prisma = new PrismaClient({
    datasources: {
        db: { url: process.env.DATABASE_URL || "postgresql://transcendence:transcendence_password@localhost:5432/transcendence_db" } 
    }
    });

  // "Destrutor" para fechar a pool de conexões do Prisma
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Limpeza preventiva: garante que o banco está limpo antes de cada teste
  // Em C++, seria como resetar um singleton de cache.
  beforeEach(async () => {
    await prisma.workspace.deleteMany();
  });

  it('should create a new workspace and retrieve it', async () => {
    const workspaceData = {
      name: 'Transcendence Project',
      description: 'A project to master backend with NestJS and Prisma'
    };

    // 1. CREATE (Insert)
    const createdWorkspace = await prisma.workspace.create({
      data: workspaceData
    });

    expect(createdWorkspace.id).toBeDefined();
    expect(createdWorkspace.name).toBe(workspaceData.name);

    // 2. READ (Select)
    const foundWorkspace = await prisma.workspace.findUnique({
      where: { id: createdWorkspace.id }
    });

    expect(foundWorkspace?.description).toBe(workspaceData.description);
  });

  it('should update a workspace description', async () => {
    // Setup: Cria um registro para testar o update
    const workspace = await prisma.workspace.create({
      data: { name: 'Old Name', description: 'Old Description' }
    });

    // Action: Update
    const updated = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { name: 'New Name' }
    });

    expect(updated.name).toBe('New Name');
  });

  it('should delete a workspace', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'To be deleted', description: '...' }
    });

    await prisma.workspace.delete({
      where: { id: workspace.id }
    });

    const found = await prisma.workspace.findUnique({
      where: { id: workspace.id }
    });

    expect(found).toBeNull(); // O equivalente a checar um nullptr
  });
});