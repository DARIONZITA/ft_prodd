import { useState } from 'react';
import { X } from 'lucide-react';
import type { ColumnTypeId } from './Types';

interface CreateColumnModalProps {
  onClose: () => void;
  onCreateColumn: (name: string, columnTypeId: ColumnTypeId) => void;
  initialType?: ColumnTypeId;
}

const COLUMN_TYPE_LABELS: Record<ColumnTypeId, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  code_review: 'Code Review',
  done: 'Done',
  custom: 'Custom',
};

export default function CreateColumnModal({ onClose, onCreateColumn, initialType = 'custom' }: CreateColumnModalProps) {
  const [name, setName] = useState('');
  const [columnTypeId, setColumnTypeId] = useState<ColumnTypeId>(initialType);

  const handleCreateColumn = () => {
    if (!name.trim()) {
      alert('Column name is required');
      return;
    }

    onCreateColumn(name.trim(), columnTypeId);
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-10" />

      <div className="fixed right-0 top-0 bottom-0 w-[460px] bg-white shadow-2xl z-20 flex flex-col border-l border-slate-200 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Create Column</h2>
            <p className="text-sm text-slate-500 mt-2">Add a new board column and choose a display type.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Column name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. QA Review"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 placeholder-slate-400 font-medium transition-all"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Column type
            </label>
            <select
              value={columnTypeId}
              onChange={(e) => setColumnTypeId(e.target.value as ColumnTypeId)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-700 appearance-none bg-white transition-all cursor-pointer"
            >
              {Object.entries(COLUMN_TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateColumn}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Create Column
          </button>
        </div>
      </div>
    </>
  );
}
