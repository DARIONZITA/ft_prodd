import { useEffect, useMemo, useState } from 'react'
import { X, MessageSquare, ChevronDown, Calendar, User2, Circle, Trash2 } from 'lucide-react'
import type { ChecklistItem, Column, ColumnTypeId, Task, TaskComment, TaskPriority } from './Types'
import {
  useTaskQuery,
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useCreateTaskCommentMutation,
  useWorkspaceLabelsQuery,
  useCreateWorkspaceLabelMutation,
  useAttachTaskLabelMutation,
  useDetachTaskLabelMutation,
  useAssignTaskUserMutation,
  useUnassignTaskUserMutation,
  useUpdateTaskMutation
} from '../../api/kanban'
import { useWorkspaceMembersQuery } from '../../api/workspace'

const COLUMN_TYPE_COLORS: Record<ColumnTypeId, { dot: string; bg: string; border: string; text: string }> = {
  backlog: { dot: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-700' },
  todo: { dot: 'bg-blue-400', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  in_progress: { dot: 'bg-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700' },
  code_review: { dot: 'bg-orange-400', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
  done: { dot: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
  custom: { dot: 'bg-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-700' },
}

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
}

interface TaskDetailPanelProps {
  workspaceId: number | string
  task: Task
  columns: Column[]
  onClose: () => void
}

export default function TaskDetailPanel({ workspaceId, task, columns, onClose }: TaskDetailPanelProps) {
  // Queries
  const { data: taskData } = useTaskQuery(task.columnId, task.id)
  const { data: labelsQuery } = useWorkspaceLabelsQuery(workspaceId)
  const { data: membersList } = useWorkspaceMembersQuery(workspaceId)

  const taskDetails = taskData?.success ? taskData.data : null

  // Local editing states
  const [editingTitle, setEditingTitle] = useState(task.title)
  const [editingDescription, setEditingDescription] = useState(task.description)
  const [editingColumnId, setEditingColumnId] = useState(task.columnId)
  const [editingPriority, setEditingPriority] = useState(task.priority)
  const [commentText, setCommentText] = useState('')
  const [newChecklistText, setNewChecklistText] = useState('')

  // Dropdown states
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false)
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('cyan')

  useEffect(() => {
    if (taskDetails) {
      setEditingTitle(taskDetails.title)
      setEditingDescription(taskDetails.description || '')
      setEditingColumnId(String(taskDetails.columnId))
      
      const priorityMap: Record<string, TaskPriority> = {
        LOW: 'Low',
        MEDIUM: 'Medium',
        HIGH: 'High'
      }
      setEditingPriority(priorityMap[taskDetails.priority] || 'Medium')
    }
  }, [taskDetails])

  // Map checklist items
  const checklistItems: ChecklistItem[] = useMemo(() => {
    if (!taskDetails) return []
    return taskDetails.checklistItems.map(item => ({
      id: String(item.id),
      text: item.description,
      completed: item.isCompleted
    }))
  }, [taskDetails])

  // Map comments
  const comments: TaskComment[] = useMemo(() => {
    if (!taskDetails?.comments) return []
    return taskDetails.comments.items.map(comment => ({
      id: String(comment.id),
      author: comment.user.username,
      avatar: comment.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.username)}`,
      text: comment.content,
      createdAt: comment.createdAt
    }))
  }, [taskDetails])

  // Map assignees
  const assignees = useMemo(() => {
    if (!taskDetails) return []
    return taskDetails.assignments.map(a => ({
      id: String(a.user.id),
      name: a.user.username,
      avatar: a.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.user.username)}&background=0891b2&color=fff`,
      initials: a.user.username.slice(0, 2).toUpperCase()
    }))
  }, [taskDetails])

  // Map task labels
  const taskLabels = useMemo(() => {
    if (!taskDetails) return []
    return taskDetails.taskLabels.map(tl => {
      const style = COLOR_MAP[tl.label.color.toLowerCase()] || COLOR_MAP.cyan
      return {
        id: String(tl.label.id),
        name: tl.label.name,
        ...style
      }
    })
  }, [taskDetails])

  // Dropdown options filters
  const availableMembers = useMemo(() => {
    if (!membersList) return []
    return membersList.filter(m => {
      return !assignees.some(a => String(a.id) === String(m.user?.id || m.userId))
    })
  }, [membersList, assignees])

  const availableLabels = useMemo(() => {
    if (!labelsQuery?.success) return []
    return labelsQuery.data.filter(l => {
      return !taskLabels.some(tl => String(tl.id) === String(l.id))
    })
  }, [labelsQuery, taskLabels])

  // Mutations
  const createChecklistMutation = useCreateChecklistItemMutation(workspaceId, task.id)
  const updateChecklistMutation = useUpdateChecklistItemMutation(workspaceId, task.id)
  const deleteChecklistMutation = useDeleteChecklistItemMutation(workspaceId, task.id)
  const createCommentMutation = useCreateTaskCommentMutation(workspaceId, task.id)
  const attachLabelMutation = useAttachTaskLabelMutation(workspaceId, task.id)
  const detachLabelMutation = useDetachTaskLabelMutation(workspaceId, task.id)
  const createWorkspaceLabelMutation = useCreateWorkspaceLabelMutation(workspaceId)
  const assignUserMutation = useAssignTaskUserMutation(workspaceId, task.id)
  const unassignUserMutation = useUnassignTaskUserMutation(workspaceId, task.id)
  const updateTaskMutation = useUpdateTaskMutation(workspaceId, task.id)

  const checklistProgress = useMemo(() => {
    if (checklistItems.length === 0) return 0
    return Math.round((checklistItems.filter((item) => item.completed).length / checklistItems.length) * 100)
  }, [checklistItems])

  const formatShortDate = (value: string) => {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  }

  const addComment = () => {
    const trimmed = commentText.trim()
    if (!trimmed) return
    createCommentMutation.mutate({ columnId: task.columnId, content: trimmed })
    setCommentText('')
  }

  const addChecklistItem = () => {
    const trimmed = newChecklistText.trim()
    if (!trimmed) return
    createChecklistMutation.mutate({ columnId: task.columnId, description: trimmed })
    setNewChecklistText('')
  }

  const toggleChecklistItem = (itemId: string) => {
    const item = checklistItems.find((i) => i.id === itemId)
    if (!item) return
    updateChecklistMutation.mutate({
      columnId: task.columnId,
      itemId: Number(itemId),
      isCompleted: !item.completed
    })
  }

  const handleDeleteChecklistItem = (itemId: string) => {
    deleteChecklistMutation.mutate({
      columnId: task.columnId,
      itemId: Number(itemId)
    })
  }

  const handleAttachLabel = (labelId: string) => {
    attachLabelMutation.mutate({ columnId: task.columnId, labelId: Number(labelId) })
  }

  const handleDetachLabel = (labelId: string) => {
    detachLabelMutation.mutate({ columnId: task.columnId, labelId: Number(labelId) })
  }

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newLabelName.trim()
    if (!name) return
    createWorkspaceLabelMutation.mutate({ name, color: newLabelColor }, {
      onSuccess: (data) => {
        if (data.success && data.data) {
          handleAttachLabel(String(data.data.id))
        }
        setNewLabelName('')
        setShowLabelsDropdown(false)
      }
    })
  }

  const handleAssignUser = (userId: string) => {
    assignUserMutation.mutate({ columnId: task.columnId, userId: Number(userId) })
  }

  const handleUnassignUser = (userId: string) => {
    unassignUserMutation.mutate({ columnId: task.columnId, userId: Number(userId) })
  }

  const handleSave = () => {
    const priorityMapRev: Record<TaskPriority, 'LOW' | 'MEDIUM' | 'HIGH'> = {
      High: 'HIGH',
      Medium: 'MEDIUM',
      Low: 'LOW'
    }
    updateTaskMutation.mutate({
      columnId: task.columnId,
      taskId: task.id,
      payload: {
        title: editingTitle.trim(),
        description: editingDescription.trim(),
        priority: priorityMapRev[editingPriority]
      }
    }, {
      onSuccess: () => {
        onClose()
      }
    })
  }

  const selectedColumn = columns.find((column) => column.id === editingColumnId) ?? columns[0]
  const colorConfig = COLUMN_TYPE_COLORS[selectedColumn?.columnTypeId ?? 'custom']
  const PriorityIcon = () => {
    if (editingPriority === 'High') return <Circle className="w-3 h-3 fill-red-500 text-red-500" />
    if (editingPriority === 'Medium') return <Circle className="w-3 h-3 fill-amber-500 text-amber-500" />
    return <Circle className="w-3 h-3 fill-green-500 text-green-500" />
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-20" />

      {/* Panel */}
      <div className="fixed left-1/2 top-1/2 w-[min(1120px,calc(100vw-2rem))] h-[min(760px,calc(100vh-2rem))] -translate-x-1/2 -translate-y-1/2 bg-white text-slate-900 shadow-2xl z-20 flex flex-col border border-slate-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {/* Status */}
            <div
              onClick={() => {
                if (!columns.length) return
                const currentIndex = columns.findIndex((column) => column.id === editingColumnId)
                const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % columns.length
                setEditingColumnId(columns[nextIndex].id)
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
                      Creator
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {assignees.map((assignee) => (
                        <div key={assignee.id} className="relative group/avatar">
                          <img src={assignee.avatar} className="w-7 h-7 rounded-full ring-1 ring-slate-200" title={assignee.name} alt={assignee.name} />
                          <button
                            type="button"
                            onClick={() => handleUnassignUser(assignee.id)}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                            title="Remove Assignee"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAssigneesDropdown(!showAssigneesDropdown)}
                          className="w-7 h-7 rounded-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          <span className="text-xs font-bold">+</span>
                        </button>
                        {showAssigneesDropdown && (
                          <div className="absolute left-0 mt-1 z-10 w-48 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg p-1.5 space-y-1">
                            {availableMembers.length === 0 ? (
                              <p className="p-2 text-xs text-slate-400 text-center">All members assigned</p>
                            ) : (
                              availableMembers.map((member) => {
                                const username = member.user?.username || 'User'
                                const avatar = member.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`
                                return (
                                  <button
                                    key={member.userId}
                                    type="button"
                                    onClick={() => {
                                      handleAssignUser(String(member.userId))
                                      setShowAssigneesDropdown(false)
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                                  >
                                    <img src={avatar} className="w-5 h-5 rounded-full" />
                                    <span className="truncate flex-1">{username}</span>
                                  </button>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Priority</div>
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => {
                      const priorities: TaskPriority[] = ['High', 'Medium', 'Low']
                      const idx = priorities.indexOf(editingPriority)
                      setEditingPriority(priorities[(idx + 1) % priorities.length])
                    }}>
                      <span className="text-sm"><PriorityIcon /></span>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-cyan-700 transition-colors">{editingPriority}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Column</div>
                    <div className="text-sm text-slate-700">{selectedColumn?.name ?? 'Column'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Labels</span>
                  {taskLabels.map((label) => (
                    <span key={label.id} className={`${label.bgColor} ${label.color} border ${label.borderColor} text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1`}>
                      {label.name}
                      <button
                        type="button"
                        onClick={() => handleDetachLabel(label.id)}
                        className="hover:text-red-500 font-bold ml-1 text-[10px]"
                        title="Detach label"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  
                  {/* Add Label Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                      className="text-slate-500 hover:text-cyan-700 border border-dashed border-slate-300 hover:border-cyan-400 text-xs px-2.5 py-1 rounded-full transition-colors bg-white flex items-center gap-1"
                    >
                      + Add label
                    </button>
                    {showLabelsDropdown && (
                      <div className="absolute left-0 mt-1 z-10 w-56 rounded-xl border border-slate-200 bg-white shadow-xl p-3 space-y-3">
                        <div className="text-xs font-bold text-slate-700">Workspace Labels</div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {availableLabels.length === 0 ? (
                            <p className="text-[10px] text-slate-400">All labels attached</p>
                          ) : (
                            availableLabels.map(l => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => {
                                  handleAttachLabel(String(l.id))
                                  setShowLabelsDropdown(false)
                                }}
                                className="w-full text-left text-xs px-2 py-1 rounded hover:bg-slate-50 flex items-center gap-2"
                              >
                                <span className={`w-3.5 h-3.5 rounded-full bg-${l.color}-500`} />
                                <span className="font-medium text-slate-700">{l.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                        
                        <div className="border-t border-slate-100 pt-2">
                          <div className="text-xs font-bold text-slate-700 mb-1.5">Create Workspace Label</div>
                          <form onSubmit={handleCreateLabel} className="space-y-2">
                            <input
                              type="text"
                              placeholder="Label name"
                              value={newLabelName}
                              onChange={(e) => setNewLabelName(e.target.value)}
                              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-cyan-500"
                            />
                            <select
                              value={newLabelColor}
                              onChange={(e) => setNewLabelColor(e.target.value)}
                              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 outline-none bg-white"
                            >
                              <option value="red">Red</option>
                              <option value="orange">Orange</option>
                              <option value="yellow">Yellow</option>
                              <option value="green">Green</option>
                              <option value="blue">Blue</option>
                              <option value="purple">Purple</option>
                              <option value="pink">Pink</option>
                              <option value="cyan">Cyan</option>
                              <option value="teal">Teal</option>
                              <option value="indigo">Indigo</option>
                            </select>
                            <button
                              type="submit"
                              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs py-1.5 rounded transition-colors"
                            >
                              Create & Add
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 mb-5"></div>

                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-sm text-slate-900">Description</h3>
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
                        <div key={item.id} className="group flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors border-slate-200 bg-slate-50 hover:bg-white">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(item.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer animate-none"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm leading-6 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {item.text}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 rounded hover:bg-slate-100 cursor-pointer flex-shrink-0"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}

                    <div className="flex gap-2 pt-2">
                      <input
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addChecklistItem()
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
  )
}
