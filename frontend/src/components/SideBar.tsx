import { useState, useEffect } from 'react'
import { Menu, Plus, Search, ChevronsLeft, LogOut, Grid2x2, FileText, ArrowLeftRight, Trophy, Medal, ScrollText } from 'lucide-react'
import NotificationsDropdown from './NotificationsDropdown'

interface Workspace {
  id: string | number
  name: string
  taskCount?: number
}

interface User {
  name: string
  avatarUrl?: string | null
  workspaces: Workspace[]
}

interface SidebarProps {
  user: User
  activeView: string
  onNavigate: (view: string, payload?: string | number) => void
  xpSummary?: {
    level: number
    xp: number
    xpRequired: number
  }
  onLogout?: () => void
  onCreateWorkspace?: () => void
  className?: string
  activeWorkspace?: Workspace | null
}

const WORKSPACE_ICONS = [Grid2x2, FileText, ArrowLeftRight]

export default function Sidebar({ user, activeView, onNavigate, xpSummary, onLogout = () => {}, onCreateWorkspace = () => {}, className = '', activeWorkspace = null }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open')
    return saved !== null ? saved === 'true' : true
  })

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-open', String(isOpen))
  }, [isOpen])

  const filteredWorkspaces = user.workspaces.filter(ws => ws.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const initials = user.name?.trim()[0]?.toUpperCase() ?? '?'

  const navItems = [
    { id: 'leaderboard', label: 'Leaderboard', Icon: Trophy },
    { id: 'badges', label: 'Badges', Icon: Medal },
  ]

  const renderAvatar = () => user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 font-display">
      {initials}
    </div>
  )

  // ── Collapsed ─────────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <aside className={`flex flex-col items-center w-14 min-w-14 h-screen bg-white border-r border-slate-200 py-4 gap-3 ${className}`}>
        <button
          aria-label="Open sidebar"
          onClick={() => setIsOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
        >
          <Menu size={18} />
        </button>

        <button onClick={() => onNavigate('profile')} aria-label="View profile" className="mt-1 cursor-pointer">
          {renderAvatar()}
        </button>

        <NotificationsDropdown active={activeView === 'notifications'} bellSize={16} bellPaddingClassName="p-2" onViewAll={() => onNavigate('notifications')} />

        <div className="flex flex-col items-center gap-1 mt-1">
          {navItems.map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`p-2 rounded-lg transition-colors duration-150 cursor-pointer ${
                activeView === id ? 'bg-cyan-50 text-cyan-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </aside>
    )
  }

  // ── Expanded ──────────────────────────────────────────────────────────────
  return (
    <aside className={`flex flex-col w-60 min-w-60 h-screen bg-white border-r border-slate-200 ${className}`}>

      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <button
          onClick={() => onNavigate('profile')}
          aria-label="View profile"
          className={`flex items-center gap-2 flex-1 min-w-0 text-left rounded-lg transition-colors duration-150 p-1 -ml-1 cursor-pointer ${
            activeView === 'profile' ? 'bg-cyan-50' : 'hover:bg-slate-100'
          }`}
        >
          {renderAvatar()}
          <span className="flex-1 min-w-0 truncate font-display font-semibold text-sm text-slate-900">
            {user.name}
          </span>
        </button>

        <NotificationsDropdown active={activeView === 'notifications'} onViewAll={() => onNavigate('notifications')} />

        <button
          aria-label="Close sidebar"
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
        >
          <ChevronsLeft size={20} />
        </button>
      </div>

      {/* Add Board */}
      <div className="px-3 mb-3">
        <button
          onClick={onCreateWorkspace}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-display font-bold text-sm cursor-pointer transition-colors duration-150"
        >
          <Plus size={14} strokeWidth={2.5} />
          Create Workspace
        </button>
      </div>

      {/* Search */}
      <div className="px-3 mb-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search workspaces"
            className="w-full pl-8 pr-16 py-2 border border-slate-200 rounded-lg font-body text-sm text-slate-900 bg-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 placeholder:text-slate-400 transition-colors duration-150"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-400 bg-slate-200 rounded px-1.5 py-0.5 pointer-events-none">
            Ctrl+K
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-2 flex flex-col gap-0.5 mb-1" aria-label="Main navigation">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={activeView === id ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-body text-sm font-medium w-full text-left transition-colors duration-150 ${
              activeView === id
                ? 'bg-cyan-50 text-cyan-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* My Projects */}
      <p className="px-4 pt-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-slate-400">
        My Workspaces
      </p>

      <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-0.5" role="list">
        {filteredWorkspaces.length === 0 ? (
          <p className="px-3 py-3 font-body text-xs text-slate-400 text-center">
            {searchQuery ? 'No projects found' : 'No workspaces yet'}
          </p>
        ) : (
          filteredWorkspaces.map((ws, idx) => {
            const WsIcon = WORKSPACE_ICONS[idx % WORKSPACE_ICONS.length]
            const isActive = activeWorkspace?.id === ws.id
            return (
              <button
                key={ws.id}
                role="listitem"
                onClick={() => onNavigate('workspace', ws.id)}
                title={ws.name}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-body text-sm font-medium w-full text-left transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <WsIcon size={14} className="flex-shrink-0" />
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.taskCount != null && (
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0 ${
                    isActive ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {ws.taskCount}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-2 py-2.5 flex flex-col gap-0.5">
        {/* Workspace Logs - only show when workspace is active */}
        {activeWorkspace && (
          <button
            onClick={() => onNavigate('workspace-logs', activeWorkspace.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-body text-sm font-medium w-full text-left transition-colors duration-150 cursor-pointer ${
              activeView === 'workspace-logs' 
                ? 'bg-cyan-50 text-cyan-700 font-semibold' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <ScrollText size={14} />
            <span className="flex-1 min-w-0 truncate">
              Logs: {activeWorkspace.name}
            </span>
          </button>
        )}
        
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-body text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 w-full text-left transition-colors duration-150 cursor-pointer"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>

    </aside>
  )
}
