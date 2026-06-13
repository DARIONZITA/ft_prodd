import { resolveAvatarUrl } from '../../api/user'

export default function Avatar({ name, avatarUrl, online }: { name: string; avatarUrl?: string | null; online?: boolean }) {
  const initials = name.trim()[0]?.toUpperCase() ?? '?'
  const resolvedAvatarUrl = resolveAvatarUrl(avatarUrl)

  return (
    <div className="relative flex-shrink-0">
      {resolvedAvatarUrl ? (
        <img src={resolvedAvatarUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-white text-lg"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)' }}
        >
          {initials}
        </div>
      )}
      {online != null && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      )}
    </div>
  )
}
