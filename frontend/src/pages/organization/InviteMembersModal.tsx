import { Check, ChevronDown, Search, X } from 'lucide-react'

interface InviteCandidate {
  id: string
  name: string
  username: string
  email: string
  initials: string
}

interface InviteMembersModalProps {
  isOpen: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedCandidate: InviteCandidate
  roleLabel: string
  onClose: () => void
  onSendInvite: () => void
}

export default function InviteMembersModal({
  isOpen,
  search,
  onSearchChange,
  selectedCandidate,
  roleLabel,
  onClose,
  onSendInvite,
}: InviteMembersModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-[740px] overflow-y-auto rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Invite Members</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="space-y-5 bg-slate-50 px-6 py-5">
          <p className="text-base text-slate-500">Invite people to your workspace to collaborate on projects.</p>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Search User</label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={event => onSearchChange(event.target.value)}
                placeholder="Enter username or email..."
                className="w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Search Results</label>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500 text-base font-bold text-slate-900">
                  {selectedCandidate.initials}
                </span>
                <span>
                  <span className="block text-xl font-semibold text-slate-900">{selectedCandidate.name}</span>
                  <span className="block text-sm text-slate-500">
                    {selectedCandidate.username} • {selectedCandidate.email}
                  </span>
                </span>
              </div>
              <Check size={20} className="text-cyan-600" />
            </button>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Role</label>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-700"
            >
              <span>{roleLabel}</span>
              <ChevronDown size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-base font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-200/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSendInvite}
            className="rounded-xl bg-cyan-600 px-6 py-2 text-lg font-bold text-white shadow-[0_8px_18px_rgba(8,145,178,0.22)] transition-colors duration-150 hover:bg-cyan-700"
          >
            Send Invite
          </button>
        </footer>
      </div>
    </div>
  )
}
