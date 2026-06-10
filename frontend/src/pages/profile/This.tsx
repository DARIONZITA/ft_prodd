import { useState } from 'react'
import { AlertTriangle, Pencil } from 'lucide-react'
import XPbar from '../../components/profile/XPbar'
import Achievements from '../../components/profile/Achievements'
import Avatar from '../../components/profile/Avatar'
import StatsRow from '../../components/profile/StatsRow'
import Edit from './Edit'
import type { Data } from '../../components/profile/Types'
import { DEFAULT_ACHIEVEMENTS } from '../../components/profile/Achievements'
import {
  resolveAvatarUrl,
  useDeleteUserRequest,
  useUpdateUserRequest,
  type UpdateUserProfilePayload,
} from '../../api/user'

interface ProfileProps {
  profile: Data
  onFriendsClick?: () => void
  onProfileUpdate?: (updated: Partial<Data>) => void
}

export default function UserProfile({ profile: initialUser, onFriendsClick, onProfileUpdate }: ProfileProps) {
  const [user, setUser] = useState(initialUser.user)
  const [profile, setProfile] = useState(initialUser)
  const [editOpen, setEditOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const updateUserMutation = useUpdateUserRequest({
    onSuccess: response => {
      const updatedUser = response.data
      const nextUser = { ...user, ...updatedUser }
      const newProfile = { ...profile, user: nextUser }

      setUser(nextUser)
      setProfile(newProfile)
      setSaveError(null)
      setEditOpen(false)
      onProfileUpdate?.(newProfile)
    },
    onError: error => {
      setSaveError(error.message || 'Failed to update profile.')
    },
  })

  const deleteUserMutation = useDeleteUserRequest({
    onSuccess: () => {
      window.location.href = '/signin'
    },
    onError: error => {
      setDeleteError(error.message || 'Failed to delete account.')
    },
  })

  const handleSave = (updated: UpdateUserProfilePayload) => {
    setSaveError(null)
    updateUserMutation.mutate(updated)
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Delete your account permanently? This action cannot be undone.'
    )

    if (!confirmed) {
      return
    }

    setDeleteError(null)
    deleteUserMutation.mutate()
  }

  return (
    <>
      <div className="flex-1 h-full overflow-y-auto bg-slate-50">
        <div className="max-w-[600px] mx-auto px-6 py-8 flex flex-col gap-4">

          {/* Header card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-5">
            <Avatar name={user.username} avatarUrl={user.avatarUrl} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-xl text-slate-900">{user.username}</h1>
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
                <span className={`w-2 h-2 rounded-full ${profile.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={`font-mono text-[10px] font-bold uppercase ${profile.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {profile.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <StatsRow stats={profile.stats} onFriendsClick={onFriendsClick} />
          <XPbar level={profile.level} xp={profile.xp} xpRequired={profile.xpRequired} />
          <Achievements achievements={DEFAULT_ACHIEVEMENTS} />

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
      </div>

      {editOpen && (
        <Edit
          user={user}
          isSaving={updateUserMutation.isPending}
          onClose={() => {
            setEditOpen(false)
            setSaveError(null)
          }}
          onSave={handleSave}
        />
      )}

      {saveError ? (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-600 shadow-lg">
          {saveError}
        </div>
      ) : null}
    </>
  )
}
