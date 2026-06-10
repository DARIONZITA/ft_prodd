import { UserPlus, UserCheck } from 'lucide-react'
import Avatar from '../../components/profile/Avatar'
import StatsRow from '../../components/profile/StatsRow'
import {
  useFriendsQuery,
  useIncomingFriendRequestsQuery,
  useOutgoingFriendRequestsQuery,
  useRespondFriendRequestMutation,
  useSendFriendRequestMutation,
} from '../../api/friends'
import { resolveAvatarUrl, useUserProfileQuery, useUserStatsQuery } from '../../api/user'

interface OtherProfileProps {
  userId: string | number
  currentUserId: string | number
}

export default function OtherProfile({ userId, currentUserId }: OtherProfileProps) {
  const profileQuery = useUserProfileQuery(userId, { refetchOnMount: false })
  const statsQuery = useUserStatsQuery(userId, { refetchOnMount: false })
  const myFriendsQuery = useFriendsQuery(currentUserId, { refetchOnMount: false })
  const theirFriendsQuery = useFriendsQuery(userId, { refetchOnMount: false })
  const incomingQuery = useIncomingFriendRequestsQuery(currentUserId, { refetchOnMount: false })
  const outgoingQuery = useOutgoingFriendRequestsQuery(currentUserId, { refetchOnMount: false })

  const sendFriendMutation = useSendFriendRequestMutation(currentUserId)
  const respondFriendMutation = useRespondFriendRequestMutation(currentUserId)

  const profile = profileQuery.data?.data
  const stats = statsQuery.data?.data

  const isFriend = (myFriendsQuery.data?.data?.friendRequests ?? []).some(request => {
    return String(request.senderId) === String(userId) || String(request.receiverId) === String(userId)
  })

  const hasIncomingRequest = (incomingQuery.data?.data?.friendRequests ?? []).some(
    request => String(request.senderId) === String(userId)
  )

  const hasOutgoingRequest = (outgoingQuery.data?.data?.friendRequests ?? []).some(
    request => String(request.receiverId) === String(userId)
  )

  const handleAddFriend = () => {
    sendFriendMutation.mutate(userId)
  }

  const handleAcceptRequest = () => {
    respondFriendMutation.mutate({ friendId: userId, status: 'accepted' })
  }

  const handleDeclineRequest = () => {
    respondFriendMutation.mutate({ friendId: userId, status: 'rejected' })
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
        <p className="font-body text-sm text-slate-400">Loading profile...</p>
      </div>
    )
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
        <p className="font-body text-sm text-slate-400">User not found.</p>
      </div>
    )
  }

  const displayStats = {
    tasksCompleted: stats?.totalComments ?? 0,
    tasksAssigned: stats?.totalTasks ?? 0,
    friends: theirFriendsQuery.data?.data?.pagination?.total ?? 0,
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-[600px] mx-auto px-6 py-8 flex flex-col gap-4">

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-6">
          <Avatar name={profile.username} avatarUrl={resolveAvatarUrl(profile.avatarUrl)} size="lg" />

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">{profile.username}</h1>

              {isFriend ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg font-body text-xs font-bold text-emerald-700">
                  <UserCheck size={14} />
                  Friends
                </span>
              ) : hasOutgoingRequest ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-body text-xs font-bold text-slate-400">
                  Request Sent
                </span>
              ) : hasIncomingRequest ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAcceptRequest}
                    disabled={respondFriendMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-body text-xs font-bold"
                  >
                    <UserCheck size={14} />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={handleDeclineRequest}
                    disabled={respondFriendMutation.isPending}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-body text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddFriend}
                  disabled={sendFriendMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-body text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors duration-150"
                >
                  <UserPlus size={14} className="text-slate-400" />
                  Add Friend
                </button>
              )}
            </div>

            <p className="font-body text-[13px] text-slate-500 mt-3 leading-relaxed font-medium max-w-md">
              {profile.bio || 'No bio yet.'}
            </p>

            <div className="flex items-center gap-1.5 mt-3">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="font-mono text-[11px] font-bold uppercase text-slate-400">Offline</span>
            </div>
          </div>
        </div>

        <StatsRow stats={displayStats} />

        {isFriend ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="font-body text-sm text-slate-600">
              You are friends with <span className="font-bold text-slate-900">{profile.username}</span>.
            </p>
          </div>
        ) : (
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
