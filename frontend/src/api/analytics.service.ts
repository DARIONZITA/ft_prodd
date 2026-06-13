import api from './axios'
import type { OverviewResponse, SeriesPoint, TrendResponse, DistributionItem, WorkloadItem, AnalyticsFilters } from '../types/analytics'

function buildParams(range?: { from?: string; to?: string; interval?: string }, filters?: AnalyticsFilters): string {
  const params = new URLSearchParams()
  if (range?.from) params.set('from', range.from)
  if (range?.to) params.set('to', range.to)
  if (range?.interval) params.set('interval', range.interval)
  if (filters?.priority) params.set('priority', filters.priority)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.memberId != null) params.set('memberId', String(filters.memberId))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function getOverview(workspaceId: number, range?: { from?: string; to?: string }, filters?: AnalyticsFilters) {
  const res = await api.get<{ success: boolean; data: OverviewResponse }>(
    `/api/analytics/workspaces/${workspaceId}/overview${buildParams(range, filters)}`
  )
  return res.data.data
}

export async function getTrend(workspaceId: number, range?: { from?: string; to?: string; interval?: string }, filters?: AnalyticsFilters) {
  const res = await api.get<{ success: boolean; data: TrendResponse }>(
    `/api/analytics/workspaces/${workspaceId}/trend${buildParams(range, filters)}`
  )
  return res.data.data
}

export async function getCreationSeries(workspaceId: number, range?: { from?: string; to?: string; interval?: string }, filters?: AnalyticsFilters) {
  const res = await api.get<{ success: boolean; data: SeriesPoint[] }>(
    `/api/analytics/workspaces/${workspaceId}/series/creation${buildParams(range, filters)}`
  )
  return res.data.data
}

export async function getCompletionSeries(workspaceId: number, range?: { from?: string; to?: string; interval?: string }, filters?: AnalyticsFilters) {
  const res = await api.get<{ success: boolean; data: SeriesPoint[] }>(
    `/api/analytics/workspaces/${workspaceId}/series/completion${buildParams(range, filters)}`
  )
  return res.data.data
}

export async function getPriorityDistribution(workspaceId: number, range?: { from?: string; to?: string }, filters?: AnalyticsFilters) {
  const res = await api.get<{ success: boolean; data: DistributionItem[] }>(
    `/api/analytics/workspaces/${workspaceId}/distributions/priority${buildParams(range, filters)}`
  )
  return res.data.data
}

export async function getStatusDistribution(workspaceId: number, range?: { from?: string; to?: string }, filters?: AnalyticsFilters) {
  const res = await api.get<{ success: boolean; data: DistributionItem[] }>(
    `/api/analytics/workspaces/${workspaceId}/distributions/status${buildParams(range, filters)}`
  )
  return res.data.data
}

export async function getWorkload(workspaceId: number, range?: { from?: string; to?: string }, filters?: AnalyticsFilters) {
  const res = await api.get<{ success: boolean; data: WorkloadItem[] }>(
    `/api/analytics/workspaces/${workspaceId}/workload${buildParams(range, filters)}`
  )
  return res.data.data
}
