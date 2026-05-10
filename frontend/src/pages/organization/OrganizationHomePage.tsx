import { CalendarDays, Check, Circle, Dot } from 'lucide-react'

interface ActivityItem {
  title: string
  tag: string
  meta: string
  status: 'done' | 'todo' | 'review'
  assignees: Array<{ initials: string; accent: string }>
}

interface TeamMember {
  name: string
  role: string
  initials: string
  accent: string
  online: boolean
}

interface WorkspaceHomeContext {
  id: string | number
  name: string
  description?: string
  taskCount?: number
  completedThisWeek?: number
  pendingCount?: number
  memberCount?: number
  onlineCount?: number
}

interface OrganizationHomePageProps {
  workspace: WorkspaceHomeContext
  onCreateWorkspace?: () => void
  onOpenSettings?: () => void
  onOpenMembers?: () => void
  onOpenBoard?: () => void
}
//mockdata
const activities: ActivityItem[] = [
  {
    title: 'Set up React project with Vite + Tailwind CSS',
    tag: 'feature',
    meta: 'Updated 2h ago',
    status: 'done',
    assignees: [{ initials: 'JM', accent: 'bg-cyan-500' }],
  },
  {
    title: 'Implement drag and drop for Kanban columns',
    tag: 'feature',
    meta: 'Due Tomorrow',
    status: 'todo',
    assignees: [
      { initials: 'JM', accent: 'bg-cyan-500' },
      { initials: 'GA', accent: 'bg-indigo-500' },
    ],
  },
  {
    title: 'PR: WebSocket chat real-time message delivery',
    tag: 'review',
    meta: 'Waiting for feedback',
    status: 'review',
    assignees: [{ initials: 'AN', accent: 'bg-emerald-500' }],
  },
  {
    title: 'Login page with 42 Intra OAuth button',
    tag: 'feature',
    meta: 'Complete',
    status: 'done',
    assignees: [{ initials: 'GA', accent: 'bg-indigo-500' }],
  },
]

const team: TeamMember[] = [
  { name: 'Jose (You)', role: 'Tech Lead', initials: 'JM', accent: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)', online: true },
  { name: 'Gama', role: 'Admin', initials: 'GA', accent: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', online: true },
  { name: 'Andre', role: 'Developer', initials: 'AN', accent: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', online: true },
  { name: 'Maria', role: 'Designer', initials: 'MA', accent: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', online: false },
]

export default function OrganizationHomePage({ workspace, onOpenSettings, onOpenMembers, onOpenBoard }: OrganizationHomePageProps) {
  const taskCount = workspace.taskCount ?? 42
  const completedThisWeek = workspace.completedThisWeek ?? 24
  const pendingCount = workspace.pendingCount ?? Math.max(0, taskCount - completedThisWeek - 10)
  const memberCount = workspace.memberCount ?? 5

  return (
    <div className="relative flex-1 h-full overflow-y-auto bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_45%)]" />
      <div className="relative mx-auto max-w-[1240px] px-6 py-8 lg:px-8 lg:py-9">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 lg:text-[2.7rem]">{workspace.name}</h1>
            <p className="mt-2 text-base font-body text-slate-500 lg:text-xl">Welcome back, Jose. Here is what&apos;s happening in your workspace.</p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/90 px-5 py-2.5 text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
            <CalendarDays size={16} className="text-indigo-300" />
            <span className="font-mono text-xs text-slate-500">Feb 18, 2026</span>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-sm font-semibold text-cyan-700 transition-colors duration-150 hover:text-cyan-800"
            >
              Settings
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Total Tasks</p>
            <div className="mt-3 flex items-end gap-2.5">
              <span className="font-display text-4xl font-bold text-slate-900">{taskCount}</span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Pending</p>
            <div className="mt-3 flex items-end gap-2.5">
              <span className="font-display text-4xl font-bold text-slate-900">{pendingCount}</span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Completed This Week</p>
            <div className="mt-3 flex items-end gap-2.5">
              <span className="font-display text-4xl font-bold text-slate-900">{completedThisWeek}</span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Team Members</p>
            <div className="mt-3 flex items-end gap-2.5">
              <span className="font-display text-4xl font-bold text-slate-900">{memberCount}</span>
            </div>
          </article>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.85fr_0.95fr]">
          <article>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-slate-900">Recent Activity</h2>
              <button onClick={onOpenBoard} className="inline-flex items-center gap-2 rounded-xl border border-cyan-600 bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(8,145,178,0.28)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-[0_14px_28px_rgba(8,145,178,0.34)]">
                View Board <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              {activities.map((activity, index) => (
                <div key={activity.title} className={`flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-slate-50/80 ${index !== 0 ? 'border-t border-slate-200' : ''}`}>
                  <div className="flex h-10 w-10 items-center justify-center">
                    {activity.status === 'done' ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check size={15} />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 text-slate-300">
                        <Circle size={13} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold text-slate-900">{activity.title}</p>
                    <div className="mt-1 flex items-center gap-2 font-mono text-xs text-slate-400">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">{activity.tag}</span>
                      <Dot size={16} />
                      <span>{activity.meta}</span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {activity.assignees.map((assignee, assigneeIndex) => (
                      <span
                        key={`${activity.title}-${assignee.initials}`}
                        className={`-ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${assignee.accent} ${assigneeIndex === 0 ? 'ml-0' : ''}`}
                      >
                        {assignee.initials}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-slate-900">Team</h2>
              <button type="button" onClick={onOpenMembers} className="font-body text-sm font-semibold text-cyan-600 hover:text-cyan-700">
                Manage →
              </button>
            </div>

            <div className="space-y-3">
              {team.map(member => (
                <div key={member.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: member.accent }}>
                    {member.initials}
                  </span>

                  <div className="flex-1">
                    <p className="font-display text-sm font-bold text-slate-900">{member.name}</p>
                    <p className="font-mono text-xs text-slate-500">{member.role}</p>
                  </div>

                  <span className={`h-3 w-3 rounded-full ${member.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}