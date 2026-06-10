import { useQuery, useMutation, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import type { UserResponse } from '../types/user'
import { queryClient } from '../main'

export function resolveAvatarUrl(url?: string | null): string | null {
  const trimmed = url?.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('http') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
}

export interface UserListItem {
  id: string | number
  username: string
  bio: string
  email: string
  avatarUrl: string
  createdAt: string
  updatedAt: string
}

export interface UserListPagination {
  skip: number
  take: number
  total: number
}

export interface UserListResponse {
  success: boolean
  data: {
    users: UserListItem[]
    pagination: UserListPagination
  }
}

const userKeys = {
  me: ['user', 'me'] as const,
  list: ['users'] as const,
}

async function userRequest(endpoint: string): Promise<UserResponse>
{
  const response = await api.get<UserResponse>(endpoint)
  
  return response.data;
}

export const getUserRequest = () => userRequest('/api/users/me')

export function useGetUserRequest(
  options?: Omit<UseQueryOptions<UserResponse, Error>, 'queryKey' | 'queryFn'>
)
{
  return useQuery({
    queryKey: userKeys.me,
    queryFn: getUserRequest,
    ...options,
  })
}

export interface UserListQueryParams {
  search?: string
  skip?: number
  take?: number
}

async function listUsersRequest(params?: UserListQueryParams): Promise<UserListResponse> {
  const response = await api.get<UserListResponse>('/api/users', { params })
  return response.data
}

export interface UpdateUserProfilePayload {
  username?: string
  bio?: string
  avatar?: File
}

export interface DeleteUserResponse {
  success: boolean
  message: string
}

async function updateUserRequest(data: UpdateUserProfilePayload): Promise<UserResponse> {
  const formData = new FormData()

  if (data.username !== undefined) {
    formData.append('username', data.username)
  }

  if (data.bio !== undefined) {
    formData.append('bio', data.bio)
  }

  if (data.avatar) {
    formData.append('avatar', data.avatar)
  }

  const response = await api.patch<UserResponse>('/api/users/me', formData)

  return response.data
}

async function deleteUserRequest(): Promise<DeleteUserResponse> {
  const response = await api.delete<DeleteUserResponse>('/api/users/me')
  return response.data
}

export function useUsersQuery(
  params?: UserListQueryParams,
  options?: Omit<UseQueryOptions<UserListResponse, Error>, 'queryKey' | 'queryFn'>
)
{
  const normalizedParams: UserListQueryParams = {
    search: params?.search?.trim() || undefined,
    skip: params?.skip,
    take: params?.take,
  }

  return useQuery({
    queryKey: [...userKeys.list, normalizedParams],
    queryFn: () => listUsersRequest(normalizedParams),
    ...options,
  })
}

export function useUpdateUserRequest(
  options?: Omit<UseMutationOptions<UserResponse, Error, UpdateUserProfilePayload>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: updateUserRequest,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.me })
      await options?.onSuccess?.(data, variables, context)
    },
  })
}

export function useDeleteUserRequest(
  options?: Omit<UseMutationOptions<DeleteUserResponse, Error, void>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: deleteUserRequest,
    onSuccess: async (data, variables, context) => {
      localStorage.removeItem('token')
      queryClient.clear()
      await options?.onSuccess?.(data, variables, context)
    },
  })
}
