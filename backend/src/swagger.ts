import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'FT Prodd API',
			version: '1.0.0',
			description: 'API documentation for the FT Prodd backend',
		},
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
						nickname: { type: 'string' },
						email: { type: 'string' },
						avatarUrl: { type: 'string' },
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
				Badge: {
					type: 'object',
					properties: {
						id: { type: 'integer' },
						name: { type: 'string' },
						description: { type: 'string' },
						iconUrl: { type: 'string', format: 'uri' },
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' },
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
						nickname: { type: 'string', minLength: 3, maxLength: 42 },
						bio: { type: 'string', maxLength: 142 },
					},
					additionalProperties: false,
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
	apis: ['./src/routes/**/**/*.ts', './src/swagger.ts'],
};

export const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
	app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { swaggerOptions: { persistAuthorization: true } }));
};
