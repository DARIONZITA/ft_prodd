import { resolveAvatarUrl } from '../../api/user'

interface ProfileAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'md' | 'lg'   // md = sidebar/card, lg = profile hero
  online?: boolean
}

export default function ProfileAvatar({ name, avatarUrl, size = 'md', online }: ProfileAvatarProps) {
  const initials = name?.trim()[0]?.toUpperCase() ?? '?'
  const dim = size === 'lg' ? 'w-32 h-32 text-5xl' : 'w-20 h-20 text-2xl'
  const resolvedAvatarUrl = resolveAvatarUrl(avatarUrl)

  return (
    <div className="relative flex-shrink-0">
      {resolvedAvatarUrl ? (
        <img
          src={resolvedAvatarUrl}
          alt={name}
          className={`${dim} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${dim} rounded-full flex items-center justify-center font-display font-bold text-white`}
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}
        >
          {initials}
        </div>
      )}
      {online != null && (
        <span className={`absolute bottom-1 right-1 block h-4 w-4 rounded-full border-2 border-white ${online ? 'bg-green-500' : 'bg-slate-300'}`} />
      )}
    </div>
  )
}
