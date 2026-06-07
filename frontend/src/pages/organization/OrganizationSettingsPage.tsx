import { ChevronLeft } from 'lucide-react'

interface WorkspaceSettingsContext {
  id: string | number
  name: string
  description?: string
}

interface OrganizationSettingsPageProps {
  workspace: WorkspaceSettingsContext
  onBack?: () => void
  onOpenMembers?: () => void
  onOpenAnalytics?: () => void
}

export default function OrganizationSettingsPage({ workspace, onBack, onOpenMembers, onOpenAnalytics }: OrganizationSettingsPageProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[980px] px-6 py-8 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <button
            type="button"
            onClick={onOpenAnalytics}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(8,145,178,0.2)] hover:bg-cyan-700"
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={onOpenMembers}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(8,145,178,0.2)] hover:bg-cyan-700"
          >
            Members
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-bold text-slate-900">General Information</h2>
            <p className="mt-1 text-sm text-slate-500">Update your organization's public details.</p>
          </div>

          <div className="space-y-5 px-6 py-5">
            
            <div>
              <label htmlFor="settings-name" className="mb-1 block text-sm font-semibold text-slate-700">
                Organization Name
              </label>
              <input
                id="settings-name"
                defaultValue={workspace.name}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              />
              <p className="mt-1 text-xs text-slate-400">Visible to all members and on invitations.</p>
            </div>

            <div>
              <label htmlFor="settings-description" className="mb-1 block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                id="settings-description"
                defaultValue={workspace.description || 'The first tuition-free coding school in Angola.'}
                className="min-h-[90px] w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(8,145,178,0.2)] hover:bg-cyan-700"
            >
              Save Changes
            </button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 bg-red-50/50 px-6 py-5">
            <h3 className="text-3xl font-bold text-red-700">Danger Zone</h3>
            <p className="mt-1 text-sm text-red-400">Irreversible actions for this organization.</p>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">Delete Organization</p>
              <p className="mt-1 max-w-[580px] text-sm text-slate-500">
                Once you delete an organization, there is no going back. All boards, tasks, and messages will be permanently removed.
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              Delete Organization
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
