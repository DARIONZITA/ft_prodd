import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
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
}

export default function CreateTaskModal({ onClose, onCreateTask, columns, initialColumnId }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(initialColumnId ?? columns[0]?.id ?? '');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState(AVAILABLE_ASSIGNEES.slice(0, 1));
  const [selectedLabels, setSelectedLabels] = useState([AVAILABLE_LABELS[0]]);

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
    };

    onCreateTask(newTask);
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-10" />

      {/* Modal */}
      <div className="fixed right-0 top-0 bottom-0 w-[560px] bg-white shadow-2xl z-20 flex flex-col border-l border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Create Task</h2>
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
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 placeholder-slate-400 font-medium transition-all"
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
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-700 placeholder-slate-400 resize-none leading-relaxed transition-all"
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
                    {p === 'High' ? '🔴' : p === 'Medium' ? '🟡' : '🟢'} {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">Column</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-700 appearance-none bg-white pr-8 transition-all cursor-pointer"
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>{column.name}</option>
                ))}
              </select>
            </div>

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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Create Task
          </button>
        </div>
      </div>
    </>
  );
}
