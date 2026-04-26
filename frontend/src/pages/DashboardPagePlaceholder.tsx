import { useMemo, useState } from 'react'
import Sidebar from '../components/SideBar'
import UserProfile from './profile/This'
import OtherUserProfile from './profile/Other'
import Friends, { MOCK_FRIENDS, MOCK_PENDING } from './profile/Friends'
import type { Friend, PendingRequest } from '../components/friend/Types'
import OrganizationHomePage from './organization/OrganizationHomePage'
import CreateOrganizationModal from './organization/CreateOrganizationModal'
import OrganizationSettingsPage from './organization/OrganizationSettingsPage.tsx'
import OrganizationMembersPage from './organization/OrganizationMembersPage.tsx'
import KanbanBoardPage from '../components/tasks/KanbanBoardPage.tsx'
import NotificationsPage from './NotificationsPage.tsx'

interface Workspace {
  id: string | number
  name: string
  description?: string
  taskCount?: number
  memberCount?: number
  onlineCount?: number
  sprintDaysLeft?: number
  healthScore?: number
}

interface User {
  name: string
  avatarUrl: string | null
  workspaces: Workspace[]
}

const MOCK_USER: User = {
  name: 'Edson',
  avatarUrl: null,
  workspaces: [
    {
      id: 1,
      name: 'ft_printf',
      description: 'Core C project workspace for the ft_printf implementation.',
      taskCount: 8,
      memberCount: 3,
      onlineCount: 2,
      sprintDaysLeft: 4,
      healthScore: 84,
    },
    {
      id: 2,
      name: 'get_next_line',
      description: 'A focused organization for line-by-line parsing and file I/O tasks.',
      taskCount: 11,
      memberCount: 4,
      onlineCount: 3,
      sprintDaysLeft: 6,
      healthScore: 90,
    },
    {
      id: 3,
      name: 'push_swap',
      description: 'Optimization-driven workspace for the push_swap algorithm challenge.',
      taskCount: 15,
      memberCount: 5,
      onlineCount: 3,
      sprintDaysLeft: 2,
      healthScore: 88,
    },
  ],
}

const MOCK_PROFILE = {
  name: 'Edson',
  bio: 'Full-stack developer at 42. Currently working on ft_transcendence. Love clean code and Unix philosophy.',
  avatarUrl: null,
  isOnline: true,
  stats: { tasksCompleted: 47, tasksAssigned: 23, friends: 13 },
  level: 5,
  xp: 850,
  xpRequired: 1000,
}

const MOCK_OTHER_USER = {
  name: 'alice_42',
  bio: 'Working on minishell and pipex. Interested in system programming and DevOps. Always happy to help with C projects!',
  avatarUrl: null,
  isOnline: false,
  lastSeen: 'Last seen 2 hours ago',
  isFriend: false,
  stats: { tasksCompleted: 34, tasksAssigned: 18, friends: 8 },
  level: 6,
  xp: 600,
  xpRequired: 1000,
}

// ─── View type ────────────────────────────────────────────────────────────────

type ActiveView =
  | 'dashboard'
  | 'profile'
  | 'notifications'
  | 'all-boards'
  | 'completed'
  | 'organization-settings'
  | 'organization-members'
  | `workspace-${string | number}`
  | `user-${string | number}`
  | 'kanbanBoard'

// ─── Placeholder ─────────────────────────────────────────────────────────────

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
      <p className="font-body text-sm text-slate-400">{title} — coming soon</p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPagePlaceholder() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [createOrganizationOpen, setCreateOrganizationOpen] = useState(false)
  const [user, setUser] = useState<User>(MOCK_USER)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | number>(MOCK_USER.workspaces[0]?.id ?? 0)

  // Friends state — in real app this comes from API
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS)
  const [pendingRequests, setPending] = useState<PendingRequest[]>(MOCK_PENDING)

  const currentWorkspace = useMemo(() => {
    const workspaceId = activeView.startsWith('workspace-')
      ? activeView.replace('workspace-', '')
      : selectedWorkspaceId

    return user.workspaces.find(workspace => String(workspace.id) === String(workspaceId)) ?? user.workspaces[0]
  }, [activeView, selectedWorkspaceId, user.workspaces])

  const handleNavigate = (view: string, payload?: string | number) => {
    setCreateOrganizationOpen(false)

    if (view === 'workspace' && payload != null) {
      setSelectedWorkspaceId(payload)
      setActiveView(`workspace-${payload}`)
      return
    }

    setActiveView(view as ActiveView)
  }

  // ── Friends modal handlers ───────────────────────────────────────────────
  const handleAccept = (id: string | number) => {
    const req = pendingRequests.find(r => r.id === id)
    if (req) {
      setFriends(f => [...f, { id: req.id, name: req.name, isOnline: false }])
      setPending(p => p.filter(r => r.id !== id))
    }
  }

  const handleDecline = (id: string | number) => {
    setPending(p => p.filter(r => r.id !== id))
  }

  const handleRemoveFriend = (id: string | number) => {
    setFriends(f => f.filter(fr => fr.id !== id))
  }

  const handleViewProfile = (id: string | number) => {
    setFriendsOpen(false)
    setActiveView(`user-${id}`)
  }

  const handleCreateOrganization = (data: { name: string; description: string; visibility: 'private' | 'team'; template: string }) => {
    const newWorkspaceId = Date.now()
    const newWorkspace: Workspace = {
      id: newWorkspaceId,
      name: data.name,
      description: data.description || 'New organization workspace',
      taskCount: 0,
      memberCount: 1,
      onlineCount: 1,
      sprintDaysLeft: 14,
      healthScore: 80,
    }

    setUser(currentUser => ({
      ...currentUser,
      workspaces: [newWorkspace, ...currentUser.workspaces],
    }))
    setSelectedWorkspaceId(newWorkspaceId)
    setActiveView(`workspace-${newWorkspaceId}`)
    setCreateOrganizationOpen(false)
  }

  // ── Render main area ─────────────────────────────────────────────────────
  const renderMain = () => {
    if (activeView === 'dashboard') {return <PlaceholderView title="Dashboard" />}
    if (activeView === 'profile') return <UserProfile user={MOCK_PROFILE} onFriendsClick={() => setFriendsOpen(true)} />
    if (activeView === 'notifications') return <NotificationsPage />
    if (activeView === 'all-boards') return <PlaceholderView title="All Boards" />
    if (activeView === 'completed') return <PlaceholderView title="Completed Tasks" />
    if (activeView === 'kanbanBoard') return <KanbanBoardPage />
    if (activeView === 'organization-settings') {
      return currentWorkspace ? (
        <OrganizationSettingsPage
          workspace={currentWorkspace}
          onBack={() => setActiveView(`workspace-${currentWorkspace.id}`)}
          onOpenMembers={() => setActiveView('organization-members')}
        />
      ) : (
        <PlaceholderView title="Organization Settings" />
      )
    }

    if (activeView === 'organization-members') {
      return currentWorkspace ? (
        <OrganizationMembersPage workspace={currentWorkspace} onBackToSettings={() => setActiveView('organization-settings')} />
      ) : (
        <PlaceholderView title="Organization Members" />
      )
    }

    if (activeView.startsWith('workspace-')) {
      return currentWorkspace ? (
        <OrganizationHomePage
          workspace={currentWorkspace}
          onCreateWorkspace={() => setCreateOrganizationOpen(true)}
          onOpenSettings={() => setActiveView('organization-settings')}
          onOpenMembers={() => setActiveView('organization-members')}
          onOpenBoard={() => setActiveView('kanbanBoard')}
          
        />
      ) : (
        <PlaceholderView title="Workspace" />
      )
    }

    if (activeView.startsWith('user-')) {
      // In a real app, fetch the user by ID. For now show the mock other user.
      return <OtherUserProfile user={MOCK_OTHER_USER} />
    }

    return <PlaceholderView title="Dashboard" />
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        user={user}
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={() => console.log('logout')}
        onCreateWorkspace={() => setCreateOrganizationOpen(true)}
      />

      {renderMain()}

      {/* Friends modal — opened from the Friends stat on the profile, or wherever you wire it */}
      {friendsOpen && (
        <Friends
          friends={friends}
          pendingRequests={pendingRequests}
          onClose={() => setFriendsOpen(false)}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onRemoveFriend={handleRemoveFriend}
          onViewProfile={handleViewProfile}
        />
      )}

      <CreateOrganizationModal
        isOpen={createOrganizationOpen}
        onClose={() => setCreateOrganizationOpen(false)}
        onCreate={handleCreateOrganization}
      />

    </div>
  )
}
