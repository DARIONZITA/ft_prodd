import { useState } from 'react'
import { Pencil } from 'lucide-react'
import XPbar from '../../components/profile/XPbar'
import Achievements from '../../components/profile/Achievements'
import Avatar from '../../components/profile/Avatar'
import StatsRow from '../../components/profile/StatsRow'
import Edit from './Edit'
import type { Data } from '../../components/profile/Types'
import { DEFAULT_ACHIEVEMENTS } from '../../components/profile/Achievements'

interface ProfileProps {
  user: Data
  onFriendsClick?: () => void
  onProfileUpdate?: (updated: Partial<Data>) => void
}

export default function Profile({ user: initialUser, onFriendsClick, onProfileUpdate }: ProfileProps) {
  const [user, setUser]         = useState(initialUser)
  const [editOpen, setEditOpen] = useState(false)

  const handleSave = (updated: { name: string; bio: string; avatarUrl: string | null }) => {
    setUser(u => ({ ...u, ...updated }))
    onProfileUpdate?.(updated)
    setEditOpen(false)
  }

  return (
    <>
      <div className="flex-1 h-full overflow-y-auto bg-slate-50">
        <div className="max-w-[600px] mx-auto px-6 py-8 flex flex-col gap-4">

          {/* Header card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-5">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-xl text-slate-900">{user.name}</h1>
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-400 uppercase hover:text-cyan-600 transition-colors duration-150"
                >
                  <Pencil size={11} />
                  Edit Profile
                </button>
              </div>
              <p className="font-body text-xs text-slate-500 mt-1 leading-relaxed max-w-md">{user.bio}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={`font-mono text-[10px] font-bold uppercase ${user.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {user.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <StatsRow stats={user.stats} onFriendsClick={onFriendsClick} />
          <XPbar level={user.level} xp={user.xp} xpRequired={user.xpRequired} />
          <Achievements achievements={DEFAULT_ACHIEVEMENTS} />

        </div>
      </div>

      {editOpen && (
        <Edit
          user={user}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  )
}
