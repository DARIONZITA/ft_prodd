import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-[460px] max-h-[90vh] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">Create Column</h2>
            <p className="font-body text-sm text-slate-500 mt-2">Add a new board column and choose a display type.</p>
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
              className="w-full font-body text-sm sm:text-base border font-medium border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 placeholder-slate-400 transition-all"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Column type
            </label>
            <div className="relative">
              <select
                value={columnTypeId}
                onChange={(e) => setColumnTypeId(e.target.value as ColumnTypeId)}
                className="w-full text-sm sm:text-base border border-slate-200 rounded-lg px-3 py-2.5 sm:py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-700 appearance-none bg-white transition-all cursor-pointer pr-10"
              >
                {Object.entries(COLUMN_TYPE_LABELS).map(([type, label]) => (
                  <option key={type} value={type}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 font-body text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateColumn}
            className="px-4 py-2 font-body text-sm font-bold text-white bg-cyan-600 rounded-lg transition-all hover:-translate-y-0.5 hover:bg-cyan-700 shadow-[0_4px_14px_rgba(8,145,178,0.2)] hover:shadow-[0_6px_20px_rgba(8,145,178,0.3)]"
          >
            Create Column
          </button>
        </div>
      </div>
    </div>
  );
}
