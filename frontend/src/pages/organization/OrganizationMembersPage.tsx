import { EllipsisVertical, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import InviteMembersModal from './InviteMembersModal'

interface WorkspaceMembersContext {
  id: string | number
  name: string
}

interface OrganizationMembersPageProps {
  workspace: WorkspaceMembersContext
  onBackToSettings?: () => void
}

type MemberRole = 'Owner' | 'Admin' | 'Member' | 'Guest'

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

//mockdata
const initialMembers: MemberRow[] = [
  {
    id: '1',
    name: 'John Doe',
    username: '@johndoe',
    initials: 'JD',
    role: 'Owner',
    joinedDate: 'Jan 12, 2025',
    editable: false,
    accent: 'bg-indigo-500',
  },
  {
    id: '2',
    name: 'Ana Silva',
    username: '@ana.silva',
    initials: 'AS',
    role: 'Admin',
    joinedDate: 'Jan 14, 2025',
    editable: true,
    accent: 'bg-cyan-500',
  },
  {
    id: '3',
    name: 'Carlos Manuel',
    username: '@carlosm',
    initials: 'CM',
    role: 'Member',
    joinedDate: 'Feb 02, 2025',
    editable: true,
    accent: 'bg-teal-500',
  },
  {
    id: '4',
    name: 'Guest User',
    username: '@guest.01',
    initials: 'G',
    role: 'Guest',
    joinedDate: 'Feb 10, 2025',
    editable: true,
    accent: 'bg-slate-300 text-slate-600',
  },
]

const roleStyles: Record<MemberRole, string> = {
  Owner: 'border-amber-200 bg-amber-50 text-amber-700',
  Admin: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  Member: 'border-slate-200 bg-slate-100 text-slate-600',
  Guest: 'border-slate-200 bg-white text-slate-500',
}

export default function OrganizationMembersPage({ workspace, onBackToSettings }: OrganizationMembersPageProps) {
  const [members, setMembers] = useState<MemberRow[]>(initialMembers)
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return members
    }

    return members.filter(member => {
      return member.name.toLowerCase().includes(normalized) || member.username.toLowerCase().includes(normalized)
    })
  }, [members, query])

  const handleSendInvite = () => {
    const exists = members.some(member => member.username === '@ricardo_g')
    if (!exists) {
      setMembers(current => [
        ...current,
        {
          id: String(Date.now()),
          name: 'Ricardo Gomes',
          username: '@ricardo_g',
          initials: 'RG',
          role: 'Member',
          joinedDate: 'Mar 22, 2026',
          editable: true,
          accent: 'bg-cyan-500',
        },
      ])
    }
    setInviteOpen(false)
  }

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

        <div className="mb-6 max-w-[420px]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search members..."
              className="w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_0.8fr] border-b border-slate-200 bg-slate-50 px-8 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
            <span>User</span>
            <span>Role</span>
            <span>Joined Date</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredMembers.map(member => (
            <div key={member.id} className="grid grid-cols-[2fr_1.2fr_1.2fr_0.8fr] items-center border-b border-slate-100 px-8 py-5 last:border-b-0">
              <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${member.accent}`}>
                  {member.initials}
                </span>
                <span>
                  <span className="block text-2xl font-semibold text-slate-900">{member.name}</span>
                  <span className="block text-xl text-slate-500">{member.username}</span>
                </span>
              </div>

              <div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${roleStyles[member.role]}`}>
                  {member.role}
                </span>
              </div>

              <p className="text-xl text-slate-500">{member.joinedDate}</p>

              <div className="flex justify-end">
                {member.editable ? (
                  <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <EllipsisVertical size={20} />
                  </button>
                ) : (
                  <span className="text-base italic text-slate-400">Cannot edit owner</span>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>

      <InviteMembersModal
        isOpen={inviteOpen}
        search={inviteSearch}
        onSearchChange={setInviteSearch}
        selectedCandidate={{
          id: 'candidate-1',
          name: 'Ricardo Gomes',
          username: '@ricardo_g',
          email: 'ricardo@example.com',
          initials: 'RG',
        }}
        roleLabel="Member (Can create & edit tasks)"
        onClose={() => setInviteOpen(false)}
        onSendInvite={handleSendInvite}
      />
    </div>
  )
}
