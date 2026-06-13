import { useEffect } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export interface InviteCandidate {
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
  onPerformSearch: (value: string) => void
  candidates: InviteCandidate[]
  isSearching?: boolean
  selectedCandidateId: string | null
  onSelectCandidate: (candidate: InviteCandidate) => void
  roleLabel: string
  onClose: () => void
  onSendInvite: () => void
}

export default function InviteMembersModal({
  isOpen,
  search,
  onSearchChange,
  onPerformSearch,
  candidates,
  isSearching = false,
  selectedCandidateId,
  onSelectCandidate,
  roleLabel,
  onClose,
  onSendInvite,
}: InviteMembersModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-[560px] max-h-[90vh] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col rounded-3xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">Invite Members</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[11px] text-slate-400">Add people to collaborate</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Search */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Search User
            </label>
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2.5 bg-white focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyUp={(e) => {
                    if (e.key === 'Enter')
                        onPerformSearch(search);
                }}
                placeholder="Enter username or email..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Search Results */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Search Results
            </label>
            <div className="space-y-2">
              {isSearching ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  Searching users...
                </p>
              ) : candidates.length > 0 ? (
                candidates.map(candidate => {
                  const isSelected = candidate.id === selectedCandidateId

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => onSelectCandidate(candidate)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${isSelected ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
                          {candidate.initials}
                        </span>
                        <div>
                          <span className="block text-sm font-semibold text-slate-900">{candidate.name}</span>
                          <span className="block text-xs text-slate-500">
                            {candidate.username} • {candidate.email}
                          </span>
                        </div>
                      </div>
                      {isSelected ? <Check className="w-4 h-4 text-cyan-600" /> : null}
                    </button>
                  )
                })
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  No users found.
                </p>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Role
            </label>
            <button
              type="button"
              className="flex w-full items-center justify-between border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <span>{roleLabel}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-body text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSendInvite}
            className="px-4 py-2 font-body text-sm font-bold text-white bg-cyan-600 rounded-lg transition-all hover:-translate-y-0.5 hover:bg-cyan-700 shadow-[0_4px_14px_rgba(8,145,178,0.2)] hover:shadow-[0_6px_20px_rgba(8,145,178,0.3)]"
          >
            Send Invite
          </button>
        </div>
      </div>
    </div>
  )
}
