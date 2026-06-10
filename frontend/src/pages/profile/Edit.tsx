import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { X, UploadCloud } from 'lucide-react'
import Avatar from '../../components/profile/Avatar'
import { resolveAvatarUrl, type UpdateUserProfilePayload } from '../../api/user'
import type { User } from '../../types/user'

const BIO_MAX = 142

interface EditProps {
  user: User
  isSaving?: boolean
  onClose: () => void
  onSave: (updated: UpdateUserProfilePayload) => void
}

export default function Edit({ user, isSaving = false, onClose, onSave }: EditProps) {
  const initialAvatarUrl = resolveAvatarUrl(user.avatarUrl)
  const [name, setName] = useState(user.username)
  const [bio, setBio] = useState(user.bio)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasChanges =
    name.trim() !== user.username ||
    bio !== user.bio ||
    avatarFile !== null

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setAvatarFile(file)
    setAvatarPreview(previous => {
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous)
      }
      return URL.createObjectURL(file)
    })
  }

  const handleSave = () => {
    if (!hasChanges || isSaving) {
      return
    }

    const payload: UpdateUserProfilePayload = {}
    const trimmedName = name.trim()

    if (trimmedName !== user.username) {
      payload.username = trimmedName
    }

    if (bio !== user.bio) {
      payload.bio = bio
    }

    if (avatarFile) {
      payload.avatar = avatarFile
    }

    onSave(payload)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[12px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-[500px] mx-4 rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="font-display font-bold text-xl text-slate-900">Edit Profile</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-800 transition-colors duration-150">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Avatar */}
          <div>
            <span className="block font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Avatar</span>
            <div className="flex items-center gap-4">
              <Avatar name={name} avatarUrl={avatarPreview} size="md" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 font-body text-xs font-bold text-slate-700 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-150"
              >
                <UploadCloud size={15} />
                Change Avatar
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg font-body text-sm text-slate-800 outline-none focus:border-2 focus:border-cyan-400 transition-all duration-150"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, BIO_MAX))}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-body text-sm text-slate-800 outline-none focus:border-2 focus:border-cyan-400 transition-all duration-150 resize-none leading-relaxed"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="font-body text-[11px] text-slate-500 italic">Tell your teammates about yourself</p>
              <p className={`font-mono text-[11px] font-bold ${bio.length >= BIO_MAX ? 'text-red-500' : 'text-slate-500'}`}>
                {bio.length} / {BIO_MAX}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div>
            <span className="block font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Preview</span>
            <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 bg-slate-50/50">
              <Avatar name={name} avatarUrl={avatarPreview} size="md" />
              <div className="overflow-hidden">
                <h4 className="font-display text-xs font-bold text-slate-900 leading-none mb-1">{name || '—'}</h4>
                <p className="font-body text-[10px] text-slate-500 truncate">{bio || 'No bio yet...'}</p>
              </div>
            </div>
          </div>

        </div>

        <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
          <button onClick={onClose} className="font-body text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors duration-150">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-6 py-2 rounded-lg font-display text-sm font-bold transition-colors duration-150 ${
              hasChanges && !isSaving
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
