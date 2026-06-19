import { useEffect, useMemo, useState } from 'react';
import { X, Link2, Circle } from 'lucide-react';
import type { Column, Task, TaskPriority } from './Types';
import { useWorkspaceLabelsQuery } from '../../api/kanban';
import { useWorkspaceMembersQuery } from '../../api/workspace';

const COLOR_MAP: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  red: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  orange: { color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  yellow: { color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  green: { color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  blue: { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  purple: { color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  pink: { color: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  cyan: { color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  teal: { color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  indigo: { color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  lime: { color: 'text-lime-700', bgColor: 'bg-lime-50', borderColor: 'border-lime-200' },
  gray: { color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200' },
  brown: { color: 'text-amber-800', bgColor: 'bg-amber-100', borderColor: 'border-amber-200' },
};

interface CreateTaskModalProps {
  workspaceId: number | string;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  columns: Column[];
  initialColumnId?: string;
  backlogTasks?: Task[];
}

export default function CreateTaskModal({ workspaceId, onClose, onCreateTask, columns, initialColumnId, backlogTasks = [] }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(initialColumnId ?? columns[0]?.id ?? '');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<{ id: string; name: string; avatar: string; initials: string }[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<{ id: string; name: string; color: string; bgColor: string; borderColor: string }[]>([]);
  const [linkedBacklogId, setLinkedBacklogId] = useState<string>('');
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);

  // Fetch workspace labels & members dynamically
  const { data: labelsQuery } = useWorkspaceLabelsQuery(workspaceId);
  const { data: membersList } = useWorkspaceMembersQuery(workspaceId);

  const availableLabels = useMemo(() => {
    if (!labelsQuery?.success) return [];
    return labelsQuery.data.map(l => {
      const style = COLOR_MAP[l.color.toLowerCase()] || COLOR_MAP.cyan;
      return {
        id: String(l.id),
        name: l.name,
        ...style
      };
    });
  }, [labelsQuery]);

  const availableAssignees = useMemo(() => {
    if (!membersList) return [];
    return membersList.map(m => {
      const username = m.user?.username || 'User';
      return {
        id: String(m.user?.id || m.userId),
        name: username,
        avatar: m.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0891b2&color=fff`,
        initials: username.slice(0, 2).toUpperCase()
      };
    });
  }, [membersList]);

  useEffect(() => {
    if (!columns.length) return;

    if (initialColumnId && columns.some((col) => col.id === initialColumnId)) {
      setColumnId(initialColumnId);
      return;
    }

    if (!columns.some((col) => col.id === columnId)) {
      setColumnId(columns[0].id);
    }
  }, [columns, initialColumnId, columnId]);

  const selectedColumn = useMemo(
    () => columns.find((col) => col.id === columnId) ?? columns[0],
    [columns, columnId]
  );

  const isBacklogColumn = selectedColumn?.columnTypeId === 'backlog';
  const requiresBacklogLink = !isBacklogColumn && backlogTasks.length > 0;

  const handleToggleAssignee = (assignee: { id: string; name: string; avatar: string; initials: string }) => {
    setSelectedAssignees(prev =>
      prev.some(a => a.id === assignee.id)
        ? prev.filter(a => a.id !== assignee.id)
        : [...prev, assignee]
    );
  };

  const handleToggleLabel = (label: { id: string; name: string; color: string; bgColor: string; borderColor: string }) => {
    setSelectedLabels(prev =>
      prev.some(l => l.id === label.id)
        ? prev.filter(l => l.id !== label.id)
        : [...prev, label]
    );
  };

  const handleCreateTask = () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    if (requiresBacklogLink && !linkedBacklogId) {
      alert('You must connect this task with a backlog item.');
      return;
    }

    const newTask: Task = {
      title,
      description,
      columnId,
      priority,
      order: 0,
      dueDate: dueDate || undefined,
      assignees: selectedAssignees,
      labels: selectedLabels,
      linkedBacklogId: requiresBacklogLink ? linkedBacklogId : undefined,
    };

    onCreateTask(newTask);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-[560px] max-h-[90vh] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col rounded-3xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">Create Task</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[11px] text-slate-400">Adding to column:</span>
              <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono border border-slate-200">
                <div className={`w-1.5 h-1.5 rounded-full ${selectedColumn?.color ?? 'bg-slate-400'}`}></div>
                {selectedColumn?.name ?? 'Column'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Implement login endpoint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full font-body text-sm border font-medium border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 placeholder-slate-400 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Description <span className="text-slate-300 font-normal normal-case font-body">(optional)</span>
            </label>
            <textarea
              placeholder="Add details, context, acceptance criteria…"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full font-body text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-700 placeholder-slate-400 resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Assignees & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">Assignees</label>
              <div className="flex flex-wrap gap-2">
                {selectedAssignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-colors">
                    <img src={assignee.avatar} className="w-5 h-5 rounded-full" />
                    <span className="text-xs font-medium text-slate-600">{assignee.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAssignee(assignee)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAssigneesDropdown(!showAssigneesDropdown)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-600 border border-dashed border-slate-300 hover:border-cyan-400 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <span className="text-sm">+</span> Add
                </button>
                {showAssigneesDropdown && (
                  <div className="absolute left-0 mt-1 z-10 w-48 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg p-1.5 space-y-1">
                    {availableAssignees.length === 0 ? (
                      <p className="p-2 text-xs text-slate-400">No members found</p>
                    ) : (
                      availableAssignees.map((assignee) => {
                        const isSelected = selectedAssignees.some((a) => a.id === assignee.id);
                        return (
                          <button
                            key={assignee.id}
                            type="button"
                            onClick={() => {
                              handleToggleAssignee(assignee);
                              setShowAssigneesDropdown(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium rounded-md transition-colors ${
                              isSelected ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <img src={assignee.avatar} className="w-5 h-5 rounded-full" />
                            <span className="truncate flex-1">{assignee.name}</span>
                            {isSelected && <span className="text-cyan-600 text-[10px]">✔</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">Priority</label>
              <div className="flex items-center gap-2">
                {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      priority === p
                        ? p === 'High'
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : p === 'Medium'
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-green-50 border-green-200 text-green-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {p === 'High' ? <Circle className="w-3 h-3 fill-red-500 text-red-500" /> : p === 'Medium' ? <Circle className="w-3 h-3 fill-amber-500 text-amber-500" /> : <Circle className="w-3 h-3 fill-green-500 text-green-500" />} {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column & Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-700 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">Labels</label>
            <div className="flex items-center gap-2 flex-wrap">
              {availableLabels.length === 0 ? (
                <p className="text-xs text-slate-400">No workspace labels created.</p>
              ) : (
                availableLabels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleToggleLabel(label)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors border ${
                      selectedLabels.some(l => l.id === label.id)
                        ? `${label.bgColor} ${label.color} border-transparent`
                        : 'border-dashed border-slate-300 text-slate-400 hover:text-cyan-600 hover:border-cyan-400'
                    }`}
                  >
                    {selectedLabels.some(l => l.id === label.id) ? <X className="w-3 h-3" /> : <span>+</span>}
                    {label.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Connect with Backlog */}
          {requiresBacklogLink && (
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-cyan-500" />
                  Connect with Backlog <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                value={linkedBacklogId}
                onChange={(e) => setLinkedBacklogId(e.target.value)}
                className={`w-full text-sm border rounded-lg px-3 py-2.5 outline-none transition-all cursor-pointer appearance-none bg-white pr-8 ${
                  linkedBacklogId
                    ? 'border-cyan-400 ring-2 ring-cyan-500/20 text-slate-700'
                    : 'border-red-300 ring-2 ring-red-500/10 text-slate-400'
                }`}
              >
                <option value="">Select a backlog item…</option>
                {backlogTasks.map((bt) => (
                  <option key={bt.id} value={bt.id}>
                    {bt.id} — {bt.title}
                  </option>
                ))}
              </select>
              {!linkedBacklogId && (
                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                  ⚠ Every task must be linked to a backlog item
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 font-body text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 font-body text-sm font-bold text-white bg-cyan-600 rounded-lg transition-all hover:-translate-y-0.5 hover:bg-cyan-700 shadow-[0_4px_14px_rgba(8,145,178,0.2)] hover:shadow-[0_6px_20px_rgba(8,145,178,0.3)]"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
