import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Plus, Circle } from 'lucide-react';
import { useDroppable } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { Column, Task } from './Types';

interface TaskListPageProps {
  tasks: Task[];
  columns: Column[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}

const getPriorityIcon = (priority: string) => {
  if (priority === 'High') return <Circle className="w-3 h-3 fill-red-500 text-red-500" />;
  if (priority === 'Medium') return <Circle className="w-3 h-3 fill-amber-500 text-amber-500" />;
  return <Circle className="w-3 h-3 fill-green-500 text-green-500" />;
};

const getPriorityTextColor = (priority: string) => {
  if (priority === 'High') return 'text-red-500';
  if (priority === 'Medium') return 'text-slate-500';
  return 'text-green-500';
};

function TaskRow({ task, onTaskClick, index }: { task: Task; onTaskClick: (task: Task) => void; index: number }) {
  const [element, setElement] = useState<Element | null>(null);

  const { isDragging } = useSortable({
    id: task.id,
    element,
    handle: element,
    index,
    data: { type: 'TASK', taskId: task.id, fromColumnId: task.columnId, taskIndex: index },
  });

  const { ref: beforeRef, isDropTarget: isBeforeDropTarget } = useDroppable({
    id: `${task.id}::before`,
    data: { type: 'TASK_INSERT', taskId: task.id, fromColumnId: task.columnId, side: 'before', taskIndex: index },
  });

  const { ref: afterRef, isDropTarget: isAfterDropTarget } = useDroppable({
    id: `${task.id}::after`,
    data: { type: 'TASK_INSERT', taskId: task.id, fromColumnId: task.columnId, side: 'after', taskIndex: index },
  });

  return (
    <div
      ref={setElement}
      onClick={() => onTaskClick(task)}
      className={`relative grid grid-cols-[32px_1fr_140px_110px_100px_90px_80px] gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors items-center ${isDragging ? 'opacity-60' : 'opacity-100'}`}
    >
      <div ref={beforeRef} className="absolute -top-2 left-0 right-0 h-1/2 z-10" />
      {isBeforeDropTarget && !isDragging && (
        <div className="absolute -top-1 left-2 right-2 h-0.5 rounded-full bg-cyan-500 z-20" />
      )}

      <div ref={afterRef} className="absolute -bottom-2 left-0 right-0 h-1/2 z-10" />
      {isAfterDropTarget && !isDragging && (
        <div className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-cyan-500 z-20" />
      )}

      <input type="checkbox" onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-cyan-600 cursor-pointer" />
      <span className="text-sm font-medium text-slate-800 hover:text-cyan-600 transition-colors truncate">{task.title}</span>
      <div className="flex items-center gap-1">
        {task.assignees.slice(0, 2).map((assignee) => (
          <img key={assignee.id} src={assignee.avatar} className="w-5 h-5 rounded-full" alt={assignee.name} title={assignee.name} />
        ))}
        {task.assignees.length > 2 && (
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">
            +{task.assignees.length - 2}
          </div>
        )}
        {task.assignees.length === 0 && <span className="text-xs text-slate-400">-</span>}
      </div>
      <span className="font-mono text-xs text-slate-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
      <div className="flex items-center gap-1">
        {getPriorityIcon(task.priority)}
        <span className={`text-xs font-medium ${getPriorityTextColor(task.priority)}`}>{task.priority}</span>
      </div>
      <div className="flex gap-1 overflow-hidden">
        {task.labels.slice(0, 1).map((label) => (
          <span key={label.id} className={`${label.bgColor} ${label.color} border ${label.borderColor} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
            {label.name}
          </span>
        ))}
        {task.labels.length > 1 && (
          <span className="text-[10px] text-slate-500">+{task.labels.length - 1}</span>
        )}
      </div>
      <span className="font-mono text-[10px] text-slate-400 text-right">{task.id}</span>
    </div>
  );
}

function TaskGroupRows({
  column,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}) {
  const { ref: dropRef } = useDroppable({ id: column.id, data: { type: 'COLUMN_DROP', columnId: column.id } });

  return (
    <div ref={dropRef} className="divide-y divide-slate-50">
      {tasks.map((task, index) => (
        <TaskRow key={task.id} task={task} onTaskClick={onTaskClick} index={index} />
      ))}

      {(column.columnTypeId === 'backlog' || column.columnTypeId === 'todo') && (
        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
          <div className="w-4 h-4 flex-shrink-0"></div>
          <button
            onClick={() => onAddTask(column.id)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {column.columnTypeId === 'backlog' ? 'backlog' : 'task'} to {column.name}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskListPage({ tasks, columns, onTaskClick, onAddTask }: TaskListPageProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next: Record<string, boolean> = {};
      columns.forEach((column) => {
        next[column.id] = prev[column.id] ?? true;
      });
      return next;
    });
  }, [columns]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    columns.forEach((column) => {
      grouped[column.id] = [];
    });

    tasks.forEach(task => {
      if (grouped[task.columnId]) {
        grouped[task.columnId].push(task);
      }
    });

    Object.keys(grouped).forEach((columnId) => {
      grouped[columnId].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [tasks, columns]);

  const toggleGroup = (columnId: string) => {
    setExpandedGroups(prev => ({ ...prev, [columnId]: !prev[columnId] }));
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Table Header */}
      <div className="px-8 flex-shrink-0">
        <div className="grid grid-cols-[32px_1fr_140px_110px_100px_90px_80px] gap-3 py-2 px-4 bg-white border border-slate-200 rounded-t-lg text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <div></div>
          <div>Title</div>
          <div>Assignee</div>
          <div>Due Date</div>
          <div>Priority</div>
          <div>Labels</div>
          <div className="text-right">ID</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-lg overflow-hidden">
          {columns.map((column, idx) => (
            <div key={column.id} className={idx < columns.length - 1 ? 'border-b border-slate-100' : ''}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(column.id)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
              >
                <div className={`w-4 h-4 text-slate-400 transition-transform ${expandedGroups[column.id] ? 'rotate-90' : ''}`}>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{column.name}</span>
                <span className="font-mono text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{tasksByColumn[column.id]?.length ?? 0}</span>
              </button>

              {/* Task Rows */}
              {expandedGroups[column.id] && (
                <TaskGroupRows
                  column={column}
                  tasks={tasksByColumn[column.id] ?? []}
                  onTaskClick={onTaskClick}
                  onAddTask={onAddTask}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
