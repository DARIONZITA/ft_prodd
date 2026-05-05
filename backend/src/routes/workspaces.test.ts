import express from 'express';
import request from 'supertest';
import workspaceRoutes from './workspaces';
import { errorHandler } from '../middleware/errorHandler';

jest.mock('../middleware/auth', () => ({
	authenticate: (req: any, _res: any, next: any) => {
		const userId = Number(req.header('x-user-id') || 1);
		req.user = { id: userId };
		next();
	}
}));

jest.mock('../lib/prisma', () => ({
	prisma: {
		workspaceMember: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn()
		},
		workspace: {
			findUnique: jest.fn(),
			update: jest.fn()
		},
		activityLog: {
			create: jest.fn()
		},
		$transaction: jest.fn()
	}
}));

const prismaMock = (jest.requireMock('../lib/prisma') as { prisma: any }).prisma;

const app = express();
app.use(express.json());
app.use('/api/workspaces', workspaceRoutes);
app.use(errorHandler);

describe('Workspace routes - Advanced Permissions System', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		prismaMock.$transaction.mockImplementation(async (callback: any) => callback({
			workspaceMember: {
				update: prismaMock.workspaceMember.update,
				delete: prismaMock.workspaceMember.delete,
				count: prismaMock.workspaceMember.count
			},
			workspace: {
				update: prismaMock.workspace.update
			},
			activityLog: {
				create: prismaMock.activityLog.create
			}
		}));
	});

	it('GET /api/workspaces returns workspaces where user is a member', async () => {
		prismaMock.workspaceMember.findMany.mockResolvedValue([
			{
				role: 'admin',
				workspace: {
					id: 1,
					name: 'Main Workspace',
					description: 'Main',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			}
		]);

		const response = await request(app).get('/api/workspaces').set('x-user-id', '5');

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveLength(1);
		expect(response.body.data[0].role).toBe('admin');
	});

	it('GET /api/workspaces/:id returns 400 for invalid id', async () => {
		const response = await request(app).get('/api/workspaces/abc').set('x-user-id', '5');

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
	});

	it('GET /api/workspaces/:id/members/:userId blocks guest from seeing other users', async () => {
		prismaMock.workspaceMember.findFirst
			.mockResolvedValueOnce({ id: 1, workspaceId: 10, userId: 5, role: 'guest' });

		const response = await request(app)
			.get('/api/workspaces/10/members/7')
			.set('x-user-id', '5');

		expect(response.status).toBe(403);
		expect(response.body.message).toContain('Guests');
	});

	it('PUT /api/workspaces/:id/members/:userId blocks non-admin role changes', async () => {
		prismaMock.workspaceMember.findFirst
			.mockResolvedValueOnce({ id: 1, workspaceId: 10, userId: 5, role: 'member' });

		const response = await request(app)
			.put('/api/workspaces/10/members/7')
			.set('x-user-id', '5')
			.send({ role: 'guest' });

		expect(response.status).toBe(403);
		expect(response.body.message).toContain('Apenas admins');
	});

	it('PUT /api/workspaces/:id/members/:userId updates role with transaction when admin', async () => {
		prismaMock.workspaceMember.findFirst
			.mockResolvedValueOnce({ id: 1, workspaceId: 10, userId: 5, role: 'admin' })
			.mockResolvedValueOnce({ id: 2, workspaceId: 10, userId: 7, role: 'member' });

		prismaMock.workspaceMember.update.mockResolvedValue({
			id: 2,
			workspaceId: 10,
			userId: 7,
			role: 'guest',
			user: {
				id: 7,
				nickname: 'user7',
				email: 'user7@email.com',
				avatarUrl: ''
			}
		});
		prismaMock.workspace.update.mockResolvedValue({});
		prismaMock.activityLog.create.mockResolvedValue({});

		const response = await request(app)
			.put('/api/workspaces/10/members/7')
			.set('x-user-id', '5')
			.send({ role: 'guest' });

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.role).toBe('guest');
		expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
	});

	it('DELETE /api/workspaces/:id/members/:userId prevents removing last admin', async () => {
		prismaMock.workspaceMember.findFirst
			.mockResolvedValueOnce({ id: 1, workspaceId: 10, userId: 5, role: 'admin' })
			.mockResolvedValueOnce({ id: 2, workspaceId: 10, userId: 7, role: 'admin' });
		prismaMock.workspaceMember.count.mockResolvedValue(1);

		const response = await request(app)
			.delete('/api/workspaces/10/members/7')
			.set('x-user-id', '5');

		expect(response.status).toBe(400);
		expect(response.body.message).toContain('ultimo admin');
	});

	// NEW ENDPOINTS TESTS
	describe('POST /api/workspaces - Create Workspace', () => {
		it('should create new workspace with creator as admin', async () => {
			const newWorkspace = {
				id: 5,
				name: 'New Workspace',
				description: 'A new test workspace',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			prismaMock.$transaction.mockImplementationOnce(async (callback: any) => {
				const result = await callback({
					workspace: { create: jest.fn().mockResolvedValue(newWorkspace) },
					workspaceMember: { create: jest.fn() },
					activityLog: { create: jest.fn() }
				});
				return newWorkspace;
			});

			const response = await request(app)
				.post('/api/workspaces')
				.set('x-user-id', '1')
				.send({
					name: 'New Workspace',
					description: 'A new test workspace'
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Workspace created successfully');
			expect(response.body.data.name).toBe('New Workspace');
			expect(prismaMock.$transaction).toHaveBeenCalled();
		});

		it('should fail if name is not provided', async () => {
			const response = await request(app)
				.post('/api/workspaces')
				.set('x-user-id', '1')
				.send({
					description: 'A workspace without name'
				});

			expect(response.status).toBe(400);
		});

		it('should fail if name exceeds max length', async () => {
			const response = await request(app)
				.post('/api/workspaces')
				.set('x-user-id', '1')
				.send({
					name: 'a'.repeat(256)
				});

			expect(response.status).toBe(400);
		});
	});

	describe('PUT /api/workspaces/:id - Update Workspace', () => {
		it('should update workspace when user is admin', async () => {
			const updatedWorkspace = {
				id: 1,
				name: 'Updated Workspace',
				description: 'Updated description',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({
				id: 1,
				workspaceId: 1,
				userId: 5,
				role: 'admin'
			});

			prismaMock.$transaction.mockImplementationOnce(async (callback: any) => {
				return await callback({
					workspace: { update: jest.fn().mockResolvedValue(updatedWorkspace) },
					activityLog: { create: jest.fn() }
				});
			});

			const response = await request(app)
				.put('/api/workspaces/1')
				.set('x-user-id', '5')
				.send({
					name: 'Updated Workspace',
					description: 'Updated description'
				});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Workspace updated successfully');
		});

		it('should fail if user is not admin', async () => {
			prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({
				id: 1,
				workspaceId: 1,
				userId: 5,
				role: 'member'
			});

			const response = await request(app)
				.put('/api/workspaces/1')
				.set('x-user-id', '5')
				.send({
					name: 'Updated Workspace'
				});

			expect(response.status).toBe(403);
			expect(response.body.message).toContain('Only admins');
		});

		it('should fail if no fields provided', async () => {
			prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({
				id: 1,
				workspaceId: 1,
				userId: 5,
				role: 'admin'
			});

			const response = await request(app)
				.put('/api/workspaces/1')
				.set('x-user-id', '5')
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.message).toContain('At least one field');
		});
	});

	describe('DELETE /api/workspaces/:id - Delete Workspace', () => {
		it('should delete workspace when user is admin', async () => {
			prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({
				id: 1,
				workspaceId: 1,
				userId: 5,
				role: 'admin'
			});

			prismaMock.workspace.findUnique.mockResolvedValueOnce({
				id: 1,
				name: 'Workspace to Delete',
				description: 'Will be deleted'
			});

			prismaMock.$transaction.mockResolvedValueOnce(null);

			const response = await request(app)
				.delete('/api/workspaces/1')
				.set('x-user-id', '5');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Workspace deleted successfully');
			expect(prismaMock.$transaction).toHaveBeenCalled();
		});

		it('should fail if user is not admin', async () => {
			prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({
				id: 1,
				workspaceId: 1,
				userId: 5,
				role: 'member'
			});

			const response = await request(app)
				.delete('/api/workspaces/1')
				.set('x-user-id', '5');

			expect(response.status).toBe(403);
		});

		it('should fail if workspace not found', async () => {
			prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({
				id: 1,
				workspaceId: 1,
				userId: 5,
				role: 'admin'
			});

			prismaMock.workspace.findUnique.mockResolvedValueOnce(null);

			const response = await request(app)
				.delete('/api/workspaces/1')
				.set('x-user-id', '5');

			expect(response.status).toBe(404);
			expect(response.body.message).toContain('not found');
		});
	});

	describe('POST /api/workspaces/:id/members - Add Member', () => {
		it('should add member when user is admin', async () => {
			prismaMock.workspaceMember.findFirst
				.mockResolvedValueOnce({ role: 'admin' }) // Check requester is admin
				.mockResolvedValueOnce(null); // Check user not already member

			prismaMock.user.findUnique = jest.fn().mockResolvedValueOnce({
				id: 7,
				nickname: 'newuser',
				email: 'new@example.com'
			});

			prismaMock.$transaction.mockImplementationOnce(async (callback: any) => {
				return await callback({
					workspaceMember: {
						create: jest.fn().mockResolvedValue({
							id: 2,
							workspaceId: 1,
							userId: 7,
							role: 'member',
							user: { id: 7, nickname: 'newuser', email: 'new@example.com' }
						})
					},
					workspace: { update: jest.fn() },
					activityLog: { create: jest.fn() }
				});
			});

			const response = await request(app)
				.post('/api/workspaces/1/members')
				.set('x-user-id', '5')
				.send({
					userId: 7,
					role: 'member'
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Member added successfully');
			expect(prismaMock.$transaction).toHaveBeenCalled();
		});

		it('should fail if user already is member', async () => {
			prismaMock.workspaceMember.findFirst
				.mockResolvedValueOnce({ role: 'admin' })
				.mockResolvedValueOnce({ id: 2, userId: 7, role: 'member' });

			const response = await request(app)
				.post('/api/workspaces/1/members')
				.set('x-user-id', '5')
				.send({
					userId: 7,
					role: 'member'
				});

			expect(response.status).toBe(400);
			expect(response.body.message).toContain('already a member');
		});

		it('should fail if target user does not exist', async () => {
			prismaMock.workspaceMember.findFirst
				.mockResolvedValueOnce({ role: 'admin' })
				.mockResolvedValueOnce(null);

			prismaMock.user = { findUnique: jest.fn().mockResolvedValueOnce(null) };

			const response = await request(app)
				.post('/api/workspaces/1/members')
				.set('x-user-id', '5')
				.send({
					userId: 999,
					role: 'member'
				});

			expect(response.status).toBe(404);
			expect(response.body.message).toContain('User not found');
		});

		it('should fail if requester is not admin', async () => {
			prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({
				role: 'member'
			});

			const response = await request(app)
				.post('/api/workspaces/1/members')
				.set('x-user-id', '5')
				.send({
					userId: 7,
					role: 'member'
				});

			expect(response.status).toBe(403);
		});

		it('should use default role if not provided', async () => {
			prismaMock.workspaceMember.findFirst
				.mockResolvedValueOnce({ role: 'admin' })
				.mockResolvedValueOnce(null);

			prismaMock.user.findUnique = jest.fn().mockResolvedValueOnce({
				id: 7,
				nickname: 'newuser',
				email: 'new@example.com'
			});

			prismaMock.$transaction.mockImplementationOnce(async (callback: any) => {
				return await callback({
					workspaceMember: {
						create: jest.fn().mockResolvedValue({
							id: 2,
							workspaceId: 1,
							userId: 7,
							role: 'member'
						})
					},
					workspace: { update: jest.fn() },
					activityLog: { create: jest.fn() }
				});
			});

			const response = await request(app)
				.post('/api/workspaces/1/members')
				.set('x-user-id', '5')
				.send({
					userId: 7
				});

			expect(response.status).toBe(201);
			expect(response.body.data.role).toBe('member');
		});
	});

	describe('Transaction Safety', () => {
		it('should ensure workspace creation is atomic', async () => {
			const transactionCallback = jest.fn();
			prismaMock.$transaction.mockImplementationOnce(transactionCallback);

			await request(app)
				.post('/api/workspaces')
				.set('x-user-id', '1')
				.send({
					name: 'Test Workspace'
				});

			expect(transactionCallback).toHaveBeenCalled();
		});

		it('should ensure member addition is atomic', async () => {
			prismaMock.workspaceMember.findFirst
				.mockResolvedValueOnce({ role: 'admin' })
				.mockResolvedValueOnce(null);

			prismaMock.user = { findUnique: jest.fn().mockResolvedValueOnce({ id: 7 }) };

			const transactionCallback = jest.fn();
			prismaMock.$transaction.mockImplementationOnce(transactionCallback);

			await request(app)
				.post('/api/workspaces/1/members')
				.set('x-user-id', '5')
				.send({
					userId: 7,
					role: 'member'
				});

			expect(transactionCallback).toHaveBeenCalled();
		});

		it('should ensure workspace deletion is atomic', async () => {
			prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({
				role: 'admin'
			});

			prismaMock.workspace.findUnique.mockResolvedValueOnce({
				id: 1,
				name: 'Test'
			});

			const transactionCallback = jest.fn();
			prismaMock.$transaction.mockImplementationOnce(transactionCallback);

			await request(app)
				.delete('/api/workspaces/1')
				.set('x-user-id', '5');

			expect(transactionCallback).toHaveBeenCalled();
		});
	});
});
