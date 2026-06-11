import { Users, ChevronRight } from 'lucide-react'

interface WorkspaceCardProps {
  name: string
  description?: string
  memberCount?: number
  role?: string
  onClick?: () => void
}

export default function WorkspaceCard({ name, description, memberCount, role, onClick }: WorkspaceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 hover:border-cyan-300 rounded-xl px-5 py-4 transition-colors duration-200 group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-sm text-slate-900 truncate">{name}</h3>
            {role && (
              <span className="font-mono text-[10px] font-bold uppercase text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">
                {role}
              </span>
            )}
          </div>
          {description && (
            <p className="font-body text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
          {memberCount != null && (
            <div className="flex items-center gap-1.5 mt-2">
              <Users size={12} className="text-slate-400" />
              <span className="font-mono text-[10px] font-bold text-slate-400">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-cyan-500 transition-colors duration-200 flex-shrink-0" />
      </div>
    </button>
  )
}
