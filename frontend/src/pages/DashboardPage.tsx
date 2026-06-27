import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/SideBar.tsx'
import ThisProfile from './profile/This.tsx'
import OtherProfile from './profile/Other.tsx'
import Friends from './profile/Friends.tsx'
import api from '../api/axios.ts'
import CreateOrganizationModal from './organization/CreateOrganizationModal.tsx'
import OrganizationSettingsPage from './organization/OrganizationSettingsPage.tsx'
import OrganizationMembersPage from './organization/OrganizationMembersPage.tsx'
import KanbanBoardPage from '../components/tasks/KanbanBoardPage.tsx'
import NotificationsPage from './NotificationsPage.tsx'
import InvitationsPage from './InvitationsPage.tsx'
import type { User, UserResponse } from '../types/user.ts'
import { useGetUserRequest } from '../api/user.ts'
import { useCreateWorkspaceMutation, useDeleteWorkspaceMutation, useUpdateWorkspaceMutation, useUserWorkspacesQuery, type Workspace } from '../api/workspace.ts'
import { queryClient } from '../query-client'

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
  | 'invitations'

// ─── Empty / Placeholder state ───────────────────────────────────────────────

function PlaceholderView({ title }: { title: string }) {
  const emptyMessages: Record<string, { heading: string; description: string }> = {
    'Dashboard': {
      heading: 'Welcome to your Dashboard',
      description:
        'Get started by creating a workspace or inviting a teammate. Use the sidebar to navigate.',
    },
    'All Boards': {
      heading: 'No Boards Yet',
      description:
        'Boards help you organize projects and tasks. Create your first board to get started.',
    },
    'Completed Tasks': {
      heading: 'No Completed Tasks',
      description:
        'Tasks you mark as complete will appear here. Start working to see your progress!',
    },
    'Organization Settings': {
      heading: 'No Workspace Selected',
      description:
        'Select a workspace from the sidebar to manage its settings.',
    },
    'Organization Members': {
      heading: 'No Workspace Selected',
      description:
        'Select a workspace from the sidebar to view and manage its members.',
    },
  }

  if (title === 'Loading profile...') {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="font-body text-sm text-slate-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const info = emptyMessages[title]

  return (
    <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm px-4">
        {info ? (
          <>
            <h2 className="font-heading text-lg font-semibold text-slate-700 mb-2">
              {info.heading}
            </h2>
            <p className="font-body text-sm text-slate-400">{info.description}</p>
          </>
        ) : (
          <p className="font-body text-sm text-slate-400">{title}</p>
        )}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dataQuery: UserResponse | undefined = useGetUserRequest({ refetchOnMount: true }).data
  const userDataQuery: User | null = dataQuery?.success ? dataQuery.data : null
  const workspaceQuery = useUserWorkspacesQuery({ refetchOnMount: true })
  const createWorkspaceMutation = useCreateWorkspaceMutation()
  const updateWorkspaceMutation = useUpdateWorkspaceMutation()
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation()
  const workspaceDataQuery: Workspace[] = workspaceQuery.data?.success ? workspaceQuery.data.data : []

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
  const selectedWorkspaceId = useMemo<string | number>(() => {
    return workspaceParam || workspaceDataQuery[0]?.id || 0
  }, [workspaceParam, workspaceDataQuery])

  const currentWorkspace = useMemo(() => {
    // Get workspace from URL param first (works for kanbanBoard, workspace-logs, etc.)
    if (workspaceParam) {
      return workspaceDataQuery.find((workspace: Workspace) => String(workspace.id) === String(workspaceParam)) ?? workspaceDataQuery[0]
    }

    // Fallback: try to extract from activeView (for 'workspace-{id}' pattern)
    if (activeView.startsWith('workspace-') && activeView !== 'workspace-logs') {
      const workspaceId = activeView.replace('workspace-', '')
      return workspaceDataQuery.find((workspace: Workspace) => String(workspace.id) === String(workspaceId)) ?? workspaceDataQuery[0]
    }

    // Default: use selected workspace or first one
    return workspaceDataQuery.find((workspace: Workspace) => String(workspace.id) === String(selectedWorkspaceId)) ?? workspaceDataQuery[0]
  }, [activeView, selectedWorkspaceId, workspaceDataQuery, workspaceParam])

  useEffect(() => {
    if (workspaceQuery.isLoading || workspaceQuery.isFetching) return
    if (workspaceParam) {
      const hasAccess = workspaceDataQuery.some(
        (w: Workspace) => String(w.id) === String(workspaceParam)
      )
      if (!hasAccess) navigate('/dashboard', { replace: true })
    }
  }, [workspaceParam, workspaceDataQuery, workspaceQuery.isLoading, workspaceQuery.isFetching, navigate])

  const handleNavigate = (view: string, payload?: string | number) => {
    setCreateOrganizationOpen(false)

    const nextParams = new URLSearchParams()

    if (view === 'workspace' && payload != null) {
      nextParams.set('workspace', String(payload))
      nextParams.set('view', 'kanbanBoard')
      navigate(`/dashboard?${nextParams.toString()}`)
      return
    }

    if (view === 'user' && payload != null) {
      nextParams.set('view', `user-${payload}`)
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

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/signout')
    } catch {
      // ignore
    }
    queryClient.clear()
    navigate('/signin', { replace: true })
  }

  const handleViewProfile = (id: string | number) => {
    setFriendsOpen(false)
    handleNavigate(`user-${id}`)
  }

  const handleCreateOrganization = async (data: { name: string; description: string; visibility: 'private' | 'team'; template: string }) => {
    const createdWorkspace = await createWorkspaceMutation.mutateAsync({
      name: data.name,
      description: data.description || "New workspace",
    })

    handleNavigate('workspace', createdWorkspace.id)
    setCreateOrganizationOpen(false)
  }

  const handleUpdateWorkspace = async (data: { name: string; description: string }) => {
    if (!currentWorkspace) {
      return
    }

    await updateWorkspaceMutation.mutateAsync({
      id: currentWorkspace.id,
      form: {
        name: data.name,
        description: data.description,
      },
    })
  }

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) {
      return
    }

    await deleteWorkspaceMutation.mutateAsync(currentWorkspace.id)
    handleNavigate('dashboard')
  }

  // ── Render main area ─────────────────────────────────────────────────────
  const renderMain = () => {
    if (activeView === 'dashboard') { return <PlaceholderView title="Dashboard" /> }
    if (activeView === 'profile') {
      if (!userDataQuery) {
        return <PlaceholderView title="Loading profile..." />
      } else
        return (
          <ThisProfile
            user={userDataQuery}
            onNavigate={handleNavigate}
          />
        )
    }
    if (activeView === 'notifications') return <NotificationsPage />
    if (activeView === 'invitations') return <InvitationsPage />
    if (activeView === 'all-boards') return <PlaceholderView title="All Boards" />
    if (activeView === 'completed') return <PlaceholderView title="Completed Tasks" />
    if (activeView === 'kanbanBoard') {

      return (
        <KanbanBoardPage
          workspaceId={currentWorkspace?.id}
          onOpenSettings={() => handleNavigate('organization-settings')}
          onOpenMembers={() => handleNavigate('organization-members')}
          dateWorkspace={currentWorkspace?.createdAt ?? ''}
          workspaceRole={currentWorkspace?.role}
        />
      )
    }
    if (activeView === 'organization-settings') {
      return currentWorkspace ? (
        <OrganizationSettingsPage
          workspace={currentWorkspace}
          onBack={() => handleNavigate('workspace', currentWorkspace.id)}
          onOpenMembers={() => handleNavigate('organization-members')}
          onSave={handleUpdateWorkspace}
          onDelete={handleDeleteWorkspace}
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

    // Workspace home removed - clicking workspace now goes directly to kanbanBoard
    // Logs page is accessed via sidebar footer button

    if (activeView.startsWith('user-')) {
      const otherUserId = activeView.replace('user-', '')
      if (!userDataQuery) {
        return <PlaceholderView title="Loading profile..." />
      }

      if (String(otherUserId) === String(userDataQuery.id)) {
        return (
          <ThisProfile
            user={userDataQuery}
            onNavigate={handleNavigate}
          />
        )
      }

      return (
        <OtherProfile
          userId={otherUserId}
          currentUserId={userDataQuery.id}
          onNavigate={handleNavigate}
        />
      )
    }

    return <PlaceholderView title="Dashboard" />
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        data={{
          name: userDataQuery ? userDataQuery.username : 'User',
          avatarUrl: userDataQuery ? userDataQuery.avatarUrl : null,
          workspaces: workspaceDataQuery || []
        }}
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onCreateWorkspace={() => setCreateOrganizationOpen(true)}
        activeWorkspace={currentWorkspace}
      />

      {renderMain()}

      {/* Friends modal — opened from the Friends stat on the profile, or wherever you wire it */}
      {friendsOpen && userDataQuery && (
        <Friends
          userId={userDataQuery.id}
          onClose={() => setFriendsOpen(false)}
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
