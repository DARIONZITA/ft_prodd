import { Clock, GitCommit, Code2, Terminal, Layers, Zap, Lock } from 'lucide-react'

interface Achievement {
  id: string
  label: string
  description: string
  Icon: React.ElementType
  color: string
  unlockedAt?: string
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-commit',     label: 'First Commit',     description: 'Complete your first task',  Icon: GitCommit, color: 'bg-emerald-500', unlockedAt: 'Mar 15' },
  { id: 'code-master',      label: 'Code Master',      description: 'Complete 5 sprints',        Icon: Code2,     color: 'bg-blue-600',   unlockedAt: 'Mar 2'  },
  { id: 'bug-terminator',   label: 'Bug Terminator',   description: 'Fix 10 critical bugs',      Icon: Terminal,  color: 'bg-red-500',    unlockedAt: 'Mar 18' },
  { id: 'system-architect', label: 'System Architect', description: 'Design 3 systems',          Icon: Layers,    color: 'bg-purple-600', unlockedAt: 'Mar 15' },
  { id: 'performance-guru', label: 'Performance Guru', description: 'Optimize 5 paths',          Icon: Zap,       color: 'bg-slate-200'   },
  { id: 'security-expert',  label: 'Security Expert',  description: 'Pass 10 audits',            Icon: Lock,      color: 'bg-slate-200'   },
]

interface AchievementsProps {
  achievements: Achievement[]
}

export default function Achievements({ achievements }: AchievementsProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="font-display font-bold text-sm text-slate-900 mb-4">Achievements</h2>
      <div className="grid grid-cols-3 gap-3">
        {achievements.map(({ id, label, description, Icon, color, unlockedAt }) => {
          const locked = !unlockedAt
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
                    {label}
                  </h3>
                  <p className="font-body text-[9px] text-slate-400 leading-tight mt-0.5">{description}</p>
                </div>
              </div>
              {unlockedAt && (
                <div className="mt-auto pt-2 font-mono text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={10} />
                  {unlockedAt}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
