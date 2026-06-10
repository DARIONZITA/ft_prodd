import { useMemo, useState } from 'react'
import { Check, Search, UserPlus, X } from 'lucide-react'
import Accepted from '../../components/friend/Accepted'
import Pending from '../../components/friend/Pending'
import type { Friend, PendingRequest } from '../../components/friend/Types'
import {
  formatRelativeTime,
  getOtherFriendUser,
  useFriendsQuery,
  useIncomingFriendRequestsQuery,
  useOutgoingFriendRequestsQuery,
  useRemoveFriendMutation,
  useRespondFriendRequestMutation,
  useSendFriendRequestMutation,
} from '../../api/friends'
import { resolveAvatarUrl, useUsersQuery } from '../../api/user'

interface FriendsProps {
  userId: string | number
  onClose: () => void
  onViewProfile?: (id: string | number) => void
}

type Tab = 'friends' | 'pending' | 'find'

export default function Friends({ userId, onClose, onViewProfile }: FriendsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [findSearch, setFindSearch] = useState('')
  const [performSearchQuery, setPerformSearchQuery] = useState('')

  const friendsQuery = useFriendsQuery(userId, { refetchOnMount: false })
  const incomingQuery = useIncomingFriendRequestsQuery(userId, { refetchOnMount: false })
  const outgoingQuery = useOutgoingFriendRequestsQuery(userId, { refetchOnMount: false })
  const usersQuery = useUsersQuery(
    { search: performSearchQuery, take: 10 },
    { enabled: performSearchQuery.trim().length > 0, refetchOnMount: false }
  )

  const respondMutation = useRespondFriendRequestMutation(userId)
  const removeMutation = useRemoveFriendMutation(userId)
  const sendMutation = useSendFriendRequestMutation(userId)

  const friends = useMemo<Friend[]>(() => {
    const requests = friendsQuery.data?.data?.friendRequests ?? []
    return requests.map(request => {
      const other = getOtherFriendUser(request, userId)
      return {
        id: other.id,
        name: other.username,
        avatarUrl: resolveAvatarUrl(other.avatarUrl),
        isOnline: false,
      }
    })
  }, [friendsQuery.data, userId])

  const pendingRequests = useMemo<PendingRequest[]>(() => {
    const requests = incomingQuery.data?.data?.friendRequests ?? []
    return requests.map(request => {
      const sender = request.sender
      return {
        id: sender.id,
        name: sender.username,
        avatarUrl: resolveAvatarUrl(sender.avatarUrl),
        sentAgo: formatRelativeTime(request.createdAt),
      }
    })
  }, [incomingQuery.data])

  const friendIds = useMemo(() => new Set(friends.map(friend => String(friend.id))), [friends])
  const incomingIds = useMemo(
    () => new Set((incomingQuery.data?.data?.friendRequests ?? []).map(request => String(request.senderId))),
    [incomingQuery.data]
  )
  const outgoingIds = useMemo(
    () => new Set((outgoingQuery.data?.data?.friendRequests ?? []).map(request => String(request.receiverId))),
    [outgoingQuery.data]
  )

  const searchResults = useMemo(() => {
    const users = usersQuery.data?.data?.users ?? []
    return users.filter(user => {
      const id = String(user.id)
      return id !== String(userId) && !friendIds.has(id)
    })
  }, [usersQuery.data, userId, friendIds])

  const handlePerformSearch = () => {
    setPerformSearchQuery(findSearch.trim())
  }

  const handleAccept = (friendId: string | number) => {
    respondMutation.mutate({ friendId, status: 'accepted' })
  }

  const handleDecline = (friendId: string | number) => {
    respondMutation.mutate({ friendId, status: 'rejected' })
  }

  const handleRemoveFriend = (friendId: string | number) => {
    removeMutation.mutate(friendId)
  }

  const handleSendRequest = (friendId: string | number) => {
    sendMutation.mutate(friendId)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[12px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-50 w-full max-w-[800px] mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

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
            <button
              onClick={() => setActiveTab('find')}
              className={`font-display font-bold text-sm pb-3 transition-colors duration-150 ${
                activeTab === 'find'
                  ? 'text-cyan-600 border-b-[3px] border-cyan-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Find Users
            </button>
          </div>
        </div>

        <div className="px-8 py-6 overflow-y-auto flex flex-col gap-6">
          {activeTab !== 'find' ? (
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={activeTab === 'friends' ? 'Search friends...' : 'Search pending requests...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-body text-sm font-medium text-slate-900 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-400"
              />
            </div>
          ) : (
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={findSearch}
                onChange={e => setFindSearch(e.target.value)}
                onKeyUp={e => {
                  if (e.key === 'Enter') {
                    handlePerformSearch()
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-body text-sm font-medium text-slate-900 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          {activeTab === 'friends' ? (
            <Accepted
              friends={friends}
              searchQuery={searchQuery}
              onViewProfile={onViewProfile}
              onRemoveFriend={handleRemoveFriend}
            />
          ) : activeTab === 'pending' ? (
            <Pending
              requests={pendingRequests}
              searchQuery={searchQuery}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ) : (
            <div className="space-y-3">
              {usersQuery.isFetching ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  Searching users...
                </p>
              ) : performSearchQuery.trim().length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  Type a username or email and press Enter to search.
                </p>
              ) : searchResults.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  No users found.
                </p>
              ) : (
                searchResults.map(user => {
                  const userIdStr = String(user.id)
                  const isIncoming = incomingIds.has(userIdStr)
                  const isOutgoing = outgoingIds.has(userIdStr)

                  return (
                    <div
                      key={user.id}
                      className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
                        {user.username.trim()[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-slate-900">{user.username}</h3>
                        <p className="font-body text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      {isIncoming ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAccept(user.id)}
                            disabled={respondMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-display text-xs font-bold"
                          >
                            <Check size={13} />
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecline(user.id)}
                            disabled={respondMutation.isPending}
                            className="px-3 py-2 font-display text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                          >
                            Decline
                          </button>
                        </div>
                      ) : isOutgoing ? (
                        <span className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-body text-xs font-bold text-slate-400">
                          Request Sent
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendRequest(user.id)}
                          disabled={sendMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-display text-xs font-bold"
                        >
                          <UserPlus size={13} />
                          Add Friend
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
