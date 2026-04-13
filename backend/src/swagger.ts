import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'FT Prodd API',
			version: '1.0.0',
			description: 'API Documentation para o Backend FT Prodd',
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
					description: 'JWT Token no header Authorization',
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
			},
		},
	},
	apis: ['./src/routes/*.ts', './src/swagger.ts'],
};

export const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
	app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { swaggerOptions: { persistAuthorization: true } }));
};
