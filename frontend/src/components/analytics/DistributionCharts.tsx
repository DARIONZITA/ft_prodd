import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartPie, BarChart3 } from 'lucide-react'
import type { DistributionItem } from '../../types/analytics'

interface DistributionChartsProps {
  priority: DistributionItem[] | null
  status: DistributionItem[] | null
  loading: boolean
}

const COLORS = ['#0891b2', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm">
      <p className="flex items-center gap-2 font-body text-sm font-semibold text-slate-900">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.payload?.fill || entry.color }} />
        {entry.name}: {entry.value}
      </p>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-[280px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
    </div>
  )
}

type ChartView = 'donut' | 'bar'

function ViewToggle({ value, onChange }: { value: ChartView; onChange: (v: ChartView) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => onChange('donut')}
        className={`flex items-center gap-1.5 px-3 py-1.5 font-body text-xs font-medium transition-colors ${
          value === 'donut' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <ChartPie size={14} /> Donut
      </button>
      <button
        type="button"
        onClick={() => onChange('bar')}
        className={`flex items-center gap-1.5 px-3 py-1.5 font-body text-xs font-medium transition-colors ${
          value === 'bar' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <BarChart3 size={14} /> Bar
      </button>
    </div>
  )
}

function DistributionCard({
  title,
  data,
  loading,
  view,
}: {
  title: string
  data: DistributionItem[] | null
  loading: boolean
  view: ChartView
}) {
  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <h3 className="mb-4 font-display text-lg font-bold text-slate-900">{title}</h3>
      {loading ? (
        <ChartSkeleton />
      ) : !data || data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center">
          <p className="font-body text-sm text-slate-400">No data available</p>
        </div>
      ) : view === 'donut' ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              nameKey="label"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
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
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </article>
  )
}

export default function DistributionCharts({ priority, status, loading }: DistributionChartsProps) {
  const [view, setView] = useState<ChartView>('donut')

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-slate-900">Distribution</h2>
        <ViewToggle value={view} onChange={setView} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <DistributionCard title="Priority Distribution" data={priority} loading={loading} view={view} />
        <DistributionCard title="Status Distribution" data={status} loading={loading} view={view} />
      </div>
    </section>
  )
}
