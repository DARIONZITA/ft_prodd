import { useEffect, useMemo, useState } from 'react';
import { X, MessageSquare, ChevronDown, Calendar, User2 } from 'lucide-react';
import type { ChecklistItem, Column, ColumnTypeId, Task, TaskComment, TaskPriority } from './Types';

const COLUMN_TYPE_COLORS: Record<ColumnTypeId, { dot: string; bg: string; border: string; text: string }> = {
  backlog: { dot: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-700' },
  todo: { dot: 'bg-blue-400', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  in_progress: { dot: 'bg-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700' },
  code_review: { dot: 'bg-orange-400', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
  done: { dot: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
  custom: { dot: 'bg-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-700' },
};

interface TaskDetailPanelProps {
  task: Task;
  columns: Column[];
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [];

export default function TaskDetailPanel({ task, columns, onClose, onUpdateTask }: TaskDetailPanelProps) {
  const [editingTitle, setEditingTitle] = useState(task.title);
  const [editingDescription, setEditingDescription] = useState(task.description);
  const [editingColumnId, setEditingColumnId] = useState(task.columnId);
  const [editingPriority, setEditingPriority] = useState(task.priority);
  const [comments, setComments] = useState<TaskComment[]>(task.comments ?? []);
  const [commentText, setCommentText] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(task.checklist ?? DEFAULT_CHECKLIST);
  const [newChecklistText, setNewChecklistText] = useState('');

  useEffect(() => {
    setEditingTitle(task.title);
    setEditingDescription(task.description);
    setEditingColumnId(task.columnId);
    setEditingPriority(task.priority);
    setComments(task.comments ?? []);
    setChecklistItems(task.checklist ?? DEFAULT_CHECKLIST);
    setCommentText('');
    setNewChecklistText('');
  }, [task, columns]);

  const checklistProgress = useMemo(() => {
    if (checklistItems.length === 0) {
      return 0;
    }

    return Math.round((checklistItems.filter((item) => item.completed).length / checklistItems.length) * 100);
  }, [checklistItems]);

  const formatShortDate = (value: string) => {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const addComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setComments((current) => [
      ...current,
      {
        id: `comment-${Date.now()}`,
        author: task.createdBy.name,
        avatar: task.createdBy.avatar,
        text: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    setCommentText('');
  };

  const addChecklistItem = () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;

    setChecklistItems((current) => [
      ...current,
      {
        id: `check-${Date.now()}`,
        text: trimmed,
        completed: false,
      },
    ]);
    setNewChecklistText('');
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklistItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleSave = () => {
    const updated = {
      ...task,
      title: editingTitle,
      description: editingDescription,
      columnId: editingColumnId,
      priority: editingPriority,
      comments,
      checklist: checklistItems,
    };
    onUpdateTask(updated);
  };

  const selectedColumn = columns.find((column) => column.id === editingColumnId) ?? columns[0];
  const colorConfig = COLUMN_TYPE_COLORS[selectedColumn?.columnTypeId ?? 'custom'];
  const priorityEmoji = editingPriority === 'High' ? '🔴' : editingPriority === 'Medium' ? '🟡' : '🟢';

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-10" />

      {/* Panel */}
      <div className="fixed left-1/2 top-1/2 w-[min(1120px,calc(100vw-2rem))] h-[min(760px,calc(100vh-2rem))] -translate-x-1/2 -translate-y-1/2 bg-white text-slate-900 shadow-2xl z-20 flex flex-col border border-slate-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {/* Status */}
            <div
              onClick={() => {
                if (!columns.length) return;
                const currentIndex = columns.findIndex((column) => column.id === editingColumnId);
                const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % columns.length;
                setEditingColumnId(columns[nextIndex].id);
              }}
              className={`flex items-center gap-1.5 cursor-pointer px-3 py-1 rounded-lg border transition-colors ${colorConfig.bg} ${colorConfig.border}`}
            >
              <div className={`w-2 h-2 rounded-full ${colorConfig.dot}`}></div>
              <span className="text-xs font-medium font-mono">{selectedColumn?.name ?? 'Column'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">{task.id}</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
            <div className="h-full overflow-y-auto border-r border-slate-200 bg-slate-50">
              <div className="px-6 py-5">
                <div className="mb-6">
                  <h1
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setEditingTitle(e.currentTarget.textContent || '')}
                    className="font-semibold text-2xl text-slate-900 leading-snug cursor-text px-2 py-1 -mx-2 rounded hover:bg-white outline-none"
                  >
                    {editingTitle}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
                      <User2 className="w-3.5 h-3.5" />
                      {task.createdBy.name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs shadow-sm">
                      {task.id}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'No due date'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Members</div>
                    <div className="flex items-center gap-1.5">
                      {task.assignees.map((assignee) => (
                        <img key={assignee.id} src={assignee.avatar} className="w-7 h-7 rounded-full ring-1 ring-slate-200" title={assignee.name} alt={assignee.name} />
                      ))}
                      <button className="w-7 h-7 rounded-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                        <span className="text-xs font-bold">+</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Priority</div>
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => {
                      const priorities: TaskPriority[] = ['High', 'Medium', 'Low'];
                      const idx = priorities.indexOf(editingPriority);
                      setEditingPriority(priorities[(idx + 1) % priorities.length]);
                    }}>
                      <span className="text-sm">{priorityEmoji}</span>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-cyan-700 transition-colors">{editingPriority}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Column</div>
                    <div className="text-sm text-slate-700">{selectedColumn?.name ?? 'Column'}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Sprint</div>
                    <div className="font-mono text-xs text-slate-700">{task.sprint}</div>
                  </div>
                </div>

                {task.labels.length > 0 && (
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Labels</span>
                    {task.labels.map((label) => (
                      <span key={label.id} className={`${label.bgColor} ${label.color} border ${label.borderColor} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                        {label.name}
                      </span>
                    ))}
                    <button className="text-slate-500 hover:text-cyan-700 border border-dashed border-slate-300 hover:border-cyan-400 text-xs px-2 py-0.5 rounded-full transition-colors bg-white">+ Add label</button>
                  </div>
                )}

                <div className="border-t border-slate-200 mb-5"></div>

                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-sm text-slate-900">Description</h3>
                    <button className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                      Edit
                    </button>
                  </div>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setEditingDescription(e.currentTarget.textContent || '')}
                    className="text-sm text-slate-700 leading-relaxed cursor-text px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors min-h-[120px] border border-slate-200 bg-white outline-none shadow-sm"
                  >
                    {editingDescription}
                  </div>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Checklist</h3>
                      <p className="text-xs text-slate-500 mt-1">{checklistProgress}% complete</p>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                    <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${checklistProgress}%` }} />
                  </div>

                  <div className="space-y-2">
                    {checklistItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No checklist items yet. Add the first one below.
                      </div>
                    ) : (
                      checklistItems.map((item) => (
                        <label key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 cursor-pointer hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(item.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className={`text-sm leading-6 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {item.text}
                          </span>
                        </label>
                      ))
                    )}

                    <div className="flex gap-2 pt-2">
                      <input
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addChecklistItem();
                          }
                        }}
                        placeholder="Add checklist item..."
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={addChecklistItem}
                        className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                </div>
                </div>
              </div>
            </div>

            <div className="h-full overflow-y-auto bg-white">
              <div className="px-5 py-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-500" />
                    <h3 className="text-lg font-semibold text-slate-900">Comments and activity</h3>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 mb-5 shadow-sm">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[74px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-cyan-500"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={addComment}
                      className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      No comments yet. Use the box above to add the first one.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        {comment.avatar ? (
                          <img src={comment.avatar} alt={comment.author} className="h-10 w-10 rounded-full ring-1 ring-slate-200" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                            {comment.author.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-900">{comment.author}</span>
                            <span className="text-xs text-slate-500">{formatShortDate(comment.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
