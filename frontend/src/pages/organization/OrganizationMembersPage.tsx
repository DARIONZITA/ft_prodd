import { EllipsisVertical, Plus, Search, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import InviteMembersModal, { type InviteCandidate } from './InviteMembersModal'
import {
  useCreateWorkspaceMemberMutation,
  useDeleteWorkspaceMemberMutation,
  useWorkspaceMembersQuery,
  useUpdateWorkspaceMemberRoleMutation,
  useWorkspaceJoinRequestsQuery,
  useAcceptJoinRequestMutation,
  useDeclineJoinRequestMutation,
  type WorkspaceMember,
  type WorkspaceRole,
  type JoinRequest,
} from '../../api/workspace'
import { useUsersQuery } from '../../api/user'

interface WorkspaceMembersContext {
  id: number
  name: string
}

interface OrganizationMembersPageProps {
  workspace: WorkspaceMembersContext
  onBackToSettings?: () => void
}

type MemberRole = 'Admin' | 'Member' | 'Guest'

interface MemberRow {
  id: string
  name: string
  username: string
  initials: string
  role: MemberRole
  joinedDate: string
  editable: boolean
  accent: string
}

const roleStyles: Record<MemberRole, string> = {
  Admin: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  Member: 'border-slate-200 bg-slate-100 text-slate-600',
  Guest: 'border-slate-200 bg-white text-slate-500',
}

export default function OrganizationMembersPage({ workspace, onBackToSettings }: OrganizationMembersPageProps) {
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const [performSearchQuery, setPerformSearchQuery] = useState('')
  const [actionMember, setActionMember] = useState<MemberRow | null>(null)
  const [draftRole, setDraftRole] = useState<MemberRole>('Member')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members')
  const joinRequestsQuery = useWorkspaceJoinRequestsQuery(workspace.id, { refetchOnMount: false })
  const joinRequests = joinRequestsQuery.data?.success ? joinRequestsQuery.data.data : []
  const acceptRequestMutation = useAcceptJoinRequestMutation()
  const declineRequestMutation = useDeclineJoinRequestMutation()

  const membersQuery = useWorkspaceMembersQuery(workspace.id, { refetchOnMount: false })
  const usersQuery = useUsersQuery(
    { search: performSearchQuery, take: 10 },
    { refetchOnMount: false, enabled: performSearchQuery.trim().length > 0 }
  )
 
  const createMemberMutation = useCreateWorkspaceMemberMutation()
  const updateMemberRoleMutation = useUpdateWorkspaceMemberRoleMutation()
  const deleteMemberMutation = useDeleteWorkspaceMemberMutation()

  const toWorkspaceRole = (role: MemberRole): WorkspaceRole => {
    switch (role) {
      case 'Admin':
        return 'admin'
      case 'Guest':
        return 'guest'
      default:
        return 'member'
    }
  }

  const workspaceMembers = (membersQuery.data ?? []) as WorkspaceMember[]

  const members = useMemo<MemberRow[]>(() => {
    return workspaceMembers.map((member: WorkspaceMember) => {
      const role = toMemberRole(member.role)
      const username = member.user?.username ?? `user-${member.userId}`

      return {
        id: String(member.userId),
        name: username,
        username: username,
        initials: getInitials(member.user?.username ?? `U${member.userId}`),
        role,
        joinedDate: member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—',
        editable: true,
        accent: 'bg-cyan-500',
      }
    })
  }, [workspaceMembers])

  const inviteCandidates = useMemo<InviteCandidate[]>(() => {
    const memberIds = new Set(workspaceMembers.map((member: WorkspaceMember) => String(member.userId)))
    const requestingIds = new Set(joinRequests.map((req: JoinRequest) => String(req.userId)))
    const users = usersQuery.data?.data?.users ?? []
    const nextCandidates: InviteCandidate[] = []

    for (const user of users) {
      if (memberIds.has(String(user.id)) || requestingIds.has(String(user.id))) {
        continue
      }

      nextCandidates.push({
        id: String(user.id),
        name: user.username,
        username: user.username,
        email: user.email,
        initials: getInitials(user.username),
      })
    }

    return nextCandidates
  }, [usersQuery.data, workspaceMembers, joinRequests])

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return members
    }

    return members.filter((member: MemberRow) => {
      return member.name.toLowerCase().includes(normalized) || member.username.toLowerCase().includes(normalized)
    })
  }, [members, query])

  useEffect(() => {
    if (!inviteOpen) {
      return
    }

    setInviteSearch('')
    setPerformSearchQuery('')
    setSelectedCandidateId(null)
  }, [inviteOpen])

  useEffect(() => {
    if (!inviteOpen || inviteCandidates.length === 0) {
      return
    }

    setSelectedCandidateId(current =>
      current && inviteCandidates.some(candidate => candidate.id === current)
        ? current
        : inviteCandidates[0].id
    )
  }, [inviteCandidates, inviteOpen])

  const selectedCandidate = useMemo(
    () => inviteCandidates.find((candidate: InviteCandidate) => candidate.id === selectedCandidateId) ?? inviteCandidates[0] ?? null,
    [inviteCandidates, selectedCandidateId]
  )

  const handlePerformSearch = (searchValue: string) => {
    setPerformSearchQuery(searchValue)
  }

  const handleSendInvite = async () => {
    if (!selectedCandidate) {
      return
    }

    try {
      await createMemberMutation.mutateAsync({
        id: workspace.id,
        form: {
          userId: Number(selectedCandidate.id),
          role: 'member',
        },
      })
      setInviteOpen(false)
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || ''
      if (message.includes('already a member') || message.includes('pending invitation')) {
        await membersQuery.refetch()
        await joinRequestsQuery.refetch()
        setInviteOpen(false)
      } else {
        alert(message || 'Failed to send invite')
      }
    }
  }

  const openMemberActions = (member: MemberRow) => {
    setActionMember(member)
    setDraftRole(member.role)
  }

  const closeMemberActions = () => {
    setActionMember(null)
  }

  const handleSaveRole = async () => {
    if (!actionMember) {
      return
    }

    await updateMemberRoleMutation.mutateAsync({
      id: workspace.id,
      userId: actionMember.id,
      form: { role: toWorkspaceRole(draftRole) },
    })
    closeMemberActions()
  }

  const handleDeleteMember = async () => {
    if (!actionMember) {
      return
    }

    const confirmed = window.confirm(`Remove ${actionMember.name} from this workspace?`)
    if (!confirmed) {
      return
    }

    await deleteMemberMutation.mutateAsync({
      id: workspace.id,
      userId: actionMember.id,
    })
    closeMemberActions()
  }

  const handleInviteSelect = (candidate: InviteCandidate) => {
    setSelectedCandidateId(candidate.id)
  }

  const isEmpty = members.length === 0
  const isFilteredEmpty = !isEmpty && filteredMembers.length === 0

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1380px] px-6 py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Members</h1>
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-200 px-2.5 text-base font-bold text-slate-600">
              {members.length}
            </span>
            <span className="text-sm text-slate-500">{workspace.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSettings}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-2.5 text-xl font-bold text-white shadow-[0_10px_24px_rgba(8,145,178,0.24)] hover:bg-cyan-700"
            >
              <Plus size={18} /> Invite Member
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200 flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Active Members ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Join Requests ({joinRequests.length})
          </button>
        </div>

        {activeTab === 'members' && (
          <>
            <div className="mb-6 max-w-[420px]">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3">
                <Search size={18} className="text-slate-400" />
                <input
                  value={query}
                  onChange={(event: { target: { value: string } }) => setQuery(event.target.value)}
                  placeholder="Search members..."
                  className="w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {isEmpty || isFilteredEmpty ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-10 py-14 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-400">
                  0
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  {isEmpty ? 'No members yet' : 'No members found'}
                </h2>
                <p className="mt-2 font-body text-sm text-slate-500">
                  {isEmpty
                    ? 'Invite your first teammate to get started.'
                    : 'Try another search term or clear the filter.'}
                </p>
                {isEmpty && (
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(8,145,178,0.24)] hover:bg-cyan-700"
                  >
                    <Plus size={16} /> Invite Member
                  </button>
                )}
              </div>
            ) : (
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-[2fr_1.2fr_1.2fr_0.8fr] border-b border-slate-200 bg-slate-50 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  <span>User</span>
                  <span>Role</span>
                  <span>Joined Date</span>
                  <span className="text-right">Actions</span>
                </div>

                {filteredMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
                      <Search size={28} />
                    </span>
                    <h3 className="font-display text-xl font-bold text-slate-900">No members found</h3>
                    <p className="font-body text-slate-500 mt-2 max-w-sm">
                      We couldn't find any members matching your search. Try different keywords or invite a new member.
                    </p>
                    <button
                      onClick={() => setQuery('')}
                      className="mt-6 font-body text-sm font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  filteredMembers.map(member => (
                  <div key={member.id} className="grid grid-cols-[2fr_1.2fr_1.2fr_0.8fr] items-center border-b border-slate-100 px-8 py-5 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold text-white ${member.accent}`}>
                        {member.initials}
                      </span>
                      <span>
                        <span className="block font-display text-lg font-bold text-slate-900">{member.name}</span>
                        <span className="block font-body text-sm text-slate-500">{member.username}</span>
                      </span>
                    </div>

                    <div>
                      <span className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${roleStyles[member.role]}`}>
                        {member.role}
                      </span>
                    </div>

                    <p className="font-body text-sm text-slate-500">{member.joinedDate}</p>

                    <div className="flex justify-end">
                      {member.editable ? (
                        <button
                          type="button"
                          onClick={() => openMemberActions(member)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <EllipsisVertical size={20} />
                        </button>
                      ) : (
                        <span className="font-body text-sm italic text-slate-400">Cannot edit owner</span>
                      )}
                    </div>
                  </div>
                )))}
              </section>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <div>
            {joinRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-10 py-14 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-400">
                  0
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  No join requests
                </h2>
                <p className="mt-2 font-body text-sm text-slate-500">
                  There are no pending requests to join this workspace.
                </p>
              </div>
            ) : (
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-[2fr_1.2fr_1.2fr] border-b border-slate-200 bg-slate-50 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  <span>User</span>
                  <span>Requested Date</span>
                  <span className="text-right">Actions</span>
                </div>

                {joinRequests.map(req => {
                  const initials = req.user.username.trim()[0]?.toUpperCase() ?? '?'
                  const isProcessing =
                    (acceptRequestMutation.isPending && acceptRequestMutation.variables?.userId === req.userId) ||
                    (declineRequestMutation.isPending && declineRequestMutation.variables?.userId === req.userId)

                  return (
                    <div key={req.userId} className="grid grid-cols-[2fr_1.2fr_1.2fr] items-center border-b border-slate-100 px-8 py-5 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold text-white bg-cyan-600">
                          {initials}
                        </span>
                        <span>
                          <span className="block font-display text-lg font-bold text-slate-900">{req.user.username}</span>
                          <span className="block font-body text-sm text-slate-500">{req.user.email}</span>
                        </span>
                      </div>

                      <p className="font-body text-sm text-slate-500">
                        {new Date(req.requestedAt).toLocaleDateString()}
                      </p>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => declineRequestMutation.mutate({ workspaceId: workspace.id, userId: req.userId })}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => acceptRequestMutation.mutate({ workspaceId: workspace.id, userId: req.userId })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {isProcessing && <Loader2 size={14} className="animate-spin" />}
                          Accept
                        </button>
                      </div>
                    </div>
                  )
                })}
              </section>
            )}
          </div>
        )}
      </div>

      {actionMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" onClick={closeMemberActions}>
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-4">
              <p className="text-xs font-mono uppercase tracking-[0.25em] text-slate-400">Member Actions</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{actionMember.name}</h3>
              <p className="text-sm text-slate-500">{actionMember.username}</p>
            </div>

            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="member-role-select">
              Edit role
            </label>
            <select
              id="member-role-select"
              value={draftRole}
              onChange={(event: { target: { value: string } }) => setDraftRole(event.target.value as MemberRole)}
              className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            >
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="Guest">Guest</option>
            </select>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDeleteMember}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Delete member
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeMemberActions}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
                >
                  Save role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <InviteMembersModal
        isOpen={inviteOpen}
        search={inviteSearch}
        onSearchChange={setInviteSearch}
        onPerformSearch={handlePerformSearch}
        candidates={inviteCandidates}
        isSearching={usersQuery.isFetching}
        selectedCandidateId={selectedCandidate?.id ?? null}
        onSelectCandidate={handleInviteSelect}
        roleLabel="Member (Can create & edit tasks)"
        onClose={() => setInviteOpen(false)}
        onSendInvite={handleSendInvite}
      />
    </div>
  )
}

function toMemberRole(role: WorkspaceRole): MemberRole {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'guest':
      return 'Guest'
    default:
      return 'Member'
  }
}

function getInitials(value: string): string {
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '??'
  }

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}
