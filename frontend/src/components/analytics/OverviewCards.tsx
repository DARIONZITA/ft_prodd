import { ListChecks, CheckCircle2, TrendingUp, Users } from 'lucide-react'

interface OverviewData {
  totalTasks: number
  completedTasks: number
  completionRate: number
  activeMembers: number
}

interface OverviewCardsProps {
  data: OverviewData | null
  loading: boolean
}

const LOADING_SKELETON = 'h-7 w-16 rounded-lg bg-slate-200 animate-pulse'

export default function OverviewCards({ data, loading }: OverviewCardsProps) {
  const cards = [
    {
      label: 'Total Tasks',
      value: data?.totalTasks,
      icon: ListChecks,
      accent: 'text-cyan-600 bg-cyan-50',
      iconBg: 'bg-cyan-500/10',
    },
    {
      label: 'Completed Tasks',
      value: data?.completedTasks,
      icon: CheckCircle2,
      accent: 'text-emerald-600 bg-emerald-50',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'Completion Rate',
      value: data ? `${Math.round(data.completionRate)}%` : undefined,
      icon: TrendingUp,
      accent: 'text-indigo-600 bg-indigo-50',
      iconBg: 'bg-indigo-500/10',
    },
    {
      label: 'Active Members',
      value: data?.activeMembers,
      icon: Users,
      accent: 'text-amber-600 bg-amber-50',
      iconBg: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-150 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{card.label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent}`}>
                <Icon size={16} />
              </span>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className={LOADING_SKELETON} />
              ) : (
                <span className="font-display text-3xl font-bold text-slate-900">
                  {card.value ?? '—'}
                </span>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
