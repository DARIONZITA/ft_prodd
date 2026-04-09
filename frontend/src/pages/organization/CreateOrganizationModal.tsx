import { useEffect, useState } from 'react'
import { Building2, Upload, X } from 'lucide-react'

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (data: { name: string; description: string; visibility: 'private' | 'team'; template: string }) => void
}

export default function CreateOrganizationModal({ isOpen, onClose, onCreate }: CreateOrganizationModalProps) {
  const [name, setName] = useState('42 Luanda')
  const [description, setDescription] = useState('Official workspace for the first cohort students.')

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

    setName('42 Luanda')
    setDescription('Official workspace for the first cohort students.')
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-sm"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-[20px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(2,6,23,0.36)]"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Organization</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="bg-slate-50 px-6 py-5">
          <div className="grid gap-5">
            <div>
              <p className="mb-2 text-lg font-semibold text-slate-700">Workspace Icon</p>
              <div className="flex items-center gap-4">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-200/70 text-slate-500">
                  <Building2 size={24} />
                </div>
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-base font-bold text-cyan-600 transition-colors duration-150 hover:text-cyan-700"
                  >
                    <Upload size={16} /> Upload Image
                  </button>
                  <p className="mt-1 text-sm text-slate-400">Recommended size: 256x256px. Max 2MB.</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="organization-name" className="mb-2 block text-lg font-semibold text-slate-700">
                Organization Name
              </label>
              <input
                id="organization-name"
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-lg text-slate-900 outline-none transition-colors duration-150 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="organization-description" className="mb-2 block text-lg font-semibold text-slate-700">
                Description <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <textarea
                id="organization-description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                className="min-h-[110px] w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 outline-none transition-colors duration-150 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-6 py-2 text-sm font-bold text-slate-700 transition-colors duration-150 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-xl bg-cyan-600 px-6 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,145,178,0.22)] transition-colors duration-150 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Create Organization
          </button>
        </footer>
      </form>
    </div>
  )
}