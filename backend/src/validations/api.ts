import { z } from 'zod';

export const    createWorkspaceSchema = z.object(
{
    name:           z.string().min(1, "Workspace name cannot be empty").max(100, "Workspace name too long, it can have up to 100 characters"),
    description:    z.string().min(1, "Workspace description cannot be empty").max(500, "Workspace description too long, it can have up to 500 characters"),
});

export const    updateWorkspaceSchema = z.object(
{
    name:           z.string().min(1, "Workspace name cannot be empty").max(100, "Workspace name too long, it can have up to 100 characters").optional(),
    description:    z.string().min(1, "Workspace description cannot be empty").max(500, "Workspace description too long, it can have up to 500 characters").optional(),
}).refine( data => Object.keys(data).length > 0, { message: "At least one field (name or description) must be provided" } );

export const    createTaskSchema = z.object(
{
    columnId:       z.number().int("Column ID must be an integer").positive("Column ID must be a positive integer"),
    title:          z.string().min(1, "Task title cannot be empty").max(200, "Task title too long, it can have up to 200 characters"),
    description:    z.string().min(1, "Task description cannot be empty").max(500, "Task description too long, it can have up to 500 characters"),
    orderInColumn:  z.number().int("Order in column must be an integer").nonnegative("Order in column must be a non-negative integer").default(0),
});

export const   updateTaskSchema = z.object(
{
    title:          z.string().min(1, "Task title cannot be empty").max(200, "Task title too long, it can have up to 200 characters").optional(),
    description:    z.string().min(1, "Task description cannot be empty").max(500, "Task description too long, it can have up to 500 characters").optional(),
    orderInColumn:  z.number().int("Order in column must be an integer").nonnegative("Order in column must be a non-negative integer").optional(),
    columnId:       z.number().int("Column ID must be an integer").positive("Column ID must be a positive integer").optional(),
}).refine( data => Object.keys(data).length > 0, { message: "At least one field (title, description, columnId or orderInColumn) must be provided" } );

export const    createApiKeySchema = z.object(
{
    name: z.string().min(1, "API key name cannot be empty").max(50, "API key name too long, it can have up to 50 characters"),
});

export const    requestParamsIdSchema = z.object(
{
    id: z.coerce.number().int("Id in request params must be an integer").nonnegative("Id in request params must be a non-negative integer"),
});
