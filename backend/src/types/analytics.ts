export type AnalyticsInterval = 'hour' | 'day' | 'week' | 'month';

export type AnalyticsDateRange = {
	from:   Date;
	to:     Date;
};

export type AnalyticsOverview = {
	workspaceId:            number;
	from:                   string;
	to:                     string;
	totalTasks:             number;
	completedTasks:         number;
	openTasks:              number;
	completionRate:         number;
	averageCycleTimeHours:  number | null;
	activeMembers:          number;
	totalComments:          number;
	totalActivityEvents:    number;
};

export type AnalyticsSeriesPoint = {
	bucket: string;
	value:  number;
};

export type AnalyticsDistributionPoint = {
	label:  string;
	value:  number;
};

export type AnalyticsMemberWorkload = {
	userId:         number;
	username:       string;
	avatarUrl:      string;
	assignedTasks:  number;
	completedTasks: number;
	openTasks:      number;
	completionRate: number;
};
