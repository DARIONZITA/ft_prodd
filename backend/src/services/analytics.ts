import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
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
	range: AnalyticsDateRange
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
		`,
		prisma.$queryRaw<CountRow[]>`
			SELECT COUNT(DISTINCT wm."userId") AS value
			FROM "WorkspaceMember" wm
			WHERE wm."workspaceId" = ${workspaceId}
		`,
		prisma.$queryRaw<CountRow[]>`
			SELECT COUNT(*) AS value
			FROM "Comment" cm
			INNER JOIN "Task" t ON t.id = cm."taskId"
			INNER JOIN "Column" c ON c.id = t."columnId"
			WHERE c."workspaceId" = ${workspaceId}
			  AND cm."createdAt" >= ${range.from}
			  AND cm."createdAt" <= ${range.to}
		`,
		prisma.$queryRaw<CountRow[]>`
			SELECT COUNT(*) AS value
			FROM "ActivityLog" al
			WHERE al."workspaceId" = ${workspaceId}
			  AND al."createdAt" >= ${range.from}
			  AND al."createdAt" <= ${range.to}
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
	interval: AnalyticsInterval = 'day'
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
	interval: AnalyticsInterval = 'day'
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
	range: AnalyticsDateRange
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
		GROUP BY t.priority
		ORDER BY t.priority
	`;

	return rows.map((row: CountRow) => ({ label: row.label ?? 'unknown', value: toNumber(row.value) }));
}

export async function getWorkspaceTaskStatusDistribution(
	workspaceId: number,
	range: AnalyticsDateRange
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
		GROUP BY label
		ORDER BY label
	`;

	return rows.map((row: CountRow) => ({ label: row.label ?? 'unknown', value: toNumber(row.value) }));
}

export async function getWorkspaceMemberWorkload(
	workspaceId: number,
	range: AnalyticsDateRange
): Promise<AnalyticsMemberWorkload[]> {
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
		  AND (t."createdAt" >= ${range.from} OR t.id IS NULL)
		  AND (t."createdAt" <= ${range.to} OR t.id IS NULL)
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
	interval: AnalyticsInterval = 'day'
): Promise<{ created: AnalyticsSeriesPoint[]; completed: AnalyticsSeriesPoint[] }> {
	const [created, completed] = await Promise.all([
		getWorkspaceTaskCreationSeries(workspaceId, range, interval),
		getWorkspaceTaskCompletionSeries(workspaceId, range, interval),
	]);

	return { created, completed };
}
