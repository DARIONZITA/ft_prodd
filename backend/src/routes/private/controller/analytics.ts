import type { Request, Response, NextFunction }     from 'express';
import { idSchema, parseOrThrow, parseQueryDate, parseQueryEnum, parseQueryInt }   from '../../../validations/utils';
import { Priority }   from '../../../types/constants';
import {
	getWorkspaceAnalyticsOverview,
	getWorkspaceMemberWorkload,
	getWorkspaceTaskCompletionSeries,
	getWorkspaceTaskCreationSeries,
	getWorkspaceTaskPriorityDistribution,
	getWorkspaceTaskStatusDistribution,
	getWorkspaceTaskTrend
}            from '../../../services/analytics';

const DEFAULT_RANGE_DAYS = 30;

const daysAgo = (baseDate: Date, days: number) => {
	const date = new Date(baseDate);
	date.setDate(date.getDate() - days);
	return date;
};

const parseAnalyticsRange = (req: Request) => {
	const to = parseQueryDate('to', req.query.to, { default: new Date(), isOptional: true })!;
	const from = parseQueryDate('from', req.query.from, { default: daysAgo(to, DEFAULT_RANGE_DAYS), isOptional: true })!;

	return { from, to };
};

const parseAnalyticsInterval = (req: Request) => {
	return parseQueryEnum('interval', req.query.interval, ['hour', 'day', 'week', 'month'] as const, {
		default: 'day',
		isOptional: true
	});
};

const parseAnalyticsFilters = (req: Request) => {
	return {
		priority: parseQueryEnum('priority', req.query.priority, Priority, { isOptional: true }),
		status: parseQueryEnum('status', req.query.status, ['open', 'done', 'completed'] as const, { isOptional: true }),
		memberId: parseQueryInt('memberId', req.query.memberId, { isOptional: true, min: 1 }),
	};
};

export async function getWorkspaceOverview(req: Request, res: Response, next: NextFunction) {
	try {
		const id = parseOrThrow(idSchema, 'workspaceId', req.params.id);
		const { from, to } = parseAnalyticsRange(req);
		const filters = parseAnalyticsFilters(req);
		const overview = await getWorkspaceAnalyticsOverview(id, { from, to }, filters);

		res.json({
			success: true,
			data: overview
		});
	} catch (err) {
		next(err);
	}
}

export async function getWorkspaceTaskTrendHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const id = parseOrThrow(idSchema, 'workspaceId', req.params.id);
		const { from, to } = parseAnalyticsRange(req);
		const interval = parseAnalyticsInterval(req) ?? 'day';
		const filters = parseAnalyticsFilters(req);
		const trend = await getWorkspaceTaskTrend(id, { from, to }, interval, filters);

		res.json({ success: true, data: trend });
	} catch (err) {
		next(err);
	}
}

export async function getWorkspaceTaskCreationSeriesHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const id = parseOrThrow(idSchema, 'workspaceId', req.params.id);
		const { from, to } = parseAnalyticsRange(req);
		const interval = parseAnalyticsInterval(req) ?? 'day';
		const filters = parseAnalyticsFilters(req);
		const series = await getWorkspaceTaskCreationSeries(id, { from, to }, interval, filters);

		res.json({ success: true, data: series });
	} catch (err) {
		next(err);
	}
}

export async function getWorkspaceTaskCompletionSeriesHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const id = parseOrThrow(idSchema, 'workspaceId', req.params.id);
		const { from, to } = parseAnalyticsRange(req);
		const interval = parseAnalyticsInterval(req) ?? 'day';
		const filters = parseAnalyticsFilters(req);
		const series = await getWorkspaceTaskCompletionSeries(id, { from, to }, interval, filters);

		res.json({ success: true, data: series });
	} catch (err) {
		next(err);
	}
}

export async function getWorkspaceTaskPriorityDistributionHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const id = parseOrThrow(idSchema, 'workspaceId', req.params.id);
		const { from, to } = parseAnalyticsRange(req);
		const filters = parseAnalyticsFilters(req);
		const distribution = await getWorkspaceTaskPriorityDistribution(id, { from, to }, filters);

		res.json({ success: true, data: distribution });
	} catch (err) {
		next(err);
	}
}

export async function getWorkspaceTaskStatusDistributionHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const id = parseOrThrow(idSchema, 'workspaceId', req.params.id);
		const { from, to } = parseAnalyticsRange(req);
		const filters = parseAnalyticsFilters(req);
		const distribution = await getWorkspaceTaskStatusDistribution(id, { from, to }, filters);

		res.json({ success: true, data: distribution });
	} catch (err) {
		next(err);
	}
}

export async function getWorkspaceMemberWorkloadHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const id = parseOrThrow(idSchema, 'workspaceId', req.params.id);
		const { from, to } = parseAnalyticsRange(req);
		const filters = parseAnalyticsFilters(req);
		const workload = await getWorkspaceMemberWorkload(id, { from, to }, filters);

		res.json({ success: true, data: workload });
	} catch (err) {
		next(err);
	}
}
