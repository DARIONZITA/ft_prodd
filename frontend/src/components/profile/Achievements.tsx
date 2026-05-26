import { Clock } from 'lucide-react'
import { SHARED_BADGES } from '../gamification/SharedBadges'
import type { BadgeItem } from '../gamification/Types'

// Re-export shared badges for direct use
export const DEFAULT_ACHIEVEMENTS: BadgeItem[] = SHARED_BADGES

interface AchievementsProps {
  achievements: BadgeItem[]
}

export default function Achievements({ achievements }: AchievementsProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="font-display font-bold text-sm text-slate-900 mb-4">Achievements</h2>
      <div className="grid grid-cols-3 gap-3">
        {achievements.map(({ id, name, description, Icon, color, earnedAt }) => {
          const locked = !earnedAt
          return (
            <div
              key={id}
              className={`border rounded-xl p-3 flex flex-col min-h-[110px] transition-colors duration-150 ${
                locked ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200 bg-white hover:border-cyan-200'
              }`}
            >
              <div className="flex gap-2">
                <div className={`w-8 h-8 ${locked ? 'bg-slate-200' : color} rounded flex items-center justify-center flex-shrink-0 ${locked ? 'text-slate-400' : 'text-white'}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-display text-[11px] font-bold leading-tight ${locked ? 'text-slate-500' : 'text-slate-900'}`}>
                    {name}
                  </h3>
                  <p className="font-body text-[9px] text-slate-400 leading-tight mt-0.5">{description}</p>
                </div>
              </div>
              {earnedAt && (
                <div className="mt-auto pt-2 font-mono text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={10} />
                  {earnedAt}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
