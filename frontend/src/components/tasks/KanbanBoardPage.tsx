import { useMemo, useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Link2, Circle, Trash2 } from 'lucide-react';
import type { Column, ColumnTypeId, Task, TaskPriority } from './Types';
import { useDroppable, DragDropProvider, useDragDropManager} from '@dnd-kit/react';
import {useSortable} from '@dnd-kit/react/sortable';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import CreateTaskModal from './CreateTaskModal';
import CreateColumnModal from './CreateColumnModal';
import {move} from '@dnd-kit/helpers';
import TaskDetailPanel from './TaskDetailPanel';
import { HeaderKanbanBoard } from './HeaderKanbanBoard';
import TaskListPage from './TaskListPage';
import ManageLabelsModal from './ManageLabelsModal';
import type { WorkspaceRole } from '../../api/workspace';
import {
  useWorkspaceDashboardQuery,
  useCreateColumnMutation,
  useDeleteColumnMutation,
  useCreateTaskMutation,
  useMoveTaskMutation,
  useReorderTasksMutation,
  useReorderColumnsMutation,
  kanbanKeys,
} from '../../api/kanban';
import { queryClient } from '../../main';
import api from '../../api/axios';

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
  onDeleteColumn?: (id: string) => void;
  index: number;
  backlogColumnId?: string;
}



function TaskCard({ task, onClick, index, isBacklogTask, isCompletedBacklog }: { task: Task; onClick: (task: Task) => void; index: number; isBacklogTask?: boolean; isCompletedBacklog?: boolean }) {
  const [element, setElement] = useState<Element | null>(null);
  const moveMouse = useRef({ x: 0, y: 0 });
  const [animationLeft, setAnimationLeaft] = useState<boolean>(true);

  const { isDragging } = useSortable({
    id: task.id,
    element,
    handle: element,
    index,
    disabled: isCompletedBacklog,
    data: { type: 'TASK', taskId: task.id, fromColumnId: task.columnId, taskIndex: index }
  });

  const { ref: beforeRef, isDropTarget: isBeforeDropTarget } = useDroppable({
    id: `${task.id}::before`,
    disabled: isCompletedBacklog,
    data: { type: 'TASK_INSERT', taskId: task.id, fromColumnId: task.columnId, side: 'before', taskIndex: index }
  });

  const { ref: afterRef, isDropTarget: isAfterDropTarget } = useDroppable({
    id: `${task.id}::after`,
    disabled: isCompletedBacklog,
    data: { type: 'TASK_INSERT', taskId: task.id, fromColumnId: task.columnId, side: 'after', taskIndex: index }
  });

  const isExpired = task.dueDate ? new Date(task.dueDate) <= new Date() : false;

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
    if (manager) {
      manager.monitor.addEventListener("dragmove", listener);
      return () => manager.monitor.removeEventListener("dragmove", listener);
    }
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
                  : isExpired
                    ? 'bg-white border-red-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer hover:border-red-400'
                    : isBacklogTask
                      ? 'bg-white border-slate-200 hover:shadow-md cursor-pointer'
                      : 'bg-white border-slate-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer hover:border-slate-300'
              }`}
            >
              {!isCompletedBacklog && (
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
                  <div className={isCompletedBacklog ? 'text-slate-300' : isExpired ? 'text-red-500' : 'text-slate-500'}>
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

function ColumnCard({ column, tasks, isBacklog, onAddTask, onTaskClick, onDeleteColumn, index }: ColumnCardProps) {
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

        <div className="flex items-center gap-1">
          {(column.columnTypeId === 'backlog' || column.columnTypeId === 'todo') && (
            <button
              onClick={() => onAddTask(column.id)}
              className="text-slate-400 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-cyan-600 hover:bg-slate-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {onDeleteColumn && (
            <button
              onClick={() => onDeleteColumn(column.id)}
              className="text-slate-400 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 hover:bg-slate-200"
              title="Delete Column"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
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

interface KanbanBoardPageProps {
  workspaceId?: number | string
  onOpenSettings?: () => void
  onOpenMembers?: () => void
  dateWorkspace: string
  workspaceRole?: WorkspaceRole
}

export default function KanbanBoardPage({ workspaceId, onOpenSettings, onOpenMembers, dateWorkspace, workspaceRole }: KanbanBoardPageProps) {
  const [columns, setColumns] = useState<Column[]>(() => SORTED_DEFAULT_COLUMNS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string>(DEFAULT_COLUMNS[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // React Query Dashboard Load
  const { data: dashboardData } = useWorkspaceDashboardQuery(workspaceId);

  // Sync columns & tasks with backend
  useEffect(() => {
    if (dashboardData?.success && dashboardData.data) {
      const dbColumns = dashboardData.data.columns;

      const mappedColumns: Column[] = dbColumns.map((col) => {
        // Use columnType from backend directly — no name guessing
        const typeMap: Record<string, ColumnTypeId> = {
          backlog: 'backlog',
          todo: 'todo',
          in_progress: 'in_progress',
          code_review: 'code_review',
          done: 'done',
          custom: 'custom',
        };
        const columnTypeId: ColumnTypeId = typeMap[col.columnType] ?? 'custom';
        const color = COLUMN_COLOR_BY_TYPE_ID[columnTypeId];

        return {
          id: String(col.id),
          name: col.name,
          columnTypeId,
          color,
          order: col.order
        };
      });

      const mappedTasks: Task[] = [];
      dbColumns.forEach((col) => {
        col.tasks.forEach((t, index) => {
          const priorityMap: Record<string, TaskPriority> = {
            LOW: 'Low',
            MEDIUM: 'Medium',
            HIGH: 'High'
          };

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

          mappedTasks.push({
            id: String(t.id),
            title: t.title,
            description: '',
            columnId: String(col.id),
            priority: priorityMap[t.priority] || 'Medium',
            order: index + 1,
            dueDate: t.dueDate ?? undefined,
            assignees: t.assignments.map((username, aIdx) => ({
              id: `assignee-${aIdx}-${username}`,
              name: username,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0891b2&color=fff`,
              initials: username.slice(0, 2).toUpperCase()
            })),
            labels: t.labels.map((lbl, lIdx) => {
              const style = COLOR_MAP[lbl.toLowerCase()] || COLOR_MAP.cyan;
              return {
                id: `label-${lIdx}-${lbl}`,
                name: lbl,
                ...style
              };
            }),
            checklist: t.checklist ? t.checklist.map((ci) => {
              const match = ci.description.match(/^LINK::(\d+)::(.*)$/);
              return {
                id: String(ci.id),
                text: match ? match[2] : ci.description,
                completed: ci.isCompleted,
                linkedTaskId: match ? `TASK-${match[1]}` : undefined
              };
            }) : [],
            createdBy: {
              id: 'creator',
              name: 'Creator',
              avatar: 'https://ui-avatars.com/api/?name=Creator',
              initials: 'CR'
            },
            createdAt: new Date().toISOString()
          });
        });
      });

      // Resolve linkedBacklogId for each task
      mappedTasks.forEach((task) => {
        const link = mappedTasks.find((backlogTask) => {
          const backlogCol = mappedColumns.find(c => c.id === backlogTask.columnId);
          if (backlogCol?.columnTypeId !== 'backlog') return false;
          return backlogTask.checklist?.some(ci => ci.linkedTaskId === `TASK-${task.id}` || ci.linkedTaskId === task.id);
        });
        if (link) {
          task.linkedBacklogId = link.id;
        }
      });

      setColumns(mappedColumns);
      setTasks(mappedTasks);
    }
  }, [dashboardData]);

  // Mutations
  const createColumnMutation = useCreateColumnMutation(workspaceId ?? 0);
  const deleteColumnMutation = useDeleteColumnMutation(workspaceId ?? 0);
  const createTaskMutation = useCreateTaskMutation(workspaceId ?? 0);
  const moveColumnMutation = useReorderColumnsMutation(workspaceId ?? 0);
  const moveTaskMutation = useMoveTaskMutation(workspaceId ?? 0);
  const reorderTasksMutation = useReorderTasksMutation(workspaceId ?? 0);
  const userMode: 'Admin' | 'Member' | 'Viewer' = useMemo(() => {
    if (workspaceRole === 'admin') return 'Admin';
    if (workspaceRole === 'member') return 'Member';
    return 'Viewer';
  }, [workspaceRole]);
  const doneColumnIds = useMemo(
    () => new Set(columns.filter((column) => column.columnTypeId === 'done').map((column) => column.id)),
    [columns]
  );

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
    createColumnMutation.mutate({ name, columnType: columnTypeId });
    setShowCreateColumnModal(false);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (confirm('Are you sure you want to delete this column and all its tasks?')) {
      deleteColumnMutation.mutate(Number(columnId));
    }
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdBy' | 'createdAt'>) => {
    createTaskMutation.mutate({
      columnId: Number(newTask.columnId),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
      assignees: newTask.assignees.map(a => Number(a.id)).filter(n => !isNaN(n) && n > 0),
      labels: newTask.labels.map(l => Number(l.id)).filter(n => !isNaN(n) && n > 0),
      linkedBacklogId: newTask.linkedBacklogId ? Number(newTask.linkedBacklogId) : null,
    }, {
      onSuccess: () => {
        setShowCreateModal(false);
        queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId ?? 0) });
      }
    });
  };

  const handleAddColumn = () => {
    openCreateColumnModal();
  };

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
      // Sync: move call
      const reordered = move(columns, event).map((column, index) => ({
        id: Number(column.id),
        order: index + 1,
      }));
      moveColumnMutation.mutate(reordered);
      return;
    }

  if (type === 'TASK') {
  setTasks((prevTasks) => {
    const activeTask = prevTasks.find((t) => t.id === activeId);
    if (!activeTask) return prevTasks;

    const sourceColumnId = String(
      event.operation.source.data?.fromColumnId ?? activeTask.columnId
    );

    const targetColumnId =
      overData?.type === 'TASK_INSERT'
        ? String(overData.fromColumnId)
        : overData?.type === 'TASK'
          ? String(overData.fromColumnId)
          : overId;

    const sourceCol = columns.find((c) => c.id === sourceColumnId);
    const targetCol = columns.find((c) => c.id === targetColumnId);

    const isSourceBacklog = sourceCol?.columnTypeId === 'backlog';
    const isTargetBacklog = targetCol?.columnTypeId === 'backlog';

    // BLOCK: backlog tasks cannot be dragged to other columns
    if (isSourceBacklog && !isTargetBacklog) return prevTasks;

    // BLOCK: cannot drop other tasks into backlog column
    if (!isSourceBacklog && isTargetBacklog) return prevTasks;

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

    const result = sortTasks([...others, ...newTargetTasks]);

    // Sync: move call
    if (sourceColumnId !== targetColumnId) {
      moveTaskMutation.mutate({
        columnId: Number(sourceColumnId),
        taskId: Number(activeId),
        targetColumnId: Number(targetColumnId),
        afterTaskId: null
      }, {
        onSuccess: () => {
          if (activeTask.linkedBacklogId) {
            const isDone = doneColumnIds.has(targetColumnId);
            const wasDone = doneColumnIds.has(sourceColumnId);

            if (isDone !== wasDone) {
              const backlogTask = tasks.find(t => t.id === activeTask.linkedBacklogId);
              if (backlogTask) {
                const item = backlogTask.checklist?.find(ci => ci.linkedTaskId === `TASK-${activeTask.id}` || ci.linkedTaskId === activeTask.id);
                if (item) {
                  api.patch(`/api/columns/${backlogTask.columnId}/tasks/${backlogTask.id}/checklists/${item.id}`, {
                    isCompleted: isDone
                  }).then(() => {
                    queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId ?? 0) });
                  });
                }
              }
            }
          }
        }
      });
    } else {
      reorderTasksMutation.mutate({
        columnId: Number(sourceColumnId),
        tasks: newTargetTasks.map((t, idx) => ({ id: Number(t.id), order: idx }))
      });
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
        workspaceCreatedAt={new Date(dateWorkspace)}
        onOpenSettings={onOpenSettings}
        onOpenMembers={onOpenMembers}
        onOpenLabels={() => setShowLabelsModal(true)}
        userMode={userMode}
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
                  onDeleteColumn={handleDeleteColumn}
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
          workspaceId={workspaceId ?? 0}
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
          workspaceId={workspaceId ?? 0}
          task={selectedTask}
          columns={columns}
          onClose={() => setSelectedTask(null)}

        />
      )}

  
      <ManageLabelsModal
        isOpen={showLabelsModal}
        onClose={() => setShowLabelsModal(false)}
        workspaceId={workspaceId ?? 0}
      />
    </div>
  );
}
