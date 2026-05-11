import { useState } from 'react'
import { X, Search } from 'lucide-react'
import Accepted from '../../components/friend/Accepted'
import Pending from '../../components/friend/Pending'
import type { Friend, PendingRequest } from '../../components/friend/Types'

interface FriendsProps {
  friends: Friend[]
  pendingRequests: PendingRequest[]
  onClose: () => void
  onViewProfile?: (id: string | number) => void
  onRemoveFriend?: (id: string | number) => void
  onAccept?: (id: string | number) => void
  onDecline?: (id: string | number) => void
}

export const MOCK_FRIENDS: Friend[] = [
  { id: 'alice',   name: 'alice_42',      isOnline: true,  level: 6 },
  { id: 'bob',     name: 'bob_dev',       isOnline: false, lastSeen: 'Last seen 3h ago' },
  { id: 'charlie', name: 'charlie_code',  isOnline: true,  level: 5 },
]

export const MOCK_PENDING: PendingRequest[] = [
  { id: 'eve',   name: 'eve_student', sentAgo: '2 hours ago' },
  { id: 'frank', name: 'frank_42',    sentAgo: '5 hours ago' },
  { id: 'grace', name: 'grace_dev',   sentAgo: '1 day ago'   },
]

type Tab = 'friends' | 'pending'

export default function Friends({
  friends,
  pendingRequests,
  onClose,
  onViewProfile,
  onRemoveFriend,
  onAccept,
  onDecline,
}: FriendsProps) {
  const [activeTab, setActiveTab]   = useState<Tab>('friends')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[12px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-50 w-full max-w-[800px] mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal header */}
        <div className="bg-slate-50 px-8 pt-8 pb-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="font-display font-extrabold text-3xl text-slate-900">Friends</h1>
              <p className="font-body text-slate-500 font-medium mt-1">Manage your teammates and connections</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors duration-150 mt-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-8 border-b border-slate-200 mt-6">
            <button
              onClick={() => setActiveTab('friends')}
              className={`font-display font-bold text-sm pb-3 transition-colors duration-150 ${
                activeTab === 'friends'
                  ? 'text-cyan-600 border-b-[3px] border-cyan-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`font-display font-bold text-sm pb-3 flex items-center gap-2 transition-colors duration-150 ${
                activeTab === 'pending'
                  ? 'text-cyan-600 border-b-[3px] border-cyan-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search + content */}
        <div className="px-8 py-6 overflow-y-auto flex flex-col gap-6">

          {/* Search bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-body text-sm font-medium text-slate-900 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Active tab content */}
          {activeTab === 'friends' ? (
            <Accepted
              friends={friends}
              searchQuery={searchQuery}
              onViewProfile={onViewProfile}
              onRemoveFriend={onRemoveFriend}
            />
          ) : (
            <Pending
              requests={pendingRequests}
              searchQuery={searchQuery}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          )}

        </div>
      </div>
    </div>
  )
}
