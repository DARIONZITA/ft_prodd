import express from 'express';
import request from 'supertest';
import workspaceRoutes from './workspaces';
import { errorHandler } from '../middleware/errorHandler';

const prismaMock = {
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
};

jest.mock('../middleware/auth', () => ({
	authenticate: (req: any, _res: any, next: any) => {
		const userId = Number(req.header('x-user-id') || 1);
		req.user = { id: userId };
		next();
	}
}));

jest.mock('../lib/prisma', () => ({
	prisma: prismaMock
}));

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
				delete: prismaMock.workspaceMember.delete
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
});
