import { useEffect, useMemo, useState } from 'react';
import { X, Link2, Circle } from 'lucide-react';
import type { Column, Task, TaskPriority } from './Types';

const AVAILABLE_LABELS = [
  { id: 'l1', name: 'feature', color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { id: 'l2', name: 'design', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { id: 'l3', name: 'bug', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { id: 'l4', name: 'docs', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200' },
  { id: 'l5', name: 'chore', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
];

const AVAILABLE_ASSIGNEES = [
  { id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama&background=4f46e5&color=fff', initials: 'GA' },
  { id: '2', name: 'Jose M', avatar: 'https://ui-avatars.com/api/?name=Jose+M&background=0891b2&color=fff', initials: 'JM' },
  { id: '3', name: 'Andre C', avatar: 'https://ui-avatars.com/api/?name=Andre+C&background=0e7490&color=fff', initials: 'AC' },
  { id: '4', name: 'Ana S', avatar: 'https://ui-avatars.com/api/?name=Ana+S&background=4f46e5&color=fff', initials: 'AS' },
];

interface CreateTaskModalProps {
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  columns: Column[];
  initialColumnId?: string;
  backlogTasks?: Task[];
}

export default function CreateTaskModal({ onClose, onCreateTask, columns, initialColumnId, backlogTasks = [] }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(initialColumnId ?? columns[0]?.id ?? '');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState(AVAILABLE_ASSIGNEES.slice(0, 1));
  const [selectedLabels, setSelectedLabels] = useState([AVAILABLE_LABELS[0]]);
  const [linkedBacklogId, setLinkedBacklogId] = useState<string>('');

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

  const handleToggleAssignee = (assignee: typeof AVAILABLE_ASSIGNEES[0]) => {
    setSelectedAssignees(prev =>
      prev.some(a => a.id === assignee.id)
        ? prev.filter(a => a.id !== assignee.id)
        : [...prev, assignee]
    );
  };

  const handleToggleLabel = (label: typeof AVAILABLE_LABELS[0]) => {
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
      id: `TASK-${Math.floor(Math.random() * 1000)}`,
      title,
      description,
      columnId,
      priority,
      order: 0,
      dueDate: dueDate || undefined,
      assignees: selectedAssignees,
      labels: selectedLabels,
      createdBy: AVAILABLE_ASSIGNEES[0],
      sprint: 'Sprint 1',
      createdAt: new Date().toISOString().split('T')[0],
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">Assignees</label>
              <div className="flex flex-wrap gap-2">
                {selectedAssignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-colors">
                    <img src={assignee.avatar} className="w-5 h-5 rounded-full" />
                    <span className="text-xs font-medium text-slate-600">{assignee.name}</span>
                    <button
                      onClick={() => handleToggleAssignee(assignee)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-600 border border-dashed border-slate-300 hover:border-cyan-400 px-2 py-1.5 rounded-lg transition-colors">
                <span className="text-sm">+</span> Add
              </button>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">Priority</label>
              <div className="flex items-center gap-2">
                {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
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
          <div className="grid grid-cols-2 gap-4">
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
              {AVAILABLE_LABELS.map((label) => (
                <button
                  key={label.id}
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
              ))}
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
