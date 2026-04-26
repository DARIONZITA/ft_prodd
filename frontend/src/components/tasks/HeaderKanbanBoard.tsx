import { Plus, Search, Filter, ArrowUpDown } from 'lucide-react';

interface PropsHeaderkanbanBoard {
  onModalCreate: () => void
  viewMode: 'board' | 'list'
  onViewModeChange: (viewMode: 'board' | 'list') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  completedTodayCount: number
  todayLabel: string
}

export function HeaderKanbanBoard({
  onModalCreate,
  viewMode,
  onViewModeChange,
  searchQuery,
  setSearchQuery,
  completedTodayCount,
  todayLabel,
}: PropsHeaderkanbanBoard) {
    const userMode: 'Admin' | 'Member' | 'Viewer' = 'Admin';
    const userModeMessage =
      userMode === 'Admin'
        ? 'Total Access'
        : userMode === 'Member'
          ? 'Member Access'
          : 'Viewer Access';

    return (
      <>
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-20 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-50 text-indigo-600 font-bold font-mono text-xs border border-indigo-100">42</div>
          <span className="text-slate-400 mx-1">|</span>
          <span className="font-semibold text-slate-700 px-2 py-1 rounded bg-slate-100 border border-slate-200">
            User Mode: {userMode}
          </span>
          <span className="text-slate-500 px-2 py-1 rounded bg-amber-50 border border-amber-200">
            {userModeMessage}
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

        <div className="flex items-center gap-4">
          <div className="flex items-center text-slate-400">
            <div className="flex -space-x-2 mr-3">
              <img src="https://ui-avatars.com/api/?name=Jose+M&background=0891b2&color=fff" className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-100" />
              <img src="https://ui-avatars.com/api/?name=Ana+S&background=4f46e5&color=fff" className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-100" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center ring-1 ring-slate-100">+2</div>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
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
              <div className="px-8 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-mono px-2 py-0.5 rounded-full border border-emerald-200">
                    {completedTodayCount} tasks completed today
                  </span>
                  <span className="bg-slate-100 text-slate-500 text-xs font-mono px-2 py-0.5 rounded-full border border-slate-200">
                    {todayLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 w-52 transition-all"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
                    <Filter className="w-4 h-4 text-slate-400" />
                    Filter
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                    Sort
                  </button>
                </div>
              </div>
      </>)
}