import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { SeriesPoint, TrendResponse } from '../../types/analytics'

interface TrendChartsProps {
  trend: TrendResponse | null
  creationSeries: SeriesPoint[] | null
  completionSeries: SeriesPoint[] | null
  loading: boolean
}

function mergeTrend(data: TrendResponse): { bucket: string; created: number; completed: number }[] {
  const map = new Map<string, { bucket: string; created: number; completed: number }>()
  for (const pt of data.created) {
    map.set(pt.bucket, { bucket: pt.bucket, created: pt.value, completed: 0 })
  }
  for (const pt of data.completed) {
    const existing = map.get(pt.bucket)
    if (existing) {
      existing.completed = pt.value
    } else {
      map.set(pt.bucket, { bucket: pt.bucket, created: 0, completed: pt.value })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.bucket.localeCompare(b.bucket))
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm">
      <p className="font-mono text-xs font-medium text-slate-500 mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="flex items-center gap-2 font-body text-sm font-semibold text-slate-900">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
    </div>
  )
}

function TrendChartCard({
  title,
  data,
  dataKey,
  loading,
  lines,
}: {
  title: string
  data: any[] | null
  dataKey?: string
  loading: boolean
  lines: { key: string; color: string; name: string }[]
}) {
  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <h3 className="mb-4 font-display text-lg font-bold text-slate-900">{title}</h3>
      {loading ? (
        <ChartSkeleton />
      ) : !data || data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center">
          <p className="font-body text-sm text-slate-400">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey={dataKey ?? 'bucket'}
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif', paddingTop: 8 }}
            />
            {lines.map(line => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={{ r: 3, fill: line.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: line.color, strokeWidth: 2, stroke: '#fff' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </article>
  )
}

const THEME = {
  created: '#6366f1',
  completed: '#10b981',
  creation: '#0891b2',
}

export default function TrendCharts({ trend, creationSeries, completionSeries, loading }: TrendChartsProps) {
  const combinedData = trend ? mergeTrend(trend) : null

  return (
    <section className="space-y-6">
      <TrendChartCard
        title="Combined Trend"
        data={combinedData}
        loading={loading}
        lines={[
          { key: 'created', color: THEME.created, name: 'Created' },
          { key: 'completed', color: THEME.completed, name: 'Completed' },
        ]}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <TrendChartCard
          title="Creation Trend"
          data={creationSeries}
          loading={loading}
          lines={[{ key: 'value', color: THEME.creation, name: 'Created' }]}
        />
        <TrendChartCard
          title="Completion Trend"
          data={completionSeries}
          loading={loading}
          lines={[{ key: 'value', color: THEME.completed, name: 'Completed' }]}
        />
      </div>
    </section>
  )
}
