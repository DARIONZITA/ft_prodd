import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (data: { name: string; description: string; visibility: 'private' | 'team'; template: string }) => void
}

export default function CreateOrganizationModal({ isOpen, onClose, onCreate }: CreateOrganizationModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

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

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setName('')
    setDescription('')
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCreate?.({ name: name.trim(), description: description.trim(), visibility: 'private', template: 'kanban' })
    onClose()
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
            <h2 className="font-display font-bold text-xl text-slate-900">Create Organization</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[11px] text-slate-400">Set up your workspace</span>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corporation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full font-body text-sm border font-medium border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 placeholder-slate-400 transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Description <span className="text-slate-300 font-normal normal-case font-body">(optional)</span>
            </label>
            <textarea
              placeholder="What is this organization about?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full font-body text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-700 placeholder-slate-400 resize-none leading-relaxed transition-all"
            />
          </div>
        </form>

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
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 font-body text-sm font-bold text-white bg-cyan-600 rounded-lg transition-all hover:-translate-y-0.5 hover:bg-cyan-700 shadow-[0_4px_14px_rgba(8,145,178,0.2)] hover:shadow-[0_6px_20px_rgba(8,145,178,0.3)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0 disabled:shadow-none"
          >
            Create Organization
          </button>
        </div>
      </div>
    </div>
  )
}