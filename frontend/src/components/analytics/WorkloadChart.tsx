import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WorkloadItem } from '../../types/analytics'

interface WorkloadChartProps {
  data: WorkloadItem[] | null
  loading: boolean
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

export default function WorkloadChart({ data, loading }: WorkloadChartProps) {
  const chartData = data?.map(item => ({
    name: item.username,
    Assigned: item.assignedTasks,
    Completed: item.completedTasks,
  }))

  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <h2 className="mb-4 font-display text-xl font-bold text-slate-900">Workload</h2>
      {loading ? (
        <div className="flex h-[320px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center">
          <p className="font-body text-sm text-slate-400">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(320, data.length * 48)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fill: '#475569' }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif', paddingTop: 8 }} />
            <Bar dataKey="Assigned" fill="#0891b2" radius={[0, 6, 6, 0]} />
            <Bar dataKey="Completed" fill="#10b981" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </article>
  )
}
