import { Check, Circle, Dot, ArrowLeft, ScrollText } from 'lucide-react'

interface ActivityItem {
  title: string
  tag: string
  meta: string
  status: 'done' | 'todo' | 'review'
  assignees: Array<{ initials: string; accent: string }>
}

interface WorkspaceLogsPageProps {
  workspaceName: string
  onBack: () => void
}

// Mock data - same as OrganizationHomePage
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
  {
    title: 'Database schema design for user profiles',
    tag: 'database',
    meta: 'Updated 5h ago',
    status: 'done',
    assignees: [{ initials: 'DN', accent: 'bg-purple-500' }],
  },
  {
    title: 'Implement JWT authentication middleware',
    tag: 'backend',
    meta: 'In progress',
    status: 'todo',
    assignees: [
      { initials: 'JB', accent: 'bg-orange-500' },
      { initials: 'CG', accent: 'bg-pink-500' },
    ],
  },
]

export default function WorkspaceLogsPage({ workspaceName, onBack }: WorkspaceLogsPageProps) {
  return (
    <div className="relative flex-1 h-full overflow-y-auto bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_45%)]" />
      <div className="relative mx-auto max-w-[1240px] px-6 py-8 lg:px-8 lg:py-9">
        {/* Header */}
        <header className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors duration-150"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600">
                <ScrollText size={20} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">Workspace Logs</h1>
                <p className="text-sm text-slate-500">{workspaceName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Activity List */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900">Recent Activity</h2>
            <span className="font-mono text-xs text-slate-400 bg-slate-200 rounded-full px-3 py-1">
              {activities.length} entries
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            {activities.map((activity, index) => (
              <div 
                key={activity.title} 
                className={`flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-slate-50/80 ${index !== 0 ? 'border-t border-slate-200' : ''}`}
              >
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
        </section>
      </div>
    </div>
  )
}
