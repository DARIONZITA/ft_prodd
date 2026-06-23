import { useQuery, useMutation, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import { queryClient } from '../query-client'

export interface ApiChecklistItem {
  id: number
  taskId: number
  description: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiLabel {
  id: number
  workspaceId: number
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface ApiUserRef {
  id: number
  username: string
  avatarUrl: string
}

export interface ApiAssignment {
  id: number
  taskId: number
  userId: number
  assignedById: number
  createdAt: string
  user: ApiUserRef
}

export interface ApiComment {
  id: number
  taskId: number
  userId: number
  content: string
  createdAt: string
  user: ApiUserRef
}

export interface ApiTaskDetails {
  id: number
  columnId: number
  creatorId: number
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  isDone: boolean
  dateCompleted: string | null
  createdAt: string
  updatedAt: string
  assignments: ApiAssignment[]
  checklistItems: ApiChecklistItem[]
  taskLabels: { id: number; label: ApiLabel }[]
  comments?: {
    items: ApiComment[]
    pagination: { skip: number; take: number; total: number }
  }
}

export interface DashboardColumn {
  id: number
  name: string
  columnType: string
  order: number
  tasks: {
    id: number
    title: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    dueDate: string | null
    labels: string[]
    assignments: string[]
    checklist?: { id: number; description: string; isCompleted: boolean }[]
  }[]
}

export interface DashboardResponse {
  success: boolean
  data: {
    workspace: {
      id: number
      name: string
      description: string
      createdAt: string
    }
    totalMembers: number
    columns: DashboardColumn[]
  }
}

// Keys
export const kanbanKeys = {
  dashboard: (workspaceId: number | string) => ['workspace-dashboard', workspaceId] as const,
  task: (taskId: number | string) => ['task-details', String(taskId)] as const,
  workspaceLabels: (workspaceId: number | string) => ['workspace-labels', workspaceId] as const,
}

// Workspace Dashboard Query
export function useWorkspaceDashboardQuery(
  workspaceId: number | string | undefined,
  options?: Omit<UseQueryOptions<DashboardResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: kanbanKeys.dashboard(workspaceId ?? 'unknown'),
    queryFn: async () => {
      const response = await api.get<DashboardResponse>(`/api/workspaces/${workspaceId}/dashboard`)
      return response.data
    },
    enabled: workspaceId !== undefined,
    ...options,
  })
}

// Columns Mutations
export function useCreateColumnMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async ({ name, columnType }: { name: string; columnType?: string }) => {
      const response = await api.post(`/api/workspaces/${workspaceId}/columns`, { name, columnType })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useUpdateColumnMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, name }: { columnId: number | string; name: string }) => {
      const response = await api.patch(`/api/workspaces/${workspaceId}/columns/${columnId}`, { name })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useDeleteColumnMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async (columnId: number | string) => {
      const response = await api.delete(`/api/workspaces/${workspaceId}/columns/${columnId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useReorderColumnsMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async (columns: { id: number; order: number }[]) => {
      const response = await api.patch(`/api/workspaces/${workspaceId}/columns/reorder`, { columns })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

// Tasks Mutations
export function useCreateTaskMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, title, description, priority, dueDate, assignees, labels, linkedBacklogId }: {
      columnId: number | string
      title: string
      description?: string
      priority?: 'LOW' | 'MEDIUM' | 'HIGH'
      dueDate?: string | null
      assignees?: number[]
      labels?: number[]
      linkedBacklogId?: number | null
    }) => {
      const response = await api.post(`/api/columns/${columnId}/tasks`, {
        title, description, priority, dueDate, assignees, labels, linkedBacklogId
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useUpdateTaskMutation(workspaceId: number | string, taskId?: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, taskId, payload }: {
      columnId: number | string
      taskId: number | string
      payload: {
        title?: string
        description?: string
        priority?: 'LOW' | 'MEDIUM' | 'HIGH'
        dueDate?: string | null
        isDone?: boolean
      }
    }) => {
      const response = await api.patch(`/api/columns/${columnId}/tasks/${taskId}`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
      }
    }
  })
}

export function useDeleteTaskMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, taskId }: { columnId: number | string; taskId: number | string }) => {
      const response = await api.delete(`/api/columns/${columnId}/tasks/${taskId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useMoveTaskMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, taskId, targetColumnId, afterTaskId }: {
      columnId: number | string
      taskId: number | string
      targetColumnId: number | string
      afterTaskId?: number | null
    }) => {
      const response = await api.patch(`/api/columns/${columnId}/tasks/${taskId}/move`, { targetColumnId, afterTaskId })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useReorderTasksMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, tasks }: { columnId: number | string; tasks: { id: number; order: number }[] }) => {
      const response = await api.patch(`/api/columns/${columnId}/tasks/reorder`, { tasks })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

// Task Details Query
export function useTaskQuery(
  columnId: number | string | undefined,
  taskId: number | string | undefined,
  options?: Omit<UseQueryOptions<{ success: boolean; data: ApiTaskDetails }, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: kanbanKeys.task(taskId ?? 'unknown'),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ApiTaskDetails }>(`/api/columns/${columnId}/tasks/${taskId}`)
      return response.data
    },
    enabled: columnId !== undefined && taskId !== undefined,
    ...options,
  })
}

// Checklist Mutations
export function useCreateChecklistItemMutation(workspaceId: number | string, taskId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, description }: { columnId: number | string; description: string }) => {
      const response = await api.post(`/api/columns/${columnId}/tasks/${taskId}/checklists`, { description })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useUpdateChecklistItemMutation(workspaceId: number | string, taskId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, itemId, description, isCompleted }: {
      columnId: number | string
      itemId: number | string
      description?: string
      isCompleted?: boolean
    }) => {
      const response = await api.patch(`/api/columns/${columnId}/tasks/${taskId}/checklists/${itemId}`, { description, isCompleted })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useDeleteChecklistItemMutation(workspaceId: number | string, taskId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, itemId }: { columnId: number | string; itemId: number | string }) => {
      const response = await api.delete(`/api/columns/${columnId}/tasks/${taskId}/checklists/${itemId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

// Workspace Labels Query
export function useWorkspaceLabelsQuery(
  workspaceId: number | string | undefined,
  options?: Omit<UseQueryOptions<{ success: boolean; data: ApiLabel[] }, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: kanbanKeys.workspaceLabels(workspaceId ?? 'unknown'),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ApiLabel[] }>(`/api/workspaces/${workspaceId}/labels`)
      return response.data
    },
    enabled: workspaceId !== undefined,
    ...options,
  })
}

// Workspace Label Mutations (Creating / Deleting workspace-wide labels)
export function useCreateWorkspaceLabelMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const response = await api.post(`/api/workspaces/${workspaceId}/labels`, { name, color })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.workspaceLabels(workspaceId) })
    }
  })
}

export function useDeleteWorkspaceLabelMutation(workspaceId: number | string) {
  return useMutation({
    mutationFn: async (labelId: number | string) => {
      const response = await api.delete(`/api/workspaces/${workspaceId}/labels/${labelId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.workspaceLabels(workspaceId) })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

// Task Label Mutations (Attaching / Detaching labels to/from task)
export function useAttachTaskLabelMutation(workspaceId: number | string, taskId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, labelId }: { columnId: number | string; labelId: number | string }) => {
      const response = await api.post(`/api/columns/${columnId}/tasks/${taskId}/labels/${labelId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useDetachTaskLabelMutation(workspaceId: number | string, taskId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, labelId }: { columnId: number | string; labelId: number | string }) => {
      const response = await api.delete(`/api/columns/${columnId}/tasks/${taskId}/labels/${labelId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

// Task Assignment Mutations
export function useAssignTaskUserMutation(workspaceId: number | string, taskId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, userId }: { columnId: number | string; userId: number | string }) => {
      const response = await api.post(`/api/columns/${columnId}/tasks/${taskId}/assignments/${userId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

export function useUnassignTaskUserMutation(workspaceId: number | string, taskId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, userId }: { columnId: number | string; userId: number | string }) => {
      const response = await api.delete(`/api/columns/${columnId}/tasks/${taskId}/assignments/${userId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.dashboard(workspaceId) })
    }
  })
}

// Task Comments
export function useCreateTaskCommentMutation(_workspaceId: number | string, taskId: number | string) {
  return useMutation({
    mutationFn: async ({ columnId, content }: { columnId: number | string; content: string }) => {
      const response = await api.post(`/api/columns/${columnId}/tasks/${taskId}/comments`, { content })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
    }
  })
}
