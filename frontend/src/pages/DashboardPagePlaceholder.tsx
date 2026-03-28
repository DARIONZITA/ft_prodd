import { useState } from 'react'
import Sidebar from '../components/SideBar'
import UserProfile from './profile/This'
import OtherUserProfile from './profile/Other'
import Friends, { MOCK_FRIENDS, MOCK_PENDING } from './profile/Friends'
import type { Friend, PendingRequest } from '../components/friend/Types'

const MOCK_USER = {
  name: 'Edson',
  avatarUrl: null,
  workspaces: [
    { id: 1, name: 'ft_printf' },
    { id: 2, name: 'get_next_line' },
    { id: 3, name: 'push_swap', taskCount: 15 },
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
  | `workspace-${string | number}`
  | `user-${string | number}`

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

  // Friends state — in real app this comes from API
  const [friends, setFriends]           = useState<Friend[]>(MOCK_FRIENDS)
  const [pendingRequests, setPending]   = useState<PendingRequest[]>(MOCK_PENDING)

  const handleNavigate = (view: string, payload?: string | number) => {
    if (view === 'workspace' && payload != null) {
      setActiveView(`workspace-${payload}`)
    } else {
      setActiveView(view as ActiveView)
    }
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

  // ── Render main area ─────────────────────────────────────────────────────
  const renderMain = () => {
    if (activeView === 'profile')        return <UserProfile user={MOCK_PROFILE} onFriendsClick={() => setFriendsOpen(true)} />
    if (activeView === 'notifications')  return <PlaceholderView title="Notifications" />
    if (activeView === 'all-boards')     return <PlaceholderView title="All Boards" />
    if (activeView === 'completed')      return <PlaceholderView title="Completed Tasks" />
    if (activeView.startsWith('workspace-')) {
      const wsId = activeView.replace('workspace-', '')
      const ws = MOCK_USER.workspaces.find(w => String(w.id) === wsId)
      return <PlaceholderView title={ws?.name ?? 'Workspace'} />
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
        user={MOCK_USER}
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={() => console.log('logout')}
        onCreateWorkspace={() => console.log('create workspace')}
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

    </div>
  )
}
