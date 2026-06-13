export type AnalyticsInterval = 'hour' | 'day' | 'week' | 'month'

export type AnalyticsPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type AnalyticsTaskStatus = 'open' | 'done' | 'completed'

export interface AnalyticsFilters {
  priority?:  AnalyticsPriority
  status?:    AnalyticsTaskStatus
  memberId?:  number
}

export interface OverviewResponse {
  workspaceId:            number
  from:                   string
  to:                     string
  totalTasks:             number
  completedTasks:         number
  openTasks:              number
  completionRate:         number
  averageCycleTimeHours:  number | null
  activeMembers:          number
  totalComments:          number
  totalActivityEvents:    number
}

export interface SeriesPoint {
  bucket: string
  value:  number
}

export interface TrendResponse {
  created:    SeriesPoint[]
  completed:  SeriesPoint[]
}

export interface DistributionItem {
  label: string
  value: number
}

export interface WorkloadItem {
  userId:         number
  username:       string
  avatarUrl:      string
  assignedTasks:  number
  completedTasks: number
  openTasks:      number
  completionRate: number
}
