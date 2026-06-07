import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/SideBar'
import UserProfile from './profile/This'
import OtherUserProfile from './profile/Other'
import Friends, { MOCK_FRIENDS, MOCK_PENDING } from './profile/Friends'
import type { Friend, PendingRequest } from '../components/friend/Types'
import CreateOrganizationModal from './organization/CreateOrganizationModal'
import OrganizationSettingsPage from './organization/OrganizationSettingsPage.tsx'
import OrganizationMembersPage from './organization/OrganizationMembersPage.tsx'
import WorkspaceLogsPage from './organization/WorkspaceLogsPage.tsx'
import AnalyticsPage from './organization/AnalyticsPage.tsx'
import KanbanBoardPage from '../components/tasks/KanbanBoardPage.tsx'
import NotificationsPage from './NotificationsPage.tsx'
import LeaderboardPage from './gamification/LeaderboardPage.tsx'
import BadgesPage from './gamification/BadgesPage.tsx'
import LevelUpToast from '../components/gamification/LevelUpToast.tsx'
import { SHARED_BADGES } from '../components/gamification/SharedBadges.ts'
import type { LeaderboardEntry, XpSummary } from '../components/gamification/Types.ts'

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

const XP_SUMMARY: XpSummary = {
  level: 8,
  xp: 2340,
  xpRequired: 3500,
}

const ALL_TIME_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u-1', name: 'Alex K.', avatar: 'https://ui-avatars.com/api/?name=Alex+K&background=f59e0b&color=fff', level: 22, xp: 19880, progressPercent: 82 },
  { id: 'u-2', name: 'Maria L.', avatar: 'https://ui-avatars.com/api/?name=Maria+L&background=4f46e5&color=fff', level: 19, xp: 17120, progressPercent: 76 },
  { id: 'u-3', name: 'Sam T.', avatar: 'https://ui-avatars.com/api/?name=Sam+T&background=ea580c&color=fff', level: 18, xp: 15990, progressPercent: 71 },
  { id: 'u-4', name: 'Priya R.', avatar: 'https://ui-avatars.com/api/?name=Priya+R&background=6366f1&color=fff', level: 16, xp: 14710, progressPercent: 68 },
  { id: 'u-5', name: 'Tom B.', avatar: 'https://ui-avatars.com/api/?name=Tom+B&background=0ea5e9&color=fff', level: 15, xp: 13690, progressPercent: 61 },
  { id: 'u-6', name: 'Leo N.', avatar: 'https://ui-avatars.com/api/?name=Leo+N&background=8b5cf6&color=fff', level: 14, xp: 12470, progressPercent: 54 },
  { id: 'u-7', name: 'Chen W.', avatar: 'https://ui-avatars.com/api/?name=Chen+W&background=10b981&color=fff', level: 13, xp: 11090, progressPercent: 49 },
  { id: 'u-8', name: 'Nina P.', avatar: 'https://ui-avatars.com/api/?name=Nina+P&background=f43f5e&color=fff', level: 12, xp: 10340, progressPercent: 46 },
  { id: 'u-9', name: 'Ryan C.', avatar: 'https://ui-avatars.com/api/?name=Ryan+C&background=f97316&color=fff', level: 11, xp: 9520, progressPercent: 41 },
  { id: 'u-10', name: 'Zara M.', avatar: 'https://ui-avatars.com/api/?name=Zara+M&background=64748b&color=fff', level: 10, xp: 8990, progressPercent: 38 },
  { id: 'u-me', name: 'Edson', avatar: 'https://ui-avatars.com/api/?name=Edson&background=0891b2&color=fff', level: XP_SUMMARY.level, xp: 8340, progressPercent: 35, isCurrentUser: true, dailyDelta: 1 },
]

// Use shared badges data
const BADGES = SHARED_BADGES

// ─── View type ────────────────────────────────────────────────────────────────

type ActiveView =
  | 'dashboard'
  | 'profile'
  | 'notifications'
  | 'all-boards'
  | 'completed'
  | 'leaderboard'
  | 'badges'
  | 'organization-settings'
  | 'organization-members'
  | `workspace-${string | number}`
  | `user-${string | number}`
  | 'kanbanBoard'
  | 'analytics'

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
  const navigate = useNavigate()
  const location = useLocation()
  
  // Parse URL search params
  const searchParams = new URLSearchParams(location.search)
  const viewParam = searchParams.get('view') || 'dashboard'
  const workspaceParam = searchParams.get('workspace')

  const activeView = useMemo<ActiveView>(() => {
    // Priorizar viewParam se existir (kanbanBoard, workspace-logs, etc)
    if (viewParam && viewParam !== 'dashboard') {
      return viewParam as ActiveView
    }
    
    // Se temos apenas workspaceParam sem view específico
    if (workspaceParam) {
      return `workspace-${workspaceParam}` as ActiveView
    }

    return viewParam as ActiveView || 'dashboard'
  }, [viewParam, workspaceParam])

  const [friendsOpen, setFriendsOpen] = useState(false)
  const [createOrganizationOpen, setCreateOrganizationOpen] = useState(false)
  const [user, setUser] = useState<User>(MOCK_USER)
 const [showLevelUpToast, setShowLevelUpToast] = useState(false)

  // Friends state — in real app this comes from API
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS)
  const [pendingRequests, setPending] = useState<PendingRequest[]>(MOCK_PENDING)

  const selectedWorkspaceId = useMemo<string | number>(() => {
    return workspaceParam || MOCK_USER.workspaces[0]?.id || 0
  }, [workspaceParam])

  const currentWorkspace = useMemo(() => {
    // Get workspace from URL param first (works for kanbanBoard, workspace-logs, etc.)
    if (workspaceParam) {
      return user.workspaces.find(workspace => String(workspace.id) === String(workspaceParam)) ?? user.workspaces[0]
    }
    
    // Fallback: try to extract from activeView (for 'workspace-{id}' pattern)
    if (activeView.startsWith('workspace-') && activeView !== 'workspace-logs') {
      const workspaceId = activeView.replace('workspace-', '')
      return user.workspaces.find(workspace => String(workspace.id) === String(workspaceId)) ?? user.workspaces[0]
    }
    
    // Default: use selected workspace or first one
    return user.workspaces.find(workspace => String(workspace.id) === String(selectedWorkspaceId)) ?? user.workspaces[0]
  }, [activeView, selectedWorkspaceId, user.workspaces, workspaceParam])

  const handleNavigate = (view: string, payload?: string | number) => {
    setCreateOrganizationOpen(false)

    const nextParams = new URLSearchParams()

    if (view === 'workspace' && payload != null) {
      nextParams.set('workspace', String(payload))
      nextParams.set('view', 'kanbanBoard')
      navigate(`/dashboard?${nextParams.toString()}`)
      return
    }

    if (view === 'workspace-logs' && payload != null) {
      nextParams.set('workspace', String(payload))
      nextParams.set('view', 'workspace-logs')
      navigate(`/dashboard?${nextParams.toString()}`)
      return
    }

    if (view === 'analytics' && payload != null) {
      nextParams.set('workspace', String(payload))
      nextParams.set('view', 'analytics')
      navigate(`/dashboard?${nextParams.toString()}`)
      return
    }

    if (view.startsWith('workspace-')) {
      const workspaceId = view.replace('workspace-', '')
      nextParams.set('workspace', workspaceId)
      navigate(`/dashboard?${nextParams.toString()}`)
      return
    }

    if (view.startsWith('user-')) {
      nextParams.set('view', view)
      navigate(`/dashboard?${nextParams.toString()}`)
      return
    }

    if (view === 'dashboard') {
      navigate('/dashboard')
      return
    }

    nextParams.set('view', view)
    navigate(`/dashboard?${nextParams.toString()}`)
  }

  const handleLogout = () => {
    try {
      // Clear auth-related localStorage keys (adjust keys if your app uses different ones)
      localStorage.removeItem('token')
      localStorage.removeItem('auth')
    } catch {
      // ignore
    }
    // Replace history entry so user cannot go back to protected page
    navigate('/signin', { replace: true })
  }

  // If user is not authenticated, force redirect to signin. Runs on location changes
  /*useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin', { replace: true })
    }
  }, [location, navigate])
  */

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
    handleNavigate(`user-${id}`)
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
    handleNavigate('workspace', newWorkspaceId)
    setCreateOrganizationOpen(false)
  }

  // ── Render main area ─────────────────────────────────────────────────────
  const renderMain = () => {
    if (activeView === 'dashboard') {return <PlaceholderView title="Dashboard" />}
    if (activeView === 'profile') return <UserProfile user={MOCK_PROFILE} onFriendsClick={() => setFriendsOpen(true)} />
    if (activeView === 'notifications') return <NotificationsPage />
    if (activeView === 'all-boards') return <PlaceholderView title="All Boards" />
    if (activeView === 'completed') return <PlaceholderView title="Completed Tasks" />
    if (activeView === 'leaderboard') {
      return (
        <LeaderboardPage
          entries={ALL_TIME_LEADERBOARD}
          onOpenBadges={() => handleNavigate('badges')}
          period="all-time"
          onPeriodChange={() => {}}
        />
      )
    }
    if (activeView === 'badges') {
      return (
        <BadgesPage
          badges={BADGES}
          onOpenLeaderboard={() => handleNavigate('leaderboard')}
          onShowLevelUp={() => setShowLevelUpToast(true)}
        />
      )
    }
    if (activeView === 'kanbanBoard') {
      return (
        <KanbanBoardPage
          onOpenSettings={() => handleNavigate('organization-settings')}
          onOpenMembers={() => handleNavigate('organization-members')}
        />
      )
    }
    if (activeView === 'organization-settings') {
      return currentWorkspace ? (
        <OrganizationSettingsPage
          workspace={currentWorkspace}
          onBack={() => handleNavigate('workspace', currentWorkspace.id)}
          onOpenMembers={() => handleNavigate('organization-members')}
          onOpenAnalytics={() => handleNavigate('analytics', currentWorkspace.id)}
        />
      ) : (
        <PlaceholderView title="Organization Settings" />
      )
    }

    if (activeView === 'organization-members') {
      return currentWorkspace ? (
        <OrganizationMembersPage workspace={currentWorkspace} onBackToSettings={() => handleNavigate('organization-settings')} />
      ) : (
        <PlaceholderView title="Organization Members" />
      )
    }

    if (activeView === 'workspace-logs') {
      return currentWorkspace ? (
        <WorkspaceLogsPage
          workspaceName={currentWorkspace.name}
          onBack={() => {
            // Navigate back to kanban preserving current workspace
            const nextParams = new URLSearchParams()
            nextParams.set('workspace', String(currentWorkspace.id))
            nextParams.set('view', 'kanbanBoard')
            navigate(`/dashboard?${nextParams.toString()}`)
          }}
        />
      ) : (
        <PlaceholderView title="Workspace Logs" />
      )
    }

    if (activeView === 'analytics') {
      return currentWorkspace ? (
        <AnalyticsPage
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          onBack={() => {
            const nextParams = new URLSearchParams()
            nextParams.set('workspace', String(currentWorkspace.id))
            nextParams.set('view', 'kanbanBoard')
            navigate(`/dashboard?${nextParams.toString()}`)
          }}
        />
      ) : (
        <PlaceholderView title="Analytics" />
      )
    }

    // Workspace home removed - clicking workspace now goes directly to kanbanBoard
    // Logs page is accessed via sidebar footer button

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
        xpSummary={XP_SUMMARY}
        onLogout={handleLogout}
        onCreateWorkspace={() => setCreateOrganizationOpen(true)}
        activeWorkspace={currentWorkspace}
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

      <LevelUpToast
        open={showLevelUpToast}
        onClose={() => setShowLevelUpToast(false)}
        previousLevel={XP_SUMMARY.level}
        newLevel={XP_SUMMARY.level + 1}
        currentXp={XP_SUMMARY.xp}
        nextLevelXp={XP_SUMMARY.xpRequired}
        unlockedBadgeName="Sprint Hero"
      />

    </div>
  )
}
