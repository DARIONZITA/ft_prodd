import { useState } from 'react'
import { X, Key, Copy, Download, Trash2, AlertTriangle, Check, Loader2 } from 'lucide-react'
import {
  useListApiKeysQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
  type ApiKeyItem
} from '../../api/keys'
import { getApiErrorMessage } from '../../api/axios'

interface ApiKeyManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ApiKeyManagerModal({ isOpen, onClose }: ApiKeyManagerModalProps) {
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<{ key: string; name: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Query & Mutations
  const { data: keysData, isLoading: isLoadingKeys, error: loadError, refetch } = useListApiKeysQuery({
    enabled: isOpen
  })
  
  const createMutation = useCreateApiKeyMutation({
    onSuccess: (data) => {
      setGeneratedKey({ key: data.data.key, name: data.data.name })
      setName('')
      setErrorMessage(null)
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error))
    }
  })

  const deleteMutation = useDeleteApiKeyMutation({
    onSuccess: () => {
      setErrorMessage(null)
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error))
    }
  })

  if (!isOpen) return null

  const keys: ApiKeyItem[] = keysData?.success ? keysData.data : []
  const hasReachedMax = keys.length >= 3

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('Key name is required')
      return
    }
    setErrorMessage(null)
    createMutation.mutate(name.trim())
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to revoke this API key? Applications using this key will immediately lose access.')) {
      deleteMutation.mutate(id)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const downloadKey = (key: string, keyName: string) => {
    const element = document.createElement('a')
    const file = new Blob([key], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${keyName.replace(/\s+/g, '_')}_apikey.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleClose = () => {
    setGeneratedKey(null)
    setErrorMessage(null)
    setName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div onClick={handleClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-[520px] max-h-[90vh] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col rounded-3xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900">Manage API Keys</h2>
              <p className="font-body text-xs text-slate-500 mt-1">Authenticate external tools with secure tokens (Max 3 keys).</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Key Generation Success View */}
          {generatedKey ? (
            <div className="space-y-4 p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white flex-shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-emerald-950">API Key Successfully Created!</h3>
                  <p className="font-body text-xs text-emerald-800 mt-1">
                    Copy or download your key now. For your security, this key <strong>will never be shown again</strong>.
                  </p>
                </div>
              </div>

              {/* Key Box */}
              <div className="mt-4 flex items-center justify-between gap-3 p-3 bg-white border border-emerald-200 rounded-xl font-mono text-xs text-slate-800 select-all overflow-x-auto">
                <span className="whitespace-nowrap break-all pr-2">{generatedKey.key}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedKey.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex-shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-sans">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="font-sans">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Downloader and Confirmation Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => downloadKey(generatedKey.key, generatedKey.name)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download key as .txt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedKey(null)
                    refetch()
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-[0_4px_14px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)]"
                >
                  I have saved this key
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Form to create key */}
              <form onSubmit={handleCreate} className="space-y-3">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Generate New Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. CI/CD Deployment Server"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={hasReachedMax || createMutation.isPending}
                    className="flex-1 font-body text-sm border font-medium border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 placeholder-slate-400 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={hasReachedMax || createMutation.isPending || !name.trim()}
                    className="px-4 py-2 font-body text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-all shadow-[0_4px_12px_rgba(8,145,178,0.2)] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center gap-1.5"
                  >
                    {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Generate
                  </button>
                </div>
                {hasReachedMax && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    You have reached the maximum allowance of 3 API keys.
                  </p>
                )}
              </form>

              {/* Active Keys List */}
              <div className="space-y-3">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Active Keys ({keys.length}/3)
                </label>

                {isLoadingKeys ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                    <span className="text-xs">Loading keys...</span>
                  </div>
                ) : loadError ? (
                  <div className="text-center py-6 text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl">
                    Failed to load API keys. Please try again.
                  </div>
                ) : keys.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-sm font-medium text-slate-400">No API keys created yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Generate a key above to access our developer API.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                    {keys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 pr-3">
                          <p className="text-sm font-bold text-slate-800 truncate" title={key.name}>
                            {key.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400 mt-1">
                            Created: {new Date(key.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(key.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 cursor-pointer disabled:opacity-50"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 font-body text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
