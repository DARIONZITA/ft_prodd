import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { getApiErrorMessage } from '../../api/axios'
import * as analyticsService from '../../api/analytics.service'
import type { AnalyticsInterval, AnalyticsPriority, AnalyticsTaskStatus, OverviewResponse, SeriesPoint, TrendResponse, DistributionItem, WorkloadItem } from '../../types/analytics'
import AnalyticsFiltersComponent from '../../components/analytics/AnalyticsFilters'
import OverviewCards from '../../components/analytics/OverviewCards'
import TrendCharts from '../../components/analytics/TrendCharts'
import DistributionCharts from '../../components/analytics/DistributionCharts'
import WorkloadChart from '../../components/analytics/WorkloadChart'

interface FilterState {
  from?: string
  to?: string
  interval?: AnalyticsInterval
  priority?: AnalyticsPriority
  status?: AnalyticsTaskStatus
  memberId?: number
}

interface AnalyticsPageProps {
  workspaceId: string | number
  workspaceName: string
  onBack?: () => void
}

export default function AnalyticsPage({ workspaceId, workspaceName, onBack }: AnalyticsPageProps) {
  const [filters, setFilters] = useState<FilterState>({})

  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [trend, setTrend] = useState<TrendResponse | null>(null)
  const [creationSeries, setCreationSeries] = useState<SeriesPoint[] | null>(null)
  const [completionSeries, setCompletionSeries] = useState<SeriesPoint[] | null>(null)
  const [priority, setPriority] = useState<DistributionItem[] | null>(null)
  const [status, setStatus] = useState<DistributionItem[] | null>(null)
  const [workload, setWorkload] = useState<WorkloadItem[] | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const range = {
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(filters.interval ? { interval: filters.interval } : {}),
  }
  const hasRange = Object.keys(range).length > 0

  const apiFilters = {
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.memberId != null ? { memberId: filters.memberId } : {}),
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        overviewRes,
        trendRes,
        creationRes,
        completionRes,
        priorityRes,
        statusRes,
        workloadRes,
      ] = await Promise.all([
        analyticsService.getOverview(workspaceId, range, apiFilters),
        analyticsService.getTrend(workspaceId, range, apiFilters),
        analyticsService.getCreationSeries(workspaceId, range, apiFilters),
        analyticsService.getCompletionSeries(workspaceId, range, apiFilters),
        analyticsService.getPriorityDistribution(workspaceId, range, apiFilters),
        analyticsService.getStatusDistribution(workspaceId, range, apiFilters),
        analyticsService.getWorkload(workspaceId, range, apiFilters),
      ])
      setOverview(overviewRes)
      setTrend(trendRes)
      setCreationSeries(creationRes)
      setCompletionSeries(completionRes)
      setPriority(priorityRes)
      setStatus(statusRes)
      setWorkload(workloadRes)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, hasRange ? JSON.stringify(range) : '', JSON.stringify(apiFilters)])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_45%)]" />
      <div className="relative mx-auto max-w-[1240px] px-6 py-8 lg:px-8 lg:py-9">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <div>
              <div className="flex items-center gap-3">
                <BarChart3 size={24} className="text-cyan-600" />
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 lg:text-[2.7rem]">
                  Analytics
                </h1>
              </div>
              <p className="mt-1 font-body text-base text-slate-500 lg:text-xl">
                Insights for {workspaceName}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/80 px-5 py-4">
            <p className="font-body text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <AnalyticsFiltersComponent filters={filters} onChange={setFilters} />
        </div>

        <div className="mb-8">
          <OverviewCards data={overview} loading={loading} />
        </div>

        <div className="mb-8">
          <TrendCharts
            trend={trend}
            creationSeries={creationSeries}
            completionSeries={completionSeries}
            loading={loading}
          />
        </div>

        <div className="mb-8">
          <DistributionCharts priority={priority} status={status} loading={loading} />
        </div>

        <div className="mb-8">
          <WorkloadChart data={workload} loading={loading} />
        </div>
      </div>
    </div>
  )
}
