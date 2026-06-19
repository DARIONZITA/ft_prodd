import { Mail, Check, X, Loader2 } from 'lucide-react'
import {
  useMyInvitationsQuery,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation
} from '../api/workspace'

export default function InvitationsPage() {
  const { data: invitationsResponse, isLoading, refetch } = useMyInvitationsQuery()
  const acceptMutation = useAcceptInvitationMutation()
  const declineMutation = useDeclineInvitationMutation()

  const invitations = invitationsResponse?.success ? invitationsResponse.data : []

  const handleAccept = async (workspaceId: number) => {
    try {
      await acceptMutation.mutateAsync(workspaceId)
      refetch()
    } catch (err) {
      console.error('Failed to accept invitation:', err)
    }
  }

  const handleDecline = async (workspaceId: number) => {
    try {
      await declineMutation.mutateAsync(workspaceId)
      refetch()
    } catch (err) {
      console.error('Failed to decline invitation:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-cyan-600" size={32} />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-full overflow-y-auto bg-slate-50 text-slate-700">
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-slate-900">Workspace Invitations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage invitations to collaborate on different workspaces.
          </p>
        </div>

        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
              <Mail size={28} />
            </span>
            <h3 className="font-display text-lg font-bold text-slate-900">No invitations found</h3>
            <p className="font-body text-slate-500 mt-2 max-w-sm text-sm">
              You don't have any pending workspace invitations right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-1">
            {invitations.map((inv) => {
              const isProcessing =
                (acceptMutation.isPending && acceptMutation.variables === inv.workspaceId) ||
                (declineMutation.isPending && declineMutation.variables === inv.workspaceId)

              return (
                <div
                  key={inv.workspaceId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm gap-4 transition-all duration-200 hover:shadow-md hover:border-slate-300"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display text-lg font-bold text-slate-900 truncate">
                        {inv.workspace.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100">
                        {inv.invitedRole}
                      </span>
                    </div>

                    {inv.workspace.description && (
                      <p className="font-body text-slate-500 text-sm mt-1.5 line-clamp-2">
                        {inv.workspace.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-body">
                      {inv.invitedBy && (
                        <div className="flex items-center gap-1.5">
                          {inv.invitedBy.avatarUrl ? (
                            <img
                              src={inv.invitedBy.avatarUrl}
                              alt={inv.invitedBy.username}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-[8px]">
                              {inv.invitedBy.username[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <span>
                            Invited by <strong className="text-slate-600 font-semibold">{inv.invitedBy.username}</strong>
                          </span>
                        </div>
                      )}
                      <span>
                        Sent {new Date(inv.invitedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDecline(inv.workspaceId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 text-sm font-semibold rounded-xl cursor-pointer transition-colors duration-150"
                    >
                      <X size={15} />
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAccept(inv.workspaceId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white text-sm font-semibold rounded-xl shadow-sm shadow-cyan-600/10 cursor-pointer transition-colors duration-150"
                    >
                      {isProcessing ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                      Accept
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
