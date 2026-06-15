import { useState } from 'react';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import {
  useWorkspaceLabelsQuery,
  useCreateWorkspaceLabelMutation,
  useDeleteWorkspaceLabelMutation,
} from '../../api/kanban';

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number | string;
}

const COLORS = [
  { id: 'red',    label: 'Red',    tw: 'bg-red-500' },
  { id: 'orange', label: 'Orange', tw: 'bg-orange-500' },
  { id: 'yellow', label: 'Yellow', tw: 'bg-yellow-400' },
  { id: 'green',  label: 'Green',  tw: 'bg-green-500' },
  { id: 'teal',   label: 'Teal',   tw: 'bg-teal-500' },
  { id: 'cyan',   label: 'Cyan',   tw: 'bg-cyan-500' },
  { id: 'blue',   label: 'Blue',   tw: 'bg-blue-500' },
  { id: 'indigo', label: 'Indigo', tw: 'bg-indigo-500' },
  { id: 'purple', label: 'Purple', tw: 'bg-purple-500' },
  { id: 'pink',   label: 'Pink',   tw: 'bg-pink-500' },
  { id: 'gray',   label: 'Gray',   tw: 'bg-slate-400' },
  { id: 'brown',  label: 'Brown',  tw: 'bg-amber-700' },
];

const TEXT_STYLES: Record<string, string> = {
  red:    'text-red-700 bg-red-50 border-red-200',
  orange: 'text-orange-700 bg-orange-50 border-orange-200',
  yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  green:  'text-green-700 bg-green-50 border-green-200',
  teal:   'text-teal-700 bg-teal-50 border-teal-200',
  cyan:   'text-cyan-700 bg-cyan-50 border-cyan-200',
  blue:   'text-blue-700 bg-blue-50 border-blue-200',
  indigo: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  purple: 'text-purple-700 bg-purple-50 border-purple-200',
  pink:   'text-pink-700 bg-pink-50 border-pink-200',
  gray:   'text-slate-600 bg-slate-100 border-slate-200',
  brown:  'text-amber-800 bg-amber-100 border-amber-200',
};

export default function ManageLabelsModal({ isOpen, onClose, workspaceId }: ManageLabelsModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('cyan');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: labelsData, isLoading } = useWorkspaceLabelsQuery(workspaceId);
  const createMutation = useCreateWorkspaceLabelMutation(workspaceId);
  const deleteMutation = useDeleteWorkspaceLabelMutation(workspaceId);

  if (!isOpen) return null;

  const labels = labelsData?.success ? labelsData.data : [];

  const handleCreate = () => {
    if (!name.trim()) return;
    setCreating(true);
    createMutation.mutate({ name: name.trim(), color: selectedColor }, {
      onSuccess: () => {
        setName('');
        setSelectedColor('cyan');
        setCreating(false);
      },
      onError: () => setCreating(false),
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-[480px] max-h-[90vh] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col rounded-3xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center">
              <Tag className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">Workspace Labels</h2>
              <p className="font-body text-xs text-slate-400 mt-0.5">Create and delete labels for this workspace</p>
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">

          {/* Create new label */}
          <div className="space-y-3">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">
              New Label
            </label>

            <input
              type="text"
              placeholder="Label name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={50}
              className="w-full font-body text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 placeholder-slate-400 transition-all"
            />

            {/* Color picker */}
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  title={c.label}
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.tw} transition-all ${
                    selectedColor === c.id
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            {/* Preview + Create */}
            <div className="flex items-center gap-3">
              {name.trim() && (
                <span className={`inline-flex items-center font-mono text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${TEXT_STYLES[selectedColor] ?? TEXT_STYLES.cyan}`}>
                  {name.trim()}
                </span>
              )}
              <button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(8,145,178,0.2)]"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Existing labels */}
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Existing Labels ({labels.length})
            </p>

            {isLoading ? (
              <div className="text-sm text-slate-400 py-4 text-center">Loading…</div>
            ) : labels.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 text-center flex flex-col items-center gap-2">
                <Tag className="w-8 h-8 text-slate-200" />
                No labels yet. Create your first one above.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto thin-scroll pr-1">
                {labels.map((lbl) => (
                  <div
                    key={lbl.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${COLORS.find(c => c.id === lbl.color)?.tw ?? 'bg-cyan-500'}`} />
                      <span className={`font-mono text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${TEXT_STYLES[lbl.color] ?? TEXT_STYLES.cyan} truncate`}>
                        {lbl.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(lbl.id)}
                      disabled={deletingId === lbl.id}
                      className="flex-shrink-0 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                      title="Delete label"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
