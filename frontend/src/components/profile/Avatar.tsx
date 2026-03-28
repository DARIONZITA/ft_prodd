interface ProfileAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'md' | 'lg'   // md = sidebar/card, lg = profile hero
}

export default function ProfileAvatar({ name, avatarUrl, size = 'md' }: ProfileAvatarProps) {
  const initials = name?.trim()[0]?.toUpperCase() ?? '?'
  const dim = size === 'lg' ? 'w-32 h-32 text-5xl' : 'w-20 h-20 text-2xl'

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className={`${dim} rounded-full object-cover flex-shrink-0`}
    />
  ) : (
    <div
      className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-white`}
      style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}
    >
      {initials}
    </div>
  )
}
