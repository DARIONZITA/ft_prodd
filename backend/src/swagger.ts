import swaggerUi	from 'swagger-ui-express';
import swaggerJsdoc	from 'swagger-jsdoc';
import { Express }	from 'express';

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'ft_prodd( ... ) API',
			version: '1.0.0',
			description: 'API documentation for the ft_prodd( ... ) backend',
		},
		tags: [
			{ name: 'Auth', description: 'Authentication endpoints' },
			{ name: 'Users', description: 'User profile management' },
			{ name: 'Workspaces', description: 'Manage workspaces and members' },
			{ name: 'Friends', description: 'Manage friend relationships' },
			{ name: 'Notifications', description: 'Manage notifications' },
			{ name: 'API Keys', description: 'Manage API keys for external access' },
			{ name: 'Public API', description: `Public API endpoints secured with API key authentication.\n
Read operations limited to 30 requests per minute (GET).\n
Write operations have a shorter limit of 10 requests per minute (POST, PUT, DELETE)`
			},
		],
		servers: [
			{
				url: 'http://localhost:3001/api',
				description: 'Development Server',
			},
		],
		components: {
			securitySchemes: {
				BearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'JWT token in the Authorization header',
				},
				ApiKeyAuth: {
					type: 'apiKey',
					in: 'header',
					name: 'X-API-Key',
					description: `
						Public API authentication using API keys.

						Example:
						X-API-Key: your_api_key_here
						`,
				},
			},
			schemas: {
				User: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						username: { type: 'string' },
						email: { type: 'string' },
						avatarUrl: { type: 'string' },
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' },
					},
				},
				ApiKey: {
					type: 'object',
					properties: {
						id: { type: 'integer' },
						name: { type: 'string' },
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' },
					},
				},
				Workspace: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						description: { type: 'string' },
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' },
					},
				},
				Notification: {
					type: 'object',
					properties: {
						id: { type: 'integer' },
						userId: { type: 'integer' },
						message: { type: 'string' },
						type: { type: 'string', enum: ['mention', 'taskAssignment', 'comment', 'invite'] },
						isRead: { type: 'boolean' },
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' },
					},
				},
				NotificationCreateRequest: {
					type: 'object',
					required: ['message', 'type'],
					properties: {
						userId: { type: 'integer' },
						message: { type: 'string' },
						type: { type: 'string', enum: ['mention', 'taskAssignment', 'comment', 'invite'] },
						isRead: { type: 'boolean' },
					},
					additionalProperties: false,
				},
				NotificationListResponse: {
					type: 'object',
					properties: {
						success: { type: 'boolean', example: true },
						data: {
							type: 'object',
							properties: {
								notifications: {
									type: 'array',
									items: { $ref: '#/components/schemas/Notification' },
								},
								pagination: { $ref: '#/components/schemas/Pagination' },
							},
						},
					},
				},
				NotificationResponse: {
					type: 'object',
					properties: {
						success: { type: 'boolean', example: true },
						data: { $ref: '#/components/schemas/Notification' },
					},
				},
				NotificationReadAllResponse: {
					type: 'object',
					properties: {
						success: { type: 'boolean', example: true },
						data: {
							type: 'object',
							properties: {
								updatedCount: { type: 'integer' },
							},
						},
					},
				},
				Pagination: {
					type: 'object',
					properties: {
							skip: {
							type: 'integer',
							example: 0,
						},
							take: {
							type: 'integer',
							example:  42,
						},
							total: {
							type: 'integer',
							example: 150,
						},
					},
				},
				UserListResponse: {
					type: 'object',
					properties: {
						success: {
						type: 'boolean',
						example: true,
					},
					data: {
						type: 'object',
						properties: {
							users: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/User',
								},
							},
							pagination: {
									$ref: '#/components/schemas/Pagination',
								},
							},
						},
					},
				},
				UpdateUserProfileRequest: {
					type: 'object',
					properties: {
						username: { type: 'string', minLength: 3, maxLength: 42 },
						bio: { type: 'string', maxLength: 142 },
						avatar: { type: 'string', format: 'binary', description: 'Avatar image file (image/*, max 5 MB)' },
					},
					additionalProperties: false,
				},
			FriendRequestItem: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				senderId: { type: 'integer' },
				receiverId: { type: 'integer' },
				status: { type: 'string', enum: ['pending', 'accepted'] },
				createdAt: { type: 'string', format: 'date-time' },
				updatedAt: { type: 'string', format: 'date-time' },
				sender: { $ref: '#/components/schemas/User' },
				receiver: { $ref: '#/components/schemas/User' },
			},
		},
		FriendListResponse: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: {
					type: 'object',
					properties: {
						friendRequests: {
							type: 'array',
							items: { $ref: '#/components/schemas/FriendRequestItem' },
						},
						total: { type: 'integer' },
					},
				},
			},
		},
		UserWorkspaceItem: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				name: { type: 'string' },
				description: { type: 'string' },
				createdAt: { type: 'string', format: 'date-time' },
				updatedAt: { type: 'string', format: 'date-time' },
				role: { type: 'string', enum: ['admin', 'member', 'guest'] },
				memberCount: { type: 'integer' },
			},
		},
		UserWorkspaceListResponse: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: {
					type: 'array',
					items: { $ref: '#/components/schemas/UserWorkspaceItem' },
				},
			},
		},
				ErrorResponse: {
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							example: false,
						},
						message: {
							type: 'string',
							example: 'Invalid query parameter',
						},
					},
				},
			},
		},
	},
	apis: ['./src/routes/**/*.ts'],
};

export const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
	app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { swaggerOptions: { persistAuthorization: true } }));
};
