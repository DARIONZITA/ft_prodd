import { X, UserCheck, Check } from 'lucide-react'
import Avatar from './Avatar'
import type { PendingRequest } from './Types'

interface PendingProps {
  requests: PendingRequest[]
  searchQuery: string
  onAccept?: (id: string | number) => void
  onDecline?: (id: string | number) => void
}

export default function Pending({ requests, searchQuery, onAccept, onDecline }: PendingProps) {
  const filtered = requests.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-20 px-10 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-6 text-slate-300">
          <UserCheck size={40} />
        </div>
        <h2 className="font-display text-xl font-extrabold text-slate-900 mb-2">All caught up!</h2>
        <p className="font-body text-slate-500 font-medium max-w-sm leading-relaxed">
          You don't have any pending friend requests at the moment. When someone wants to connect, their request will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map(req => (
        <div
          key={req.id}
          className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex items-center shadow-sm"
        >
          <Avatar name={req.name} avatarUrl={req.avatarUrl} />

          <div className="ml-4 flex-1 min-w-0">
            <h3 className="font-display font-bold text-[15px] text-slate-900">{req.name}</h3>
            <p className="font-mono text-[11px] font-bold text-slate-400">Sent you a friend request</p>
            <p className="font-body text-[10px] text-slate-400">{req.sentAgo}</p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => onAccept?.(req.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-display text-xs font-bold transition-colors duration-150"
            >
              <Check size={13} />
              Accept
            </button>
            <button
              onClick={() => onDecline?.(req.id)}
              className="flex items-center gap-1.5 px-4 py-2 font-display text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors duration-150"
            >
              <X size={13} />
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
