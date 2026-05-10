import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Calendar, Link2, Circle } from 'lucide-react';
import type { ChecklistItem, Column, ColumnTypeId, Task } from './Types';
import { useDroppable, DragDropProvider, useDragDropManager} from '@dnd-kit/react';
import {useSortable} from '@dnd-kit/react/sortable';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import CreateTaskModal from './CreateTaskModal';
import CreateColumnModal from './CreateColumnModal';
import {move} from '@dnd-kit/helpers';
import TaskDetailPanel from './TaskDetailPanel';
import { HeaderKanbanBoard } from './HeaderKanbanBoard';
import TaskListPage from './TaskListPage';

const COLUMN_COLOR_BY_TYPE_ID: Record<ColumnTypeId, string> = {
  backlog: 'bg-slate-400',
  todo: 'bg-blue-400',
  in_progress: 'bg-purple-500',
  code_review: 'bg-orange-400',
  done: 'bg-green-500',
  custom: 'bg-cyan-500',
};

const DEFAULT_COLUMNS: Column[] = [
   { id: 'col-2', name: 'To Do', columnTypeId: 'todo', color: COLUMN_COLOR_BY_TYPE_ID.todo, order: 2 },
  { id: 'col-1', name: 'Backlog', columnTypeId: 'backlog', color: COLUMN_COLOR_BY_TYPE_ID.backlog, order: 1 },
  { id: 'col-3', name: 'In Progress', columnTypeId: 'in_progress', color: COLUMN_COLOR_BY_TYPE_ID.in_progress, order: 3 },
  { id: 'col-4', name: 'Code Review', columnTypeId: 'code_review', color: COLUMN_COLOR_BY_TYPE_ID.code_review, order: 4 },
  { id: 'col-5', name: 'Done', columnTypeId: 'done', color: COLUMN_COLOR_BY_TYPE_ID.done, order: 5 },
 ];

const sortColumns = (columnList: Column[]) =>
  [...columnList].sort((a, b) => a.order - b.order);

const SORTED_DEFAULT_COLUMNS = sortColumns(DEFAULT_COLUMNS);

const INITIAL_TASKS: Task[] = [
 {
    id: 'TASK-101',
    title: 'Research authentication providers for OAuth',
    description: 'Evaluate OAuth providers',
    columnId: 'col-1',
    priority: 'Medium',
    order: 2,
    assignees: [{ id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama&background=4f46e5&color=fff', initials: 'GA' }],
    labels: [{ id: 'l1', name: 'Research', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100' }],
    createdBy: { id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama', initials: 'GA' },
    createdAt: '2026-02-15',
  },
  {
    id: 'TASK-102',
    title: 'Define DB schema for user profiles',
    description: 'Create database schema',
    columnId: 'col-1',
    priority: 'Low',
    order: 1,
    dueDate: '2026-02-22',
    assignees: [{ id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama', initials: 'GA' }],
    labels: [{ id: 'l2', name: 'Database', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-100' }],
    createdBy: { id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama', initials: 'GA' },
    createdAt: '2026-02-15',
  },
  {
    id: 'TASK-103',
    title: 'Setup CI/CD pipeline',
    description: 'Configure deployment',
    columnId: 'col-1',
    priority: 'High',
    order: 3,
    assignees: [],
    labels: [{ id: 'l3', name: 'DevOps', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-100' }],
    createdBy: { id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama', initials: 'GA' },
    createdAt: '2026-02-15',
  },
  {
    id: 'TASK-104',
    title: 'Implement authentication routes',
    description: 'Create auth endpoints',
    columnId: 'col-2',
    priority: 'High',
    order: 1,
    dueDate: '2026-02-20',
    assignees: [{ id: '2', name: 'Jose M', avatar: 'https://ui-avatars.com/api/?name=Jose+M&background=0891b2&color=fff', initials: 'JM' }],
    labels: [{ id: 'l4', name: 'Backend', color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-100' }],
    createdBy: { id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama', initials: 'GA' },
    createdAt: '2026-02-15',
  },
  {
    id: 'TASK-092',
    title: 'Implement WebSocket connection for real-time chat',
    description: 'Setup Socket.IO',
    columnId: 'col-3',
    priority: 'High',
    order: 1,
    dueDate: '2026-02-20',
    assignees: [{ id: '3', name: 'Andre C', avatar: 'https://ui-avatars.com/api/?name=Andre+C&background=0e7490&color=fff', initials: 'AC' }, { id: '2', name: 'Jose M', avatar: 'https://ui-avatars.com/api/?name=Jose+M&background=0891b2&color=fff', initials: 'JM' }],
    labels: [{ id: 'l4', name: 'Backend', color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-100' }, { id: 'l5', name: 'Feature', color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-100' }],
    createdBy: { id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama', initials: 'GA' },
    createdAt: '2026-02-15',
  },
  {
    id: 'TASK-105',
    title: 'Review client authentication flow',
    description: 'Code review for auth',
    columnId: 'col-4',
    priority: 'Medium',
    order: 1,
    dueDate: '2026-02-21',
    assignees: [{ id: '4', name: 'Ana S', avatar: 'https://ui-avatars.com/api/?name=Ana+S&background=4f46e5&color=fff', initials: 'AS' }],
    labels: [],
    createdBy: { id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama', initials: 'GA' },
    createdAt: '2026-02-15',
  },
  {
    id: 'TASK-106',
    title: 'Deplo staging environment',
    description: 'Production deployment',
    columnId: 'col-5',
    priority: 'High',
    order: 1,
    dueDate: '2026-02-18',
    assignees: [{ id: '3', name: 'Andre C', avatar: 'https://ui-avatars.com/api/?name=Andre+C&background=0e7490&color=fff', initials: 'AC' }],
    labels: [{ id: 'l3', name: 'DevOps', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-100' }],
    createdBy: { id: '1', name: 'Gama', avatar: 'https://ui-avatars.com/api/?name=Gama', initials: 'GA' },
    createdAt: '2026-02-15',
  },
];

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

const getNextColumnId = (currentColumns: Column[]) => {
  const currentNumbers = currentColumns
    .map((column) => {
      const matched = column.id.match(/^col-(\d+)$/);
      return matched ? Number(matched[1]) : 0;
    })
    .filter((value) => value > 0);

  const next = currentNumbers.length > 0 ? Math.max(...currentNumbers) + 1 : 1;
  return `col-${next}`;
};

const sortTasks = (taskList: Task[]) =>
  [...taskList].sort((a, b) => {
    if (a.columnId === b.columnId) {
      return a.order - b.order;
    }
    return a.columnId.localeCompare(b.columnId);
  });



interface ColumnCardProps {
  column: Column;
  tasks: Task[];
  isBacklog: boolean;
  onAddTask: (id: string) => void;
  onTaskClick: (task: Task) => void;
  index: number;
  backlogColumnId?: string;
}



function TaskCard({ task, onClick, index, isBacklogTask, isCompletedBacklog }: { task: Task; onClick: (task: Task) => void; index: number; isBacklogTask?: boolean; isCompletedBacklog?: boolean }) {
  const [element, setElement] = useState<Element | null>(null);
  const moveMouse = useRef({ x: 0, y: 0 });
  const [animationLeft, setAnimationLeaft] = useState<boolean>(true);
  const dummyRef = useRef<HTMLDivElement | null>(null);

  const { isDragging } = useSortable({
    id: task.id,
    element,
    handle: isBacklogTask ? dummyRef : element,
    index,
    disabled: isBacklogTask,
    data: { type: 'TASK', taskId: task.id, fromColumnId: task.columnId, taskIndex: index }
  });

  const { ref: beforeRef, isDropTarget: isBeforeDropTarget } = useDroppable({
    id: `${task.id}::before`,
    disabled: isBacklogTask,
    data: { type: 'TASK_INSERT', taskId: task.id, fromColumnId: task.columnId, side: 'before', taskIndex: index }
  });

  const { ref: afterRef, isDropTarget: isAfterDropTarget } = useDroppable({
    id: `${task.id}::after`,
    disabled: isBacklogTask,
    data: { type: 'TASK_INSERT', taskId: task.id, fromColumnId: task.columnId, side: 'after', taskIndex: index }
  });

  // Checklist progress for backlog cards
  const checklistTotal = task.checklist?.length ?? 0;
  const checklistDone = task.checklist?.filter(i => i.completed).length ?? 0;

   const manager = useDragDropManager();

  useEffect(() => {
    const listener = (event: { operation?: { position?: { current?: { x: number; y: number } } } }) => {
      const position = event?.operation?.position?.current;
      if (!position) return;

      const { x, y } = position;
      if (isDragging) {
        if (moveMouse.current.x < x && animationLeft) {
          setAnimationLeaft(false);
        }
        if (moveMouse.current.x > x && !animationLeft) {
          setAnimationLeaft(true);
        }
      }
      moveMouse.current = { x, y };
    };
    manager.monitor.addEventListener("dragmove", listener);
    return () => manager.monitor.removeEventListener("dragmove", listener);
  }, [manager, isDragging, animationLeft]);

  return (<div
              ref={setElement}
              key={task.id}
              onClick={() => onClick(task)}
             className={`${isDragging 
                ? `${animationLeft ? '-rotate-4' : 'rotate-4'} shadow-lg`
                : 'shadow-sm'
              } relative p-4 rounded-xl border transition-all group ${
                isCompletedBacklog
                  ? 'bg-slate-100 border-slate-200 opacity-60 cursor-default'
                  : isBacklogTask
                    ? 'bg-white border-slate-200 hover:shadow-md cursor-pointer'
                    : 'bg-white border-slate-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer hover:border-slate-300'
              }`}
            >
              {/* Hidden ref for backlog tasks so drag handle points to nothing */}
              <div ref={dummyRef} className="hidden" />

              {!isBacklogTask && (
                <>
                  <div ref={beforeRef} className="absolute -top-2 left-0 right-0 h-1/2 z-10" />
                  {isBeforeDropTarget && !isDragging && (
                    <div className="absolute -top-1 left-2 right-2 h-0.5 rounded-full bg-cyan-500 z-20" />
                  )}
                  <div ref={afterRef} className="absolute -bottom-2 left-0 right-0 h-1/2 z-10" />
                  {isAfterDropTarget && !isDragging && (
                    <div className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-cyan-500 z-20" />
                  )}
                </>
              )}

              <h4 className={`font-display text-sm font-bold mb-2 line-clamp-2 transition-colors ${
                isCompletedBacklog
                  ? 'text-slate-400 line-through'
                  : 'text-slate-900 group-hover:text-cyan-600'
              }`}>
                {task.title}
              </h4>

              {/* Backlog checklist progress bar */}
              {isBacklogTask && checklistTotal > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>{checklistDone}/{checklistTotal} items</span>
                    <span>{Math.round((checklistDone / checklistTotal) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isCompletedBacklog ? 'bg-green-400' : 'bg-cyan-500'}`} style={{ width: `${(checklistDone / checklistTotal) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Linked backlog badge for non-backlog tasks */}
              {!isBacklogTask && task.linkedBacklogId && (
                <div className="flex items-center gap-1 mb-2 text-[10px] text-cyan-600">
                  <Link2 className="w-3 h-3" />
                  <span className="font-medium">Linked to backlog</span>
                </div>
              )}

              <div className="space-y-2 mb-3 font-mono text-xs">
                {task.dueDate && (
                  <div className={isCompletedBacklog ? 'text-slate-300' : 'text-slate-500'}>
                    <Calendar className="w-3 h-3 inline mr-1" /> {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
                {task.assignees.length > 0 && (
                  <div className="flex items-center gap-1">
                    {task.assignees.slice(0, 2).map((assignee) => (
                      <img key={assignee.id} src={assignee.avatar} className={`w-5 h-5 rounded-full ${isCompletedBacklog ? 'opacity-40' : ''}`} alt={assignee.name} title={assignee.name} />
                    ))}
                    {task.assignees.length > 2 && (
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">
                        +{task.assignees.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-mono">
                  {getPriorityIcon(task.priority)}
                  <span className={`text-[10px] uppercase font-bold tracking-wide ${isCompletedBacklog ? 'text-slate-300' : getPriorityTextColor(task.priority)}`}>{task.priority}</span>
                </div>
                {task.labels.length > 0 && (
                  <div className="flex gap-1 overflow-hidden">
                    {task.labels.slice(0, 1).map((label) => (
                      <span
                        key={label.id}
                        className={`font-mono text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ${isCompletedBacklog ? 'bg-slate-100 text-slate-300 border-slate-200' : `${label.bgColor} ${label.color} border ${label.borderColor}`}`}
                      >
                        {label.name}
                      </span>
                    ))}
                    {task.labels.length > 1 && (
                      <span className="font-mono text-[10px] text-slate-500 px-1">+{task.labels.length - 1}</span>
                    )}
                  </div>
                )}
              </div>
            </div>);
}

function ColumnCard({ column, tasks, isBacklog, onAddTask, onTaskClick, index }: ColumnCardProps) {
  const [element, setElement] = useState<Element | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const { isDragging } = useSortable({ 
    id: column.id, 
    index, 
    element, 
    handle: handleRef,
      data: {type: 'COLUMN', columnId: column.id}
  });

  const { ref: dropRef } = useDroppable({
    id: column.id,
    disabled: isBacklog,
  });

   return (
    <div
      ref={setElement}
      className={`group w-[280px] flex flex-col h-[fit-content] max-h-[100%] rounded-xl border ${
        isBacklog
          ? 'bg-cyan-600 border-indigo-200 text-white'
          : 'bg-slate-200/80 border-transparent'
      } ${isDragging ? 'opacity-50' : 'opacity-100'} transition-opacity`}
    >
      <div ref={handleRef} className="flex items-center justify-between py-3 px-2 mb-2 group">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
          <h3 className={`font-display font-bold text-sm uppercase tracking-wide ${isBacklog ? 'text-white' : 'text-slate-900'}`}>
            {column.name}
          </h3>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
              isBacklog
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {tasks.length}
          </span>
        </div>

        {(column.columnTypeId === 'backlog' || column.columnTypeId === 'todo') && (
          <button
            onClick={() => onAddTask(column.id)}
            className="text-slate-400 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-cyan-600 hover:bg-slate-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div ref={dropRef} className="flex-1 overflow-y-auto thin-scroll space-y-3 pb-3 px-2 pt-1">
        {tasks.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-8 font-medium">No tasks</div>
        ) : (
          tasks.map((task, idx) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              index={idx}
              isBacklogTask={isBacklog}
              isCompletedBacklog={isBacklog && !!task.isCompleted}
            />
          ))
        )}
      </div>

      {(column.columnTypeId === 'backlog' || column.columnTypeId === 'todo') && (
        <div className="px-2 py-2">
          <button
            onClick={() => onAddTask(column.id)}
            className={`w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-all ${
              isBacklog
                ? 'text-white hover:text-cyan-600 hover:bg-white'
                : 'text-slate-400 hover:text-cyan-600 hover:bg-white'
            }`}
          >
            <Plus className="w-3 h-3" />
            Add {column.columnTypeId === 'backlog' ? 'Backlog' : 'Task'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function KanbanBoardPage() {
  const [columns, setColumns] = useState<Column[]>(() => SORTED_DEFAULT_COLUMNS);
  const [tasks, setTasks] = useState<Task[]>(() => sortTasks(INITIAL_TASKS));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string>(DEFAULT_COLUMNS[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const todayIso = new Date().toISOString().slice(0, 10);

  const doneColumnIds = useMemo(
    () => new Set(columns.filter((column) => column.columnTypeId === 'done').map((column) => column.id)),
    [columns]
  );

  const completedTodayCount = useMemo(() => {
    return tasks.filter((task) => doneColumnIds.has(task.columnId) && task.completedAt === todayIso).length;
  }, [tasks, doneColumnIds, todayIso]);

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  // Find the backlog column id
  const backlogColumnId = useMemo(
    () => columns.find((col) => col.columnTypeId === 'backlog')?.id,
    [columns]
  );

  // All backlog tasks (for the "Connect with Backlog" selector)
  const backlogTasks = useMemo(
    () => tasks.filter((t) => backlogColumnId && t.columnId === backlogColumnId && !t.isCompleted),
    [tasks, backlogColumnId]
  );

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    columns.forEach((column) => {
      grouped[column.id] = [];
    });

    filteredTasks.forEach((task) => {
      if (grouped[task.columnId]) {
        grouped[task.columnId].push(task);
      }
    });

    // Sort: within backlog column, completed backlogs go to end
    Object.keys(grouped).forEach((columnId) => {
      const col = columns.find((c) => c.id === columnId);
      if (col?.columnTypeId === 'backlog') {
        grouped[columnId].sort((a, b) => {
          if (a.isCompleted && !b.isCompleted) return 1;
          if (!a.isCompleted && b.isCompleted) return -1;
          return a.order - b.order;
        });
      } else {
        grouped[columnId].sort((a, b) => a.order - b.order);
      }
    });

    return grouped;
  }, [columns, filteredTasks]);

  const openCreateTaskModal = (columnId?: string) => {
    setCreateTaskColumnId(columnId ?? columns[0]?.id ?? DEFAULT_COLUMNS[0]?.id ?? '');
    setShowCreateModal(true);
  };

  const openCreateColumnModal = () => {
    setShowCreateColumnModal(true);
  };

  const handleCreateColumn = (name: string, columnTypeId: ColumnTypeId) => {
    setColumns((previous) => {
      const generatedId = getNextColumnId(previous);

      return [
        ...previous,
        {
          id: generatedId,
          name,
          columnTypeId,
          color: COLUMN_COLOR_BY_TYPE_ID[columnTypeId],
          order: previous.length + 1,
        },
      ];
    });
    setShowCreateColumnModal(false);
  };

  const handleAddTask = (newTask: Task) => {
    const fallbackColumnId = columns[0]?.id ?? DEFAULT_COLUMNS[0].id;
    const columnId = columns.some((column) => column.id === newTask.columnId)
      ? newTask.columnId
      : fallbackColumnId;

    const nextOrder = tasks
      .filter((task) => task.columnId === columnId)
      .reduce((max, task) => Math.max(max, task.order), 0) + 1;

    const finalTask = { ...newTask, columnId, order: nextOrder };

    // If the new task is linked to a backlog, add a checklist item to that backlog
    if (finalTask.linkedBacklogId) {
      const newChecklistItem: ChecklistItem = {
        id: `check-link-${finalTask.id}`,
        text: finalTask.title,
        completed: false,
        linkedTaskId: finalTask.id,
      };

      setTasks((prev) => [
        ...prev.map((t) =>
          t.id === finalTask.linkedBacklogId
            ? { ...t, checklist: [...(t.checklist ?? []), newChecklistItem] }
            : t
        ),
        finalTask,
      ]);
    } else {
      setTasks((prev) => [...prev, finalTask]);
    }

    setShowCreateModal(false);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const currentTask = tasks.find((task) => task.id === updatedTask.id);
    const isDoneColumn = doneColumnIds.has(updatedTask.columnId);
    const wasDone = currentTask ? doneColumnIds.has(currentTask.columnId) : false;

    const normalizedTask: Task = {
      ...updatedTask,
      completedAt: isDoneColumn ? currentTask?.completedAt ?? todayIso : undefined,
    };

    let newTasks = tasks.map((task) => (task.id === normalizedTask.id ? normalizedTask : task));

    // Sync checklist if the task moved to/from Done
    if (normalizedTask.linkedBacklogId && isDoneColumn !== wasDone) {
      newTasks = newTasks.map((t) => {
        if (t.id === normalizedTask.linkedBacklogId) {
          const updatedChecklist = (t.checklist ?? []).map((item) =>
            item.linkedTaskId === normalizedTask.id
              ? { ...item, completed: isDoneColumn }
              : item
          );
          return { ...t, checklist: updatedChecklist };
        }
        return t;
      });
      newTasks = recomputeBacklogCompletion(newTasks, normalizedTask.linkedBacklogId);
    }

    setTasks(newTasks);
    setSelectedTask(normalizedTask);
  };

  const handleAddColumn = () => {
    openCreateColumnModal();
  };

  // Helper: recompute backlog completion status
  const recomputeBacklogCompletion = useCallback((allTasks: Task[], backlogId: string): Task[] => {
    const backlog = allTasks.find((t) => t.id === backlogId);
    if (!backlog) return allTasks;

    const checklist = backlog.checklist ?? [];
    if (checklist.length === 0) return allTasks;

    const allDone = checklist.every((item) => item.completed);

    return allTasks.map((t) =>
      t.id === backlogId ? { ...t, isCompleted: allDone } : t
    );
  }, []);

  const handleDragEnd = (event: any) => {
    if (event.canceled || !event.operation.target) return;

    const activeId = String(event.operation.source.id);
    const overId = String(event.operation.target.id);
    const type = event.operation.source.data?.type;
    const overData = event.operation.target.data;

    if (type === 'COLUMN') {
        if (overData?.type === 'TASK_INSERT' || overData?.type === 'TASK') 
        {
            const targetColumnId = String(overData.fromColumnId);
            if (targetColumnId === activeId) return;

            setColumns((prev) => {
            const activeIndex = prev.findIndex((col) => col.id === activeId);
            const targetIndex = prev.findIndex((col) => col.id === targetColumnId);

            if (activeIndex === -1 || targetIndex === -1) return prev;

            const newColumns = [...prev];
            const [moved] = newColumns.splice(activeIndex, 1);

            newColumns.splice(targetIndex, 0, moved);

            return newColumns.map((col, index) => ({
                ...col,
                order: index + 1,
            }));
            });
            return;
        };
      setColumns((prev) =>
        move(prev, event).map((column, index) => ({
          ...column,
          order: index + 1,
        }))
      );
      return;
    }

   if (type === 'TASK') {
  setTasks((prevTasks) => {
    const activeTask = prevTasks.find((t) => t.id === activeId);
    if (!activeTask) return prevTasks;

    // BLOCK: backlog tasks cannot be dragged to other columns
    const sourceCol = columns.find((c) => c.id === activeTask.columnId);
    if (sourceCol?.columnTypeId === 'backlog') return prevTasks;

    const sourceColumnId = String(
      event.operation.source.data?.fromColumnId ?? activeTask.columnId
    );

    const targetColumnId =
      overData?.type === 'TASK_INSERT'
        ? String(overData.fromColumnId)
        : overData?.type === 'TASK'
          ? String(overData.fromColumnId)
          : overId;

    // BLOCK: cannot drop into backlog column
    const targetCol = columns.find((c) => c.id === targetColumnId);
    if (targetCol?.columnTypeId === 'backlog') return prevTasks;

    // 1. remover o ativo globalmente
    const withoutActive = prevTasks.filter((t) => t.id !== activeId);

    // 2. pegar apenas a coluna destino (já limpa)
    const targetTasks = withoutActive
      .filter((t) => t.columnId === targetColumnId)
      .sort((a, b) => a.order - b.order);

    // 3. índice alvo (UI manda, senão append)
    const rawIndex =
      typeof overData?.taskIndex === 'number'
        ? overData.taskIndex
        : targetTasks.length;

    const insertAt =
      overData?.type === 'TASK_INSERT' && overData.side === 'after'
        ? rawIndex + 1
        : rawIndex;

    // 4. ajuste apenas se for mesma coluna
    const sourceIndex = event.operation.source.data?.taskIndex;

    const finalIndex =
      sourceColumnId === targetColumnId && sourceIndex < insertAt
        ? insertAt - 1
        : insertAt;

    // 5. inserir
    const movedTask = { ...activeTask, columnId: targetColumnId };
    const newTargetTasks = [
      ...targetTasks.slice(0, finalIndex),
      movedTask,
      ...targetTasks.slice(finalIndex),
    ].map((t, i) => ({
      ...t,
      order: i + 1,
    }));

    // 6. juntar com o resto (tudo que não é da coluna destino)
    const others = withoutActive.filter(
      (t) => t.columnId !== targetColumnId
    );

    let result = sortTasks([...others, ...newTargetTasks]);

    // 7. SYNC: if the task is linked to a backlog, update checklist
    if (activeTask.linkedBacklogId) {
      const isDone = doneColumnIds.has(targetColumnId);
      const wasDone = doneColumnIds.has(sourceColumnId);

      if (isDone !== wasDone) {
        // Update the checklist item in the backlog
        result = result.map((t) => {
          if (t.id === activeTask.linkedBacklogId) {
            const updatedChecklist = (t.checklist ?? []).map((item) =>
              item.linkedTaskId === activeTask.id
                ? { ...item, completed: isDone }
                : item
            );
            return { ...t, checklist: updatedChecklist };
          }
          return t;
        });

        // Recompute backlog completion
        result = recomputeBacklogCompletion(result, activeTask.linkedBacklogId);
      }
    }

    return result;
  });
}
  };
 

  return (
    <div className="h-screen flex-1 min-w-0 flex flex-col bg-slate-50 overflow-hidden">
      <HeaderKanbanBoard
        onModalCreate={openCreateColumnModal}
        onViewModeChange={setViewMode}
        viewMode={viewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        completedTodayCount={completedTodayCount}
        todayLabel={todayLabel}
      />

      <DragDropProvider
        sensors={(defaults) => [
          ...defaults,
          PointerSensor.configure({
            activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })],
          }),
        ]}
        onDragEnd={handleDragEnd}>
        {columns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0">
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-6 text-slate-300">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M8 3v18"/><path d="M16 3v18"/></svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Your board is empty</h2>
            <p className="font-body text-slate-500 mt-2 mb-8 max-w-md">
              Get started by creating your first column. You can organize columns however it works best for your team's workflow.
            </p>
            <button
              onClick={handleAddColumn}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 font-body text-sm font-bold text-white shadow-[0_10px_24px_rgba(8,145,178,0.24)] transition-all hover:bg-cyan-700 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(8,145,178,0.34)]"
            >
              <Plus className="w-5 h-5" /> Add First Column
            </button>
          </div>
        ) : viewMode === 'board' ? (
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
            <div className="flex h-full gap-6 min-w-max">

            {columns.map((column, index) => {
              const isBacklog = column.columnTypeId === 'backlog';
              const columnTasks = tasksByColumn[column.id] ?? [];

              return (
                <ColumnCard
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  isBacklog={isBacklog}
                  onAddTask={openCreateTaskModal}
                  onTaskClick={setSelectedTask}
                  index={index}
                  backlogColumnId={backlogColumnId}
                />
              );
            })}
            <div className="w-[240px] flex items-start pt-1">
              <button
                onClick={handleAddColumn}
                className="w-full rounded-xl border border-dashed border-slate-300 bg-white/80 py-4 px-3 font-body text-sm font-semibold text-slate-500 hover:text-cyan-700 hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
              >
                + Add column
              </button>
            </div>
            </div>
          </div>
        ) : (
          <TaskListPage
            tasks={filteredTasks}
            columns={columns}
            onTaskClick={setSelectedTask}
            onAddTask={openCreateTaskModal}
          />
        )}
      </DragDropProvider>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreateTask={handleAddTask}
          columns={columns}
          initialColumnId={createTaskColumnId}
          backlogTasks={backlogTasks}
        />
      )}

      {showCreateColumnModal && (
        <CreateColumnModal
          onClose={() => setShowCreateColumnModal(false)}
          onCreateColumn={handleCreateColumn}
        />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          columns={columns}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </div>
  );
}
