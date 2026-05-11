import { useState } from 'react'
import { UserPlus, Users, MoreVertical } from 'lucide-react'
import Avatar from './Avatar'
import type { Friend } from './Types'

interface AcceptedProps {
  friends: Friend[]
  searchQuery: string
  onViewProfile?: (id: string | number) => void
  onRemoveFriend?: (id: string | number) => void
}

export default function Accepted({ friends, searchQuery, onViewProfile, onRemoveFriend }: AcceptedProps) {
  const [openMenu, setOpenMenu] = useState<string | number | null>(null)

  const filtered = friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-20 px-10 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-6 text-slate-300">
          <Users size={40} />
        </div>
        <h2 className="font-display text-xl font-extrabold text-slate-900 mb-2">No friends yet</h2>
        <p className="font-body text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
          It looks like you haven't added anyone yet. Start by searching for your teammates to collaborate on projects.
        </p>
        <button className="flex items-center gap-2 px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-display font-bold text-sm transition-colors duration-150 shadow-lg shadow-cyan-100/50">
          <UserPlus size={15} />
          Find Teammates
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map(friend => (
        <div
          key={friend.id}
          className="relative bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-5 py-4 flex items-center transition-colors duration-150"
        >
          <Avatar name={friend.name} avatarUrl={friend.avatarUrl} online={friend.isOnline} />

          <div className="ml-4 flex-1 min-w-0">
            <h3 className="font-display font-bold text-slate-900">{friend.name}</h3>
            <p className="font-mono text-[11px] font-bold uppercase text-slate-400">
              {friend.isOnline ? 'Online' : (friend.lastSeen ?? 'Offline')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {friend.level != null && (
              <span className="bg-yellow-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md">
                {friend.level}
              </span>
            )}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === friend.id ? null : friend.id)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150"
              >
                <MoreVertical size={18} />
              </button>

              {openMenu === friend.id && (
                <div
                  className="absolute right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-lg w-40 z-50 p-1.5"
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    onClick={() => { onViewProfile?.(friend.id); setOpenMenu(null) }}
                    className="w-full text-left px-3 py-2 font-body text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors duration-150"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => { onRemoveFriend?.(friend.id); setOpenMenu(null) }}
                    className="w-full text-left px-3 py-2 font-body text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
                  >
                    Remove Friend
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
