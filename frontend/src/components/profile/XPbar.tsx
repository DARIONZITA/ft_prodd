interface XPbarProps {
  level: number
  xp: number
  xpRequired: number
}

export default function XPbar({ level, xp, xpRequired }: XPbarProps) {
  const xpPercent   = Math.round((xp / xpRequired) * 100)
  const xpRemaining = xpRequired - xp

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="font-display font-bold text-sm text-slate-900 mb-4">Level &amp; Experience</h2>
      <div className="flex items-center gap-4">
        <div className="bg-slate-900 text-cyan-400 w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
          L{level}
        </div>
        <div className="flex-1">
          <div className="font-mono text-[10px] font-bold text-slate-600 mb-1.5">
            {xp} / {xpRequired} XP
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, #0ea5e9 0%, #8b5cf6 100%)' }}
            />
          </div>
          <div className="font-mono text-[9px] font-bold text-slate-400 mt-1.5 uppercase">
            {xpRemaining} XP to level {level + 1}
          </div>
        </div>
      </div>
    </div>
  )
}
