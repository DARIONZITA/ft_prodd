import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
	AnalyticsFilters,
	AnalyticsDateRange,
	AnalyticsDistributionPoint,
	AnalyticsInterval,
	AnalyticsMemberWorkload,
	AnalyticsOverview,
	AnalyticsSeriesPoint,
} from '../types/analytics';

type TimeBucketRow = {
	bucket: Date;
	value: bigint | number;
};

type CountRow = {
	label: string | null;
	value: bigint | number;
};

type CompletionCycleRow = {
	completedTasks: bigint | number;
	averageCycleTimeHours: number | null;
};

type MemberWorkloadRow = {
	userId: number;
	username: string;
	avatarUrl: string;
	assignedTasks: bigint | number;
	completedTasks: bigint | number;
	openTasks: bigint | number;
	completionRate: number | null;
};

const taskStatusClause = (status: AnalyticsFilters['status']) => {
	switch (status) {
		case 'open':
			return Prisma.sql`t."isDone" = false AND t."dateCompleted" IS NULL`;
		case 'done':
			return Prisma.sql`t."isDone" = true AND t."dateCompleted" IS NULL`;
		case 'completed':
			return Prisma.sql`t."dateCompleted" IS NOT NULL`;
		default:
			return Prisma.empty;
	}
};

const buildTaskFilterClause = (filters: AnalyticsFilters = {}) => {
	const clauses: Prisma.Sql[] = [];

	if (filters.priority)
		clauses.push(Prisma.sql`t.priority = ${filters.priority}`);

	if (filters.status)
		clauses.push(taskStatusClause(filters.status));

	if (filters.memberId)
		clauses.push(Prisma.sql`EXISTS (
			SELECT 1
			FROM "TaskAssignment" ta_filter
			WHERE ta_filter."taskId" = t.id
			  AND ta_filter."userId" = ${filters.memberId}
		)`);

	return clauses.length > 0 ? Prisma.sql` AND ${Prisma.join(clauses, ' AND ')}` : Prisma.empty;
};

const intervalToSql = (interval: AnalyticsInterval) => {
	// Map the API interval to a Postgres interval literal used by generate_series().
	switch (interval) {
		case 'hour':
			return Prisma.sql`interval '1 hour'`;
		case 'week':
			return Prisma.sql`interval '1 week'`;
		case 'month':
			return Prisma.sql`interval '1 month'`;
		case 'day':
		default:
			return Prisma.sql`interval '1 day'`;
	}
};

const timeTruncExpression = (columnReference: string, interval: AnalyticsInterval) => {
	// Keep the grouping bucket aligned with the requested interval.
	return Prisma.sql`date_trunc(${Prisma.raw(`'${interval}'`)}, ${Prisma.raw(columnReference)})`;
};

const toNumber = (value: bigint | number): number => Number(value);

const resolveTimeSeries = (
	rows: TimeBucketRow[]
): AnalyticsSeriesPoint[] => rows.map((row) => ({ bucket: row.bucket.toISOString(), value: toNumber(row.value) }));

export async function getWorkspaceAnalyticsOverview(
	workspaceId: number,
	range: AnalyticsDateRange,
	filters: AnalyticsFilters = {}
): Promise<AnalyticsOverview> {
	const [totals, cycleRow, activeMembersRow, commentsRow, activityRow] = await prisma.$transaction([
		prisma.$queryRaw<CountRow[]>`
			SELECT
				'__totals__'::text AS label,
				COUNT(DISTINCT t.id) AS value
			FROM "Task" t
			INNER JOIN "Column" c ON c.id = t."columnId"
			WHERE c."workspaceId" = ${workspaceId}
			  AND t."createdAt" >= ${range.from}
			  AND t."createdAt" <= ${range.to}
			  ${buildTaskFilterClause(filters)}
		`,
		prisma.$queryRaw<CompletionCycleRow[]>`
			SELECT
				COUNT(*) FILTER (WHERE t."dateCompleted" IS NOT NULL) AS "completedTasks",
				AVG(EXTRACT(EPOCH FROM (t."dateCompleted" - t."createdAt")) / 3600.0)
					FILTER (WHERE t."dateCompleted" IS NOT NULL) AS "averageCycleTimeHours"
			FROM "Task" t
			INNER JOIN "Column" c ON c.id = t."columnId"
			WHERE c."workspaceId" = ${workspaceId}
			  AND t."createdAt" >= ${range.from}
			  AND t."createdAt" <= ${range.to}
			  ${buildTaskFilterClause(filters)}
		`,
		prisma.$queryRaw<CountRow[]>`
			SELECT COUNT(DISTINCT wm."userId") AS value
			FROM "WorkspaceMember" wm
			INNER JOIN "TaskAssignment" ta ON ta."userId" = wm."userId"
			INNER JOIN "Task" t ON t.id = ta."taskId"
			INNER JOIN "Column" c ON c.id = t."columnId"
			WHERE wm."workspaceId" = ${workspaceId}
			  AND c."workspaceId" = ${workspaceId}
			  AND t."createdAt" >= ${range.from}
			  AND t."createdAt" <= ${range.to}
			  ${buildTaskFilterClause(filters)}
		`,
		prisma.$queryRaw<CountRow[]>`
			SELECT COUNT(*) AS value
			FROM "Comment" cm
			INNER JOIN "Task" t ON t.id = cm."taskId"
			INNER JOIN "Column" c ON c.id = t."columnId"
			WHERE c."workspaceId" = ${workspaceId}
			  AND cm."createdAt" >= ${range.from}
			  AND cm."createdAt" <= ${range.to}
			  ${buildTaskFilterClause(filters)}
		`,
		prisma.$queryRaw<CountRow[]>`
			SELECT COUNT(*) AS value
			FROM "ActivityLog" al
			WHERE al."workspaceId" = ${workspaceId}
			  AND al."createdAt" >= ${range.from}
			  AND al."createdAt" <= ${range.to}
			  ${filters.memberId ? Prisma.sql`AND al."userId" = ${filters.memberId}` : Prisma.empty}
		`
	]);

	const totalTasks = toNumber(totals[0]?.value ?? 0);
	const completedTasks = toNumber(cycleRow[0]?.completedTasks ?? 0);
	const openTasks = Math.max(totalTasks - completedTasks, 0);
	const completionRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;

	return {
		workspaceId,
		from: range.from.toISOString(),
		to: range.to.toISOString(),
		totalTasks,
		completedTasks,
		openTasks,
		completionRate,
		averageCycleTimeHours: cycleRow[0]?.averageCycleTimeHours ?? null,
		activeMembers: toNumber(activeMembersRow[0]?.value ?? 0),
		totalComments: toNumber(commentsRow[0]?.value ?? 0),
		totalActivityEvents: toNumber(activityRow[0]?.value ?? 0),
	};
}

export async function getWorkspaceTaskCompletionSeries(
	workspaceId: number,
	range: AnalyticsDateRange,
	interval: AnalyticsInterval = 'day',
	filters: AnalyticsFilters = {}
): Promise<AnalyticsSeriesPoint[]> {
	const rows = await prisma.$queryRaw<TimeBucketRow[]>`
		WITH time_buckets AS (
			SELECT generate_series(
				${range.from}::timestamptz,
				${range.to}::timestamptz,
				${intervalToSql(interval)}
			) AS bucket
		), completed_tasks AS (
			SELECT
				${timeTruncExpression('t."dateCompleted"', interval)} AS bucket,
				COUNT(*) AS value
			FROM "Task" t
			INNER JOIN "Column" c ON c.id = t."columnId"
			WHERE c."workspaceId" = ${workspaceId}
			  AND t."dateCompleted" IS NOT NULL
			  AND t."dateCompleted" >= ${range.from}
			  AND t."dateCompleted" <= ${range.to}
			  ${buildTaskFilterClause(filters)}
			GROUP BY bucket
		)
		SELECT
			time_buckets.bucket AS bucket,
			COALESCE(completed_tasks.value, 0) AS value
		FROM time_buckets
		LEFT JOIN completed_tasks ON completed_tasks.bucket = time_buckets.bucket
		ORDER BY time_buckets.bucket ASC
	`;

	return resolveTimeSeries(rows);
}

export async function getWorkspaceTaskCreationSeries(
	workspaceId: number,
	range: AnalyticsDateRange,
	interval: AnalyticsInterval = 'day',
	filters: AnalyticsFilters = {}
): Promise<AnalyticsSeriesPoint[]> {
	const rows = await prisma.$queryRaw<TimeBucketRow[]>`
		WITH time_buckets AS (
			SELECT generate_series(
				${range.from}::timestamptz,
				${range.to}::timestamptz,
				${intervalToSql(interval)}
			) AS bucket
		), created_tasks AS (
			SELECT
				${timeTruncExpression('t."createdAt"', interval)} AS bucket,
				COUNT(*) AS value
			FROM "Task" t
			INNER JOIN "Column" c ON c.id = t."columnId"
			WHERE c."workspaceId" = ${workspaceId}
			  AND t."createdAt" >= ${range.from}
			  AND t."createdAt" <= ${range.to}
			  ${buildTaskFilterClause(filters)}
			GROUP BY bucket
		)
		SELECT
			time_buckets.bucket AS bucket,
			COALESCE(created_tasks.value, 0) AS value
		FROM time_buckets
		LEFT JOIN created_tasks ON created_tasks.bucket = time_buckets.bucket
		ORDER BY time_buckets.bucket ASC
	`;

	return resolveTimeSeries(rows);
}

export async function getWorkspaceTaskPriorityDistribution(
	workspaceId: number,
	range: AnalyticsDateRange,
	filters: AnalyticsFilters = {}
): Promise<AnalyticsDistributionPoint[]> {
	const rows = await prisma.$queryRaw<CountRow[]>`
		SELECT
			COALESCE(t.priority::text, 'unknown') AS label,
			COUNT(*) AS value
		FROM "Task" t
		INNER JOIN "Column" c ON c.id = t."columnId"
		WHERE c."workspaceId" = ${workspaceId}
		  AND t."createdAt" >= ${range.from}
		  AND t."createdAt" <= ${range.to}
		  ${buildTaskFilterClause(filters)}
		GROUP BY t.priority
		ORDER BY t.priority
	`;

	return rows.map((row: CountRow) => ({ label: row.label ?? 'unknown', value: toNumber(row.value) }));
}

export async function getWorkspaceTaskStatusDistribution(
	workspaceId: number,
	range: AnalyticsDateRange,
	filters: AnalyticsFilters = {}
): Promise<AnalyticsDistributionPoint[]> {
	const rows = await prisma.$queryRaw<CountRow[]>`
		SELECT
			CASE
				WHEN t."dateCompleted" IS NOT NULL THEN 'completed'
				WHEN t."isDone" = true THEN 'done'
				ELSE 'open'
			END AS label,
			COUNT(*) AS value
		FROM "Task" t
		INNER JOIN "Column" c ON c.id = t."columnId"
		WHERE c."workspaceId" = ${workspaceId}
		  AND t."createdAt" >= ${range.from}
		  AND t."createdAt" <= ${range.to}
		  ${buildTaskFilterClause(filters)}
		GROUP BY label
		ORDER BY label
	`;

	return rows.map((row: CountRow) => ({ label: row.label ?? 'unknown', value: toNumber(row.value) }));
}

export async function getWorkspaceMemberWorkload(
	workspaceId: number,
	range: AnalyticsDateRange,
	filters: AnalyticsFilters = {}
): Promise<AnalyticsMemberWorkload[]> {
	const { memberId, ...taskFilters } = filters;
	const rows = await prisma.$queryRaw<MemberWorkloadRow[]>`
		SELECT
			wm."userId" AS "userId",
			u.username AS username,
			u."avatarUrl" AS "avatarUrl",
			COUNT(DISTINCT ta.id) AS "assignedTasks",
			COUNT(DISTINCT CASE WHEN t."dateCompleted" IS NOT NULL THEN ta.id END) AS "completedTasks",
			COUNT(DISTINCT CASE WHEN t."dateCompleted" IS NULL THEN ta.id END) AS "openTasks",
			CASE
				WHEN COUNT(DISTINCT ta.id) = 0 THEN 0
				ELSE ROUND((COUNT(DISTINCT CASE WHEN t."dateCompleted" IS NOT NULL THEN ta.id END)::numeric / COUNT(DISTINCT ta.id)) * 100, 2)
			END AS "completionRate"
		FROM "WorkspaceMember" wm
		INNER JOIN "User" u ON u.id = wm."userId"
		LEFT JOIN "TaskAssignment" ta ON ta."userId" = wm."userId"
		LEFT JOIN "Task" t ON t.id = ta."taskId"
		LEFT JOIN "Column" c ON c.id = t."columnId"
		WHERE wm."workspaceId" = ${workspaceId}
		  ${memberId ? Prisma.sql`AND wm."userId" = ${memberId}` : Prisma.empty}
		  AND (t."createdAt" >= ${range.from} OR t.id IS NULL)
		  AND (t."createdAt" <= ${range.to} OR t.id IS NULL)
		  ${buildTaskFilterClause(taskFilters)}
		GROUP BY wm."userId", u.username, u."avatarUrl"
		ORDER BY "assignedTasks" DESC, u.username ASC
	`;

	return rows.map((row: MemberWorkloadRow) => ({
		userId: row.userId,
		username: row.username,
		avatarUrl: row.avatarUrl,
		assignedTasks: toNumber(row.assignedTasks),
		completedTasks: toNumber(row.completedTasks),
		openTasks: toNumber(row.openTasks),
		completionRate: row.completionRate ?? 0,
	}));
}

export async function getWorkspaceTaskTrend(
	workspaceId: number,
	range: AnalyticsDateRange,
	interval: AnalyticsInterval = 'day',
	filters: AnalyticsFilters = {}
): Promise<{ created: AnalyticsSeriesPoint[]; completed: AnalyticsSeriesPoint[] }> {
	const [created, completed] = await Promise.all([
		getWorkspaceTaskCreationSeries(workspaceId, range, interval, filters),
		getWorkspaceTaskCompletionSeries(workspaceId, range, interval, filters),
	]);

	return { created, completed };
}
