import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import { queryClient } from '../main'

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendRequestUser {
  id: number
  username: string
  email?: string
  avatarUrl: string
  createdAt: string
  updatedAt: string
}

export interface FriendRequestItem {
  id: number
  senderId: number
  receiverId: number
  status: FriendRequestStatus
  createdAt: string
  updatedAt: string
  sender: FriendRequestUser
  receiver: FriendRequestUser
}

export interface FriendListResponse {
  success: boolean
  data: {
    friendRequests: FriendRequestItem[]
    pagination: {
      skip: number
      take: number
      total: number
    }
  }
}

export interface FriendActionResponse {
  success: boolean
  message: string
  data?: FriendRequestItem
}

const friendKeys = {
  all: ['friends'] as const,
  list: (userId: string | number, status: FriendRequestStatus, type?: 'incoming' | 'outgoing') =>
    ['friends', userId, status, type ?? 'all'] as const,
}

interface FriendListParams {
  userId: string | number
  status?: FriendRequestStatus
  type?: 'incoming' | 'outgoing'
  skip?: number
  take?: number
}

async function listFriendRequestsRequest(params: FriendListParams): Promise<FriendListResponse> {
  const { userId, status = 'accepted', type, skip, take } = params
  const response = await api.get<FriendListResponse>(`/api/users/${userId}/friends`, {
    params: { status, type, skip, take },
  })
  return response.data
}

async function sendFriendRequestRequest(friendId: string | number): Promise<FriendActionResponse> {
  const response = await api.post<FriendActionResponse>(`/api/friends/${friendId}`)
  return response.data
}

async function updateFriendRequestRequest(
  friendId: string | number,
  status: 'accepted' | 'rejected'
): Promise<FriendActionResponse> {
  const response = await api.patch<FriendActionResponse>(`/api/friends/${friendId}`, null, {
    params: { status },
  })
  return response.data
}

async function removeFriendRequest(friendId: string | number): Promise<FriendActionResponse> {
  const response = await api.delete<FriendActionResponse>(`/api/friends/${friendId}`)
  return response.data
}

export function getOtherFriendUser(request: FriendRequestItem, currentUserId: string | number): FriendRequestUser {
  return String(request.senderId) === String(currentUserId) ? request.receiver : request.sender
}

export function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function invalidateFriendQueries(userId: string | number) {
  await queryClient.invalidateQueries({ queryKey: friendKeys.all })
  await queryClient.invalidateQueries({ queryKey: friendKeys.list(userId, 'accepted') })
  await queryClient.invalidateQueries({ queryKey: friendKeys.list(userId, 'pending', 'incoming') })
  await queryClient.invalidateQueries({ queryKey: friendKeys.list(userId, 'pending', 'outgoing') })
}

export function useFriendsQuery(
  userId: string | number | undefined,
  options?: Omit<UseQueryOptions<FriendListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: friendKeys.list(userId ?? 'unknown', 'accepted'),
    queryFn: () => listFriendRequestsRequest({ userId: userId!, status: 'accepted', take: 100 }),
    enabled: userId != null,
    ...options,
  })
}

export function useIncomingFriendRequestsQuery(
  userId: string | number | undefined,
  options?: Omit<UseQueryOptions<FriendListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: friendKeys.list(userId ?? 'unknown', 'pending', 'incoming'),
    queryFn: () => listFriendRequestsRequest({ userId: userId!, status: 'pending', type: 'incoming', take: 100 }),
    enabled: userId != null,
    ...options,
  })
}

export function useOutgoingFriendRequestsQuery(
  userId: string | number | undefined,
  options?: Omit<UseQueryOptions<FriendListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: friendKeys.list(userId ?? 'unknown', 'pending', 'outgoing'),
    queryFn: () => listFriendRequestsRequest({ userId: userId!, status: 'pending', type: 'outgoing', take: 100 }),
    enabled: userId != null,
    ...options,
  })
}

export function useSendFriendRequestMutation(
  userId: string | number,
  options?: Omit<UseMutationOptions<FriendActionResponse, Error, string | number>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: (friendId: string | number) => sendFriendRequestRequest(friendId),
    onSuccess: async (data, variables, context, mutationContext) => {
      await invalidateFriendQueries(userId)
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
  })
}

export function useRespondFriendRequestMutation(
  userId: string | number,
  options?: Omit<UseMutationOptions<FriendActionResponse, Error, { friendId: string | number; status: 'accepted' | 'rejected' }>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: ({ friendId, status }) => updateFriendRequestRequest(friendId, status),
    onSuccess: async (data, variables, context, mutationContext) => {
      await invalidateFriendQueries(userId)
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
  })
}

export function useRemoveFriendMutation(
  userId: string | number,
  options?: Omit<UseMutationOptions<FriendActionResponse, Error, string | number>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: (friendId: string | number) => removeFriendRequest(friendId),
    onSuccess: async (data, variables, context, mutationContext) => {
      await invalidateFriendQueries(userId)
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
  })
}
