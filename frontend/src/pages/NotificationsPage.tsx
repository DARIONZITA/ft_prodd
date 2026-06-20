 import { useMemo, useState } from 'react'
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react'

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

import { useNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation, type ApiNotification } from '../api/notifications'
import { formatRelativeTime } from '../api/friends'

const getGroup = (createdAtStr: string): 'today' | 'yesterday' | 'older' => {
  const date = new Date(createdAtStr)
  const today = new Date()

  // Reset time to compare only dates
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const diffTime = dToday.getTime() - dDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return 'today'
  if (diffDays < 2) return 'yesterday'
  return 'older'
}

const mapNotificationRow = (n: ApiNotification): NotificationRow => {
  let mappedType: NotificationType = 'task'
  if (n.type === 'mention') mappedType = 'mention'
  else if (n.type === 'friendship' || n.type === 'invite') mappedType = 'friend'
  else if (n.type === 'task' || n.type === 'workspace' || n.type === 'comment') mappedType = 'task'
  else mappedType = 'badge'

  return {
    id: String(n.id),
    title: n.message,
    meta: formatRelativeTime(n.createdAt),
    type: mappedType,
    unread: !n.isRead,
    group: getGroup(n.createdAt),
  }
}

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

  const { data: notificationsData } = useNotificationsQuery({ take: 100 })
  const markReadMutation = useMarkNotificationReadMutation()
  const markAllReadMutation = useMarkAllNotificationsReadMutation()

  const notifications = useMemo(() => {
    if (!notificationsData?.success) return []
    return notificationsData.data.notifications.map(mapNotificationRow)
  }, [notificationsData])

  const unreadCount = useMemo(() => notifications.filter(item => item.unread).length, [notifications])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') {
      return notifications
    }
    return notifications.filter(item => item.type === activeFilter)
  }, [activeFilter, notifications])

  const markAllRead = () => {
    markAllReadMutation.mutate()
  }

  const markRead = (id: string) => {
    markReadMutation.mutate(Number(id))
  }

  return (
    <div className="flex-1 min-h-full overflow-y-auto bg-slate-50 text-slate-700">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">All Notifications</h1>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{unreadCount} unread</span> · {notifications.length} total
            </p>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100 self-start sm:self-auto"
          >
            <CheckCheck size={15} /> Mark all as read
          </button>
        </div>

        <div className="mb-5 -mx-4 sm:mx-0 overflow-x-auto scrollbar-none">
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 mx-4 sm:mx-0">
            {filters.map(filter => {
              const count = filter.id === 'all' ? notifications.length : notifications.filter(item => item.type === filter.id).length
              const active = activeFilter === filter.id
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {filter.label} <span className="ml-1 font-mono text-xs opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
                <Bell size={28} />
              </span>
              <h3 className="font-display text-lg font-bold text-slate-900">No notifications found</h3>
              <p className="font-body text-slate-500 mt-2 max-w-sm text-sm">
                You're all caught up! There are no notifications matching your current filter.
              </p>
            </div>
          ) : (
            (['today', 'yesterday', 'older'] as const).map(group => {
              const rows = filtered.filter(item => item.group === group)
              if (rows.length === 0) {
                return null
              }

              return (
                <div key={group}>
                  <div className="border-b border-slate-100 bg-slate-50 px-4 sm:px-5 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{groupLabels[group]}</p>
                  </div>

                  {rows.map(row => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => markRead(row.id)}
                      className={`group flex w-full gap-3 sm:gap-4 border-b border-slate-100 px-4 sm:px-5 py-3 sm:py-4 text-left last:border-b-0 ${
                        row.unread ? 'bg-cyan-50/60 hover:bg-cyan-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${typeChip[row.type]}`}>
                        {row.type.slice(0, 1).toUpperCase()}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm leading-snug ${row.unread ? 'text-slate-800' : 'text-slate-500'}`}>{row.title}</span>
                        {row.detail && <span className="mt-1 block text-xs italic text-slate-500">{row.detail}</span>}
                        <span className="mt-1.5 block font-mono text-[10px] text-slate-400">{row.meta}</span>
                      </span>

                      <span className="flex items-start gap-2 pt-1">
                        {row.unread && <span className="mt-0.5 h-2 w-2 rounded-full bg-cyan-500" />}
                      </span>
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {filtered.length > 0 && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-mono text-xs sm:text-sm text-slate-500">
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
        )}
      </div>
    </div>
  )
}
