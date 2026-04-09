 import { useMemo, useState } from 'react'
import { CheckCheck, ChevronLeft, ChevronRight, Settings } from 'lucide-react'

type NotificationType = 'task' | 'mention' | 'badge' | 'friend'

interface NotificationRow {
  id: string
  title: string
  detail?: string
  meta: string
  type: NotificationType
  unread: boolean
  group: 'today' | 'yesterday' | 'older'
}

const initialNotifications: NotificationRow[] = [
  {
    id: 'n1',
    title: 'Alex K. mentioned you in TASK-092 · Auth API integration',
    detail: '"@Jose can you check the token expiry logic here?"',
    meta: '2 min ago',
    type: 'mention',
    unread: true,
    group: 'today',
  },
  {
    id: 'n2',
    title: 'Maria L. assigned you to TASK-108 · WebSocket event refactor',
    detail: 'Due Feb 22 · High priority',
    meta: '14 min ago',
    type: 'task',
    unread: true,
    group: 'today',
  },
  { id: 'n3', title: 'You earned the Sprint Hero badge for completing all tasks this sprint!', detail: '+200 XP earned', meta: '1 hr ago', type: 'badge', unread: true, group: 'today' },
  { id: 'n4', title: 'Level Up! You reached Level 9. Keep it up!', detail: '1,160 XP remaining to Level 10', meta: '1 hr ago', type: 'badge', unread: true, group: 'today' },
  { id: 'n5', title: 'TASK-101 · Login flow UI is due tomorrow', meta: '3 hr ago', type: 'task', unread: true, group: 'today' },
  { id: 'n6', title: 'Sam T. commented on TASK-089 · Dashboard layout', meta: 'Yesterday, 4:12 PM', type: 'task', unread: false, group: 'yesterday' },
  { id: 'n7', title: 'TASK-095 · Token refresh logic was moved to Code Review', meta: 'Yesterday, 2:00 PM', type: 'task', unread: false, group: 'yesterday' },
  { id: 'n8', title: 'Leo N. sent you a friend request', meta: 'Yesterday, 11:30 AM', type: 'friend', unread: false, group: 'yesterday' },
  { id: 'n9', title: 'Priya R. approved your PR on TASK-092 · Auth API', meta: '2 days ago', type: 'mention', unread: false, group: 'older' },
]

const filters: Array<{ id: 'all' | NotificationType; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'task', label: 'Tasks' },
  { id: 'mention', label: 'Mentions' },
  { id: 'badge', label: 'Badges' },
  { id: 'friend', label: 'Friends' },
]

const groupLabels: Record<'today' | 'yesterday' | 'older', string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  older: 'Older',
}

const typeChip: Record<NotificationType, string> = {
  task: 'bg-cyan-50 text-cyan-700',
  mention: 'bg-indigo-50 text-indigo-700',
  badge: 'bg-amber-50 text-amber-700',
  friend: 'bg-violet-50 text-violet-700',
}

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all')
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialNotifications)

  const unreadCount = useMemo(() => notifications.filter(item => item.unread).length, [notifications])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') {
      return notifications
    }
    return notifications.filter(item => item.type === activeFilter)
  }, [activeFilter, notifications])

  const markAllRead = () => {
    setNotifications(current => current.map(item => ({ ...item, unread: false })))
  }

  const markRead = (id: string) => {
    setNotifications(current => current.map(item => (item.id === id ? { ...item, unread: false } : item)))
  }

  return (
    <div className="flex-1 min-h-full overflow-y-auto bg-slate-50 text-slate-700">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">All Notifications</h1>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{unreadCount} unread</span> · {notifications.length} total
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100"
            >
              <CheckCheck size={15} /> Mark all as read
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">
              <Settings size={14} /> Preferences
            </button>
          </div>
        </div>

        <div className="mb-5 inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {filters.map(filter => {
            const count = filter.id === 'all' ? notifications.length : notifications.filter(item => item.type === filter.id).length
            const active = activeFilter === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {filter.label} <span className="ml-1 font-mono text-xs opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {(['today', 'yesterday', 'older'] as const).map(group => {
            const rows = filtered.filter(item => item.group === group)
            if (rows.length === 0) {
              return null
            }

            return (
              <div key={group}>
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{groupLabels[group]}</p>
                </div>

                {rows.map(row => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => markRead(row.id)}
                    className={`group flex w-full gap-4 border-b border-slate-100 px-5 py-4 text-left last:border-b-0 ${
                      row.unread ? 'bg-cyan-50/60 hover:bg-cyan-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${typeChip[row.type]}`}>
                      {row.type.slice(0, 1).toUpperCase()}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm leading-snug ${row.unread ? 'text-slate-800' : 'text-slate-500'}`}>{row.title}</span>
                      {row.detail && <span className="mt-1 block text-xs italic text-slate-500">{row.detail}</span>}
                      <span className="mt-1.5 block font-mono text-[10px] text-slate-400">{row.meta}</span>
                    </span>

                    <span className="flex items-start gap-2 pt-1">
                      {row.unread && <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />}
                    </span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="font-mono text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">1–{Math.min(12, filtered.length)}</span> of{' '}
            <span className="font-semibold text-slate-700">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
              <ChevronLeft size={14} />
            </button>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-sm font-bold text-white">
              1
            </button>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600">
              2
            </button>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
