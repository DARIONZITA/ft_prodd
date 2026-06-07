import { Calendar, Filter, X } from 'lucide-react'
import type { AnalyticsInterval, AnalyticsPriority, AnalyticsTaskStatus } from '../../types/analytics'

interface FilterState {
  from?: string
  to?: string
  interval?: AnalyticsInterval
  priority?: AnalyticsPriority
  status?: AnalyticsTaskStatus
  memberId?: number
}

interface AnalyticsFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const INTERVALS: { value: AnalyticsInterval; label: string }[] = [
  { value: 'hour', label: 'Hourly' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

const PRIORITIES: { value: AnalyticsPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

const STATUSES: { value: AnalyticsTaskStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
  { value: 'completed', label: 'Completed' },
]

export default function AnalyticsFilters({ filters, onChange }: AnalyticsFiltersProps) {
  const hasActiveFilters = filters.from || filters.to || filters.interval || filters.priority || filters.status || filters.memberId

  const clear = () => onChange({})

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <Filter size={16} />
        <span className="font-mono text-xs font-bold uppercase tracking-[0.08em]">Filters</span>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative min-w-[160px]">
          <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={e => onChange({ ...filters, from: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 font-body text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
          />
        </div>

        <span className="font-body text-xs text-slate-400">to</span>

        <div className="relative min-w-[160px]">
          <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={e => onChange({ ...filters, to: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 font-body text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
          />
        </div>

        <select
          value={filters.interval ?? ''}
          onChange={e => onChange({ ...filters, interval: (e.target.value as AnalyticsInterval) || undefined })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
        >
          <option value="">All periods</option>
          {INTERVALS.map(i => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>

        <select
          value={filters.priority ?? ''}
          onChange={e => onChange({ ...filters, priority: (e.target.value as AnalyticsPriority) || undefined })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <select
          value={filters.status ?? ''}
          onChange={e => onChange({ ...filters, status: (e.target.value as AnalyticsTaskStatus) || undefined })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  )
}
