import { useState } from 'react'
import { AlertTriangle, Pencil, Mail, Loader2, Check, X } from 'lucide-react'
import ProfileAvatar from '../../components/profile/Avatar'
import Edit from './Edit'
import {
  useDeleteUserRequest,
  useUpdateUserRequest,
  type UpdateUserProfilePayload,
} from '../../api/user'
import {
  useFriendsQuery,
  useIncomingFriendRequestsQuery,
  useRespondFriendRequestMutation,
  getOtherFriendUser,
  formatRelativeTime,
} from '../../api/friends'
import type { User } from '../../types/user'

type Section = 'friends' | 'pending'

interface ThisProfileProps {
  user: User
  onProfileUpdate?: (updated: Partial<User>) => void
  onNavigate?: (view: string, payload?: string | number) => void
}

export default function ThisProfile({ user, onProfileUpdate, onNavigate }: ThisProfileProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<Section | null>(null)

  const updateUserMutation = useUpdateUserRequest({
    onSuccess: response => {
      setSaveError(null)
      setEditOpen(false)
      onProfileUpdate?.(response.data)
    },
    onError: error => { setSaveError(error.message || 'Failed to update profile.') },
  })

  const deleteUserMutation = useDeleteUserRequest({
    onSuccess: () => { window.location.href = '/signin' },
    onError: error => { setDeleteError(error.message || 'Failed to delete account.') },
  })

  const friendsQuery = useFriendsQuery(user.id, { refetchOnMount: false })
  const friends = (friendsQuery.data?.data?.friendRequests ?? []).map(r => ({
    ...getOtherFriendUser(r, user.id),
    requestId: r.id,
  }))

  const incomingQuery = useIncomingFriendRequestsQuery(user.id, { refetchOnMount: false })
  const incoming = (incomingQuery.data?.data?.friendRequests ?? []).map(r => ({
    ...r.sender,
    requestId: r.id,
    createdAt: r.createdAt,
  }))

  const respondMutation = useRespondFriendRequestMutation(user.id)

  const handleSave = (updated: UpdateUserProfilePayload) => {
    setSaveError(null)
    updateUserMutation.mutate(updated)
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm('Delete your account permanently? This action cannot be undone.')
    if (!confirmed) return
    setDeleteError(null)
    deleteUserMutation.mutate()
  }

  const toggleSection = (section: Section) => {
    setActiveSection(prev => prev === section ? null : section)
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-[680px] mx-auto px-6 py-8 flex flex-col gap-5">

        {/* Header card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start gap-5">
          <ProfileAvatar name={user.username} avatarUrl={user.avatarUrl} size="lg" />
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-slate-900">{user.username}</h1>
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-400 uppercase hover:text-cyan-600 transition-colors duration-150"
              >
                <Pencil size={12} />
                Edit Profile
              </button>
            </div>
            {user.bio && (
              <p className="font-body text-sm text-slate-500 mt-2 leading-relaxed max-w-lg">{user.bio}</p>
            )}
            <div className="flex items-center gap-1.5 mt-3">
              <Mail size={13} className="text-slate-400" />
              <span className="font-body text-xs text-slate-500">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Clickable stat boxes */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            label="Friends"
            count={friends.length}
            active={activeSection === 'friends'}
            onClick={() => toggleSection('friends')}
          />
          <StatBox
            label="Pending"
            count={incoming.length}
            active={activeSection === 'pending'}
            onClick={() => toggleSection('pending')}
          />
        </div>

        {/* Active section content */}

        {activeSection === 'friends' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-display font-bold text-sm text-slate-900 mb-4">Friends</h2>
            {friendsQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : friends.length === 0 ? (
              <p className="font-body text-sm text-slate-400 py-6 text-center">No friends yet.</p>
            ) : (
              <div className="space-y-2">
                {friends.map(f => (
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

        {activeSection === 'pending' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-display font-bold text-sm text-slate-900 mb-4">Pending Friend Requests</h2>
            {incomingQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : incoming.length === 0 ? (
              <p className="font-body text-sm text-slate-400 py-6 text-center">No pending requests.</p>
            ) : (
              <div className="space-y-2">
                {incoming.map(req => (
                  <div key={req.requestId} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 font-display">
                      {req.username.trim()[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-slate-900">{req.username}</p>
                      <p className="font-mono text-[10px] text-slate-400">{formatRelativeTime(req.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => respondMutation.mutate({ friendId: req.id, status: 'accepted' })}
                        disabled={respondMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-body text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => respondMutation.mutate({ friendId: req.id, status: 'rejected' })}
                        disabled={respondMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 font-body text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X size={12} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Danger Zone */}
        <section className="bg-white border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={18} />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold text-slate-900">Danger Zone</h2>
              <p className="mt-1 font-body text-sm text-slate-500">
                Permanently delete your account and remove your access to all workspaces.
              </p>
              {deleteError ? (
                <p className="mt-3 font-body text-sm text-red-600">{deleteError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteUserMutation.isPending}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-body text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {deleteUserMutation.isPending ? 'Deleting account...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {editOpen && (
        <Edit
          user={user}
          isSaving={updateUserMutation.isPending}
          onClose={() => { setEditOpen(false); setSaveError(null) }}
          onSave={handleSave}
        />
      )}

      {saveError && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-600 shadow-lg">
          {saveError}
        </div>
      )}
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
