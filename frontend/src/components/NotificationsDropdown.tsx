import { Bell } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface NotificationItem {
  id: string
  text: string
  meta: string
  type: 'task' | 'mention' | 'badge' | 'friend'
  unread: boolean
}

interface NotificationsDropdownProps {
  active: boolean
  bellSize?: number
  bellPaddingClassName?: string
  onViewAll: () => void
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', text: 'Alex K. mentioned you in TASK-092 · Auth API', meta: '2 min ago', type: 'mention', unread: true },
  { id: 'n2', text: 'Maria L. assigned TASK-108 · WebSocket refactor', meta: '14 min ago', type: 'task', unread: true },
  { id: 'n3', text: 'You earned Sprint Hero badge (+200 XP)', meta: '1 hr ago', type: 'badge', unread: true },
  { id: 'n4', text: 'Level Up! You reached Level 9', meta: '1 hr ago', type: 'badge', unread: true },
  { id: 'n5', text: 'TASK-101 · Login flow is due tomorrow', meta: '3 hr ago', type: 'task', unread: true },
  { id: 'n6', text: 'Sam T. commented on TASK-089 · Dashboard layout', meta: 'Yesterday', type: 'task', unread: false },
]

const TYPE_BADGE: Record<NotificationItem['type'], string> = {
  mention: 'bg-indigo-100 text-indigo-700',
  task: 'bg-cyan-100 text-cyan-700',
  badge: 'bg-amber-100 text-amber-700',
  friend: 'bg-violet-100 text-violet-700',
}

export default function NotificationsDropdown({
  active,
  bellSize = 18,
  bellPaddingClassName = 'p-1.5',
  onViewAll,
}: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const unreadCount = useMemo(() => notifications.filter(item => item.unread).length, [notifications])
  const isEmpty = notifications.length === 0

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  const onMarkAllRead = () => {
    setNotifications(current => current.map(item => ({ ...item, unread: false })))
  }

  const onMarkRead = (id: string) => {
    setNotifications(current => current.map(item => (item.id === id ? { ...item, unread: false } : item)))
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative rounded-lg transition-colors duration-150 ${bellPaddingClassName} ${
          open || active ? 'bg-cyan-50 text-cyan-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <Bell size={bellSize} />
        {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white" />}
      </button>

      {open && (
        <div className="absolute left-full top-0 z-50 ml-2 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-slate-900">Notifications</h3>
              {!isEmpty && unreadCount > 0 && (
                <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700">{unreadCount} new</span>
              )}
            </div>
            {isEmpty ? (
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">All caught up</span>
            ) : (
              <button onClick={onMarkAllRead} className="text-xs font-medium text-cyan-600 hover:text-cyan-800">
                Mark all read
              </button>
            )}
          </div>

          {isEmpty ? (
            <div className="py-12 px-6 text-center">
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <Bell size={24} />
              </span>
              <p className="font-display text-sm font-bold text-slate-800">You're all caught up</p>
              <p className="font-body mt-1 text-xs text-slate-500">No new notifications right now.</p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {notifications.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onMarkRead(item.id)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${item.unread ? 'bg-cyan-50/60 hover:bg-cyan-50' : 'hover:bg-slate-50'}`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold uppercase ${TYPE_BADGE[item.type]}`}>
                    {item.type.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm leading-snug ${item.unread ? 'text-slate-800' : 'text-slate-500'}`}>{item.text}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-slate-400">{item.meta}</span>
                  </span>
                  {item.unread && <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
            {isEmpty ? (
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">You are up to date</span>
            ) : (
              <span className="font-mono text-[10px] text-slate-400">Showing last {Math.min(10, notifications.length)}</span>
            )}
            {!isEmpty && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onViewAll()
                }}
                className="text-xs font-medium text-cyan-600 hover:text-cyan-800"
              >
                View all
              </button>
            )}
          </div>
        </div>
      )}
      </div>
  )
}
