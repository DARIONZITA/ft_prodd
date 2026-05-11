import { useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import XPbar from '../../components/profile/XPbar'
import Achievements from '../../components/profile/Achievements'
import Avatar from '../../components/profile/Avatar'
import StatsRow from '../../components/profile/StatsRow'
import type { Data } from '../../components/profile/Types'
import { DEFAULT_ACHIEVEMENTS } from '../../components/profile/Achievements'

export interface OtherData extends Data {
  isFriend: boolean
  friendRequestSent?: boolean
}

interface OtherProfileProps {
  user: OtherData
  onAddFriend?: (userId: string) => void
}

export default function OtherProfile({ user: initialUser, onAddFriend }: OtherProfileProps) {
  const [user, setUser] = useState(initialUser)

  const handleAddFriend = () => {
    setUser(u => ({ ...u, friendRequestSent: true }))
    onAddFriend?.(user.name)
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-[600px] mx-auto px-6 py-8 flex flex-col gap-4">

        {/* Header card — larger avatar + Add Friend button */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-6">
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">{user.name}</h1>

              {/* Add Friend / Request Sent button */}
              {user.isFriend ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg font-body text-xs font-bold text-emerald-700">
                  <UserCheck size={14} />
                  Friends
                </span>
              ) : user.friendRequestSent ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-body text-xs font-bold text-slate-400">
                  Request Sent
                </span>
              ) : (
                <button
                  onClick={handleAddFriend}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-body text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors duration-150"
                >
                  <UserPlus size={14} className="text-slate-400" />
                  Add Friend
                </button>
              )}
            </div>

            <p className="font-body text-[13px] text-slate-500 mt-3 leading-relaxed font-medium max-w-md">
              {user.bio}
            </p>

            <div className="flex items-center gap-1.5 mt-3">
              {user.isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px] font-bold uppercase text-emerald-500">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="font-mono text-[11px] font-bold uppercase text-slate-400">
                    {user.lastSeen ?? 'Offline'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <StatsRow stats={user.stats} />

        {/* Gate: only show XP + Achievements if they're a friend */}
        {user.isFriend ? (
          <>
            <XPbar level={user.level} xp={user.xp} xpRequired={user.xpRequired} />
            <Achievements achievements={DEFAULT_ACHIEVEMENTS} />
          </>
        ) : (
          /* Locked state — matches other_user_profile.html empty-state */
          <div className="bg-white border border-slate-200 rounded-xl py-16 px-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4">
              <UserPlus size={28} className="text-slate-300" />
            </div>
            <p className="font-display text-sm font-bold text-slate-400 tracking-tight">
              Add them as a friend to see more
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
