import { useState } from 'react'
import { UserPlus, UserCheck, Loader2, Lock, X, Users } from 'lucide-react'
import ProfileAvatar from '../../components/profile/Avatar'
import WorkspaceCard from '../../components/profile/WorkspaceCard'
import {
  useUserProfileQuery,
} from '../../api/user'
import {
  useFriendsQuery,
  useIncomingFriendRequestsQuery,
  useOutgoingFriendRequestsQuery,
  useSendFriendRequestMutation,
  useRespondFriendRequestMutation,
  useRemoveFriendMutation,
  getOtherFriendUser,
} from '../../api/friends'
import { useUserWorkspacesForUserQuery, useRequestToJoinWorkspaceMutation } from '../../api/workspace'
import type { User } from '../../types/user'

type Section = 'workspaces' | 'friends'

interface OtherProfileProps {
  userId: string | number
  currentUserId: string | number
  onNavigate?: (view: string, payload?: string | number) => void
}

export default function OtherProfile({ userId, currentUserId, onNavigate }: OtherProfileProps) {
  const [asideSection, setAsideSection] = useState<Section | null>(null)

  const profileNumeric = typeof userId === 'string' ? Number(userId) : userId
  const meNumeric = typeof currentUserId === 'string' ? Number(currentUserId) : currentUserId

  const profileQuery = useUserProfileQuery(profileNumeric, { enabled: !!userId })
  const user: User | null = profileQuery.data?.data ?? null

  const friendsQuery = useFriendsQuery(meNumeric)
  const areFriends = friendsQuery.data?.data?.friendRequests?.some(
    r => r.senderId === profileNumeric || r.receiverId === profileNumeric,
  ) ?? false

  const outgoingQuery = useOutgoingFriendRequestsQuery(meNumeric)
  const outgoingToThem = outgoingQuery.data?.data?.friendRequests?.find(r => r.receiverId === profileNumeric)

  const incomingQuery = useIncomingFriendRequestsQuery(meNumeric)
  const incomingFromThem = incomingQuery.data?.data?.friendRequests?.find(r => r.senderId === profileNumeric)

  const friendshipStatus: 'none' | 'pending' | 'accepted' = areFriends ? 'accepted' : outgoingToThem ? 'pending' : 'none'
  const isFriend = friendshipStatus === 'accepted'

  const respondMutation = useRespondFriendRequestMutation(meNumeric)
  const sendMutation = useSendFriendRequestMutation(meNumeric)
  const removeMutation = useRemoveFriendMutation(meNumeric)

  const workspacesQuery = useUserWorkspacesForUserQuery(profileNumeric, { enabled: isFriend })
  const workspaces = workspacesQuery.data?.data ?? []

  const theirFriendsQuery = useFriendsQuery(profileNumeric, { enabled: isFriend })
  const theirFriends = (theirFriendsQuery.data?.data?.friendRequests ?? []).map(r => ({
    ...getOtherFriendUser(r, profileNumeric),
    requestId: r.id,
  }))

  const requestJoinMutation = useRequestToJoinWorkspaceMutation()

  const handleRequestJoin = async (workspaceId: number | string) => {
    try {
      await requestJoinMutation.mutateAsync(workspaceId)
      workspacesQuery.refetch()
    } catch (err) {
      console.error('Failed to request to join workspace:', err)
    }
  }

  const refreshAll = () => {
    friendsQuery.refetch()
    outgoingQuery.refetch()
    incomingQuery.refetch()
    workspacesQuery.refetch()
    theirFriendsQuery.refetch()
  }

  const isMutationPending =
    sendMutation.isPending ||
    removeMutation.isPending ||
    respondMutation.isPending ||
    requestJoinMutation.isPending

  const isLoading = profileQuery.isLoading || friendsQuery.isLoading || outgoingQuery.isLoading || incomingQuery.isLoading

  const handleFriendAction = () => {
    if (incomingFromThem && friendshipStatus === 'none') {
      respondMutation.mutate(
        { friendId: incomingFromThem.id, status: 'accepted' },
        { onSuccess: () => refreshAll() },
      )
      return
    }
    if (friendshipStatus === 'none') {
      sendMutation.mutate(profileNumeric, { onSuccess: () => refreshAll() })
    } else if (friendshipStatus === 'pending') {
      removeMutation.mutate(profileNumeric, { onSuccess: () => refreshAll() })
    } else if (friendshipStatus === 'accepted') {
      removeMutation.mutate(profileNumeric, { onSuccess: () => refreshAll() })
    }
  }

  const renderFriendButton = () => {
    const baseBtn = 'flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-[11px] font-bold uppercase transition-all duration-200'

    const hasIncoming = incomingFromThem && friendshipStatus === 'none'
    if (hasIncoming) {
      return (
        <button
          type="button"
          onClick={handleFriendAction}
          disabled={isMutationPending}
          className={`${baseBtn} bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50`}
        >
          {isMutationPending ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
          {isMutationPending ? 'Accepting...' : 'Accept Request'}
        </button>
      )
    }

    switch (friendshipStatus) {
      case 'none':
        return (
          <button
            type="button"
            onClick={handleFriendAction}
            disabled={isMutationPending}
            className={`${baseBtn} bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50`}
          >
            {isMutationPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {isMutationPending ? 'Sending...' : 'Add Friend'}
          </button>
        )
      case 'pending':
        return (
          <button
            type="button"
            onClick={handleFriendAction}
            disabled={isMutationPending}
            className={`${baseBtn} bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 disabled:opacity-50`}
          >
            {isMutationPending ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
            {isMutationPending ? 'Cancelling...' : 'Cancel Request'}
          </button>
        )
      case 'accepted':
        return (
          <button
            type="button"
            onClick={handleFriendAction}
            disabled={isMutationPending}
            className={`${baseBtn} bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50`}
          >
            {isMutationPending ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
            {isMutationPending ? 'Removing...' : 'Friends'}
          </button>
        )
    }
  }

  const toggleAside = (section: Section) => {
    setAsideSection(prev => prev === section ? null : section)
  }

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
        <p className="font-body text-slate-500">User not found.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-[680px] mx-auto px-6 py-8 flex flex-col gap-5">
        {/* Header card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-5">
          <ProfileAvatar name={user.username} avatarUrl={user.avatarUrl} size="lg" />
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="font-display font-bold text-2xl text-slate-900">{user.username}</h1>
            {user.bio && (
              <p className="font-body text-sm text-slate-500 mt-2 leading-relaxed max-w-lg">{user.bio}</p>
            )}
            <div className="mt-4">{renderFriendButton()}</div>
          </div>
        </div>

        {isFriend ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                label="Friends"
                count={theirFriends.length}
                active={asideSection === 'friends'}
                onClick={() => toggleAside('friends')}
              />
              <StatBox
                label="Workspaces"
                count={workspaces.length}
                active={asideSection === 'workspaces'}
                onClick={() => toggleAside('workspaces')}
              />
            </div>

            {asideSection === 'workspaces' && (
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="font-display font-bold text-sm text-slate-900 mb-4">{user.username}'s Workspaces</h2>
                {workspacesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  </div>
                ) : workspaces.length === 0 ? (
                  <p className="font-body text-sm text-slate-400 py-6 text-center">No workspaces yet.</p>
                ) : (
                  <div className="space-y-2">
                    {workspaces.map(ws => {
                      const userRole = (ws as any).currentUserRole
                      const hasAccess = userRole && ['admin', 'member', 'guest'].includes(userRole)
                      const isRequestPending = userRole === 'requesting'
                      const isInvitePending = userRole === 'pending'
                      const isProcessing = requestJoinMutation.isPending && requestJoinMutation.variables === ws.id

                      return (
                        <div key={ws.id} className="relative bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:border-slate-300 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display font-bold text-sm text-slate-900 truncate">{ws.name}</h3>
                              {userRole && (
                                <span className={`font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  hasAccess 
                                    ? 'text-cyan-600 bg-cyan-50' 
                                    : isInvitePending 
                                      ? 'text-amber-600 bg-amber-50' 
                                      : 'text-slate-500 bg-slate-100'
                                }`}>
                                  {userRole === 'admin' ? 'Admin' : userRole === 'member' ? 'Member' : userRole === 'guest' ? 'Guest' : userRole === 'pending' ? 'Invited' : 'Requesting'}
                                </span>
                              )}
                            </div>
                            {ws.description && (
                              <p className="font-body text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {ws.description}
                              </p>
                            )}
                            {ws.memberCount != null && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <Users size={12} className="text-slate-400" />
                                <span className="font-mono text-[10px] font-bold text-slate-400">
                                  {ws.memberCount} {ws.memberCount === 1 ? 'member' : 'members'}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0">
                            {hasAccess ? (
                              <button
                                type="button"
                                onClick={() => onNavigate?.('workspace', ws.id)}
                                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                Enter
                              </button>
                            ) : isRequestPending ? (
                              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg font-mono text-[10px] font-bold uppercase border border-slate-200">
                                Request Pending
                              </span>
                            ) : isInvitePending ? (
                              <button
                                type="button"
                                onClick={() => onNavigate?.('invitations')}
                                className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-mono text-[10px] font-bold uppercase hover:bg-amber-100 transition-colors cursor-pointer"
                              >
                                Accept Invite
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleRequestJoin(ws.id)}
                                className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg font-mono text-[10px] font-bold uppercase transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              >
                                {isProcessing && <Loader2 size={10} className="animate-spin" />}
                                Request to Join
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {asideSection === 'friends' && (
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="font-display font-bold text-sm text-slate-900 mb-4">{user.username}'s Friends</h2>
                {theirFriendsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  </div>
                ) : theirFriends.length === 0 ? (
                  <p className="font-body text-sm text-slate-400 py-6 text-center">No friends yet.</p>
                ) : (
                  <div className="space-y-2">
                    {theirFriends.map(f => (
                      <button
                        key={f.requestId}
                        type="button"
                        onClick={() => onNavigate?.('user', f.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 font-display">
                          {f.username.trim()[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-display font-bold text-sm text-slate-900">{f.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          <section className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Lock size={24} />
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900">Private Profile</h2>
            <p className="font-body text-sm text-slate-500 max-w-sm">
              Add {user.username} as a friend to see their workspaces and friends.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white border rounded-xl px-5 py-5 text-left transition-colors duration-200 cursor-pointer ${
        active
          ? 'border-cyan-400 ring-1 ring-cyan-400'
          : 'border-slate-200 hover:border-cyan-300'
      }`}
    >
      <div className={`text-3xl font-extrabold font-display transition-colors duration-200 ${
        active ? 'text-cyan-600' : 'text-slate-900'
      }`}>
        {count}
      </div>
      <div className={`font-mono text-[9px] font-bold uppercase tracking-wider mt-1 transition-colors duration-200 ${
        active ? 'text-cyan-600' : 'text-slate-400'
      }`}>
        {label}
      </div>
    </button>
  )
}
