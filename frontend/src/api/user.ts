import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import type { UserResponse } from '../types/user'

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
    queryKey: ['user', 'me'],
    queryFn: getUserRequest,
    ...options,
  })
}

