import type { Stats } from './Types'

interface StatsRowProps {
  stats: Stats
  onFriendsClick?: () => void
}

export default function StatsRow({ stats, onFriendsClick }: StatsRowProps) {
  const items = [
    { value: stats.tasksCompleted, label: 'Tasks Completed', onClick: undefined },
    { value: stats.tasksAssigned,  label: 'Tasks Assigned',  onClick: undefined },
    { value: stats.friends,        label: 'Friends',         onClick: onFriendsClick },
  ]
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ value, label, onClick }) => (
        <div
          key={label}
          onClick={onClick}
          className="group bg-white border border-slate-200 hover:border-cyan-300 rounded-xl px-5 py-6 text-left cursor-pointer transition-colors duration-200"
        >
          <div className="text-3xl font-extrabold text-slate-900 group-hover:text-cyan-500 transition-colors duration-200 font-display">
            {value}
          </div>
          <div className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
