import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import type { UserResponse } from '../types/user'

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

async function listUsersRequest(): Promise<UserListResponse> {
  const response = await api.get<UserListResponse>('/api/users')
  return response.data
}

export function useUsersQuery(
  options?: Omit<UseQueryOptions<UserListResponse, Error>, 'queryKey' | 'queryFn'>
)
{
  return useQuery({
    queryKey: userKeys.list,
    queryFn: listUsersRequest,
    ...options,
  })
}

