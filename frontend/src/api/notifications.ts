import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import { queryClient } from '../query-client'

export type NotificationType = 'friendship' | 'workspace' | 'task' | 'mention' | 'comment' | 'invite'

export interface ApiNotification {
  id: number
  userId: number
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationsListResponse {
  success: boolean
  data: {
    notifications: ApiNotification[]
    pagination: {
      skip: number
      take: number
      total: number
    }
  }
}

export interface NotificationActionResponse {
  success: boolean
  data: ApiNotification
}

export interface NotificationsQueryParams {
  type?: string
  sort?: 'newest' | 'oldest'
  skip?: number
  take?: number
}

export const notificationsKeys = {
  all: ['notifications'] as const,
  list: (params?: NotificationsQueryParams) => ['notifications', params ?? {}] as const,
}

async function listNotificationsRequest(params?: NotificationsQueryParams): Promise<NotificationsListResponse> {
  const response = await api.get<NotificationsListResponse>('/api/notifications', { params })
  return response.data
}

async function markNotificationReadRequest(id: number | string): Promise<NotificationActionResponse> {
  const response = await api.patch<NotificationActionResponse>(`/api/notifications/${id}/read`)
  return response.data
}

async function markAllNotificationsReadRequest(): Promise<{ success: boolean; data: { updatedCount: number } }> {
  const response = await api.patch<{ success: boolean; data: { updatedCount: number } }>('/api/notifications/read-all')
  return response.data
}

export function useNotificationsQuery(
  params?: NotificationsQueryParams,
  options?: Omit<UseQueryOptions<NotificationsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => listNotificationsRequest(params),
    ...options,
  })
}

export function useMarkNotificationReadMutation(
  options?: Omit<UseMutationOptions<NotificationActionResponse, Error, number | string>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: (id: number | string) => markNotificationReadRequest(id),
    onSuccess: (data, id, context) => {
      // Update all matching queries dynamically
      queryClient.setQueriesData({ queryKey: notificationsKeys.all }, (oldData: any) => {
        if (!oldData || !oldData.success) return oldData
        return {
          ...oldData,
          data: {
            ...oldData.data,
            notifications: oldData.data.notifications.map((n: any) =>
              n.id === Number(id) ? { ...n, isRead: true } : n
            )
          }
        }
      })
      options?.onSuccess?.(data, id, context, undefined as any)
    }
  })
}

export function useMarkAllNotificationsReadMutation(
  options?: Omit<UseMutationOptions<{ success: boolean; data: { updatedCount: number } }, Error, void>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: () => markAllNotificationsReadRequest(),
    onSuccess: (data, variables, context) => {
      queryClient.setQueriesData({ queryKey: notificationsKeys.all }, (oldData: any) => {
        if (!oldData || !oldData.success) return oldData
        return {
          ...oldData,
          data: {
            ...oldData.data,
            notifications: oldData.data.notifications.map((n: any) => ({ ...n, isRead: true }))
          }
        }
      })
      options?.onSuccess?.(data, variables, context, undefined as any)
    }
  })
}
