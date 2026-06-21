import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Settings, MoreHorizontal, Users, Key, Tag } from 'lucide-react';

interface PropsHeaderkanbanBoard {
  onModalCreate: () => void
  viewMode: 'board' | 'list'
  onViewModeChange: (viewMode: 'board' | 'list') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  workspaceCreatedAt: Date
  onOpenSettings?: () => void
  onOpenMembers?: () => void
  onOpenLabels?: () => void
  userMode?: 'Admin' | 'Member' | 'Viewer'
}

export function HeaderKanbanBoard({
  onModalCreate,
  viewMode,
  onViewModeChange,
  searchQuery,
  setSearchQuery,
  workspaceCreatedAt,
  onOpenSettings,
  onOpenMembers,
  onOpenLabels,
  userMode = 'Viewer'
}: PropsHeaderkanbanBoard) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setMobileMenuOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    console.log(workspaceCreatedAt)
    return (
      <>
      <header className="min-h-[3.5rem] py-2 border-b border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 sticky top-0 z-10 md:z-20 flex-shrink-0 gap-3 md:gap-0">
        <div className="flex items-center gap-2 text-sm w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="font-semibold text-slate-700 px-2 py-1 rounded bg-slate-100 border border-slate-200 hidden sm:inline-block">
            User Mode: {userMode}
          </span>
          
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => onViewModeChange('board')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'board' ? 'text-cyan-700 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'list' ? 'text-cyan-700 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            List
          </button>
        </nav>

        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onOpenMembers}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              title="Manage members"
            >
             Members
            </button>
            {userMode === 'Admin' && (
              <>
                <button 
                  onClick={onOpenLabels}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Manage Labels"
                >
                  Labels
                </button>
              </>
            )}
            <div className="h-6 w-px bg-slate-200"></div>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors duration-150"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
          </div>

          {/* Mobile menu dropdown */}
          <div className="md:hidden relative" ref={menuRef}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {mobileMenuOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <button
                  onClick={() => { onOpenMembers?.(); setMobileMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Users className="w-4 h-4" /> Members
                </button>
                {userMode === 'Admin' && (
                  <>
                    <button
                      onClick={() => { onOpenLabels?.(); setMobileMenuOpen(false) }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Tag className="w-4 h-4" /> Labels
                    </button>
                  </>
                )}
                <div className="border-t border-slate-100" />
                <button
                  onClick={() => { onOpenSettings?.(); setMobileMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onModalCreate}
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Column
          </button>
        </div>
      
      </header>
        {/* Toolbar */}
              <div className="px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between flex-shrink-0 gap-4 sm:gap-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="bg-slate-100 text-slate-500 text-xs font-mono px-2 py-0.5 rounded-full border border-slate-200">
                    Created {workspaceCreatedAt}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 w-full sm:w-52 transition-all"
                    />
                  </div>
                </div>
              </div>
      </>)
}