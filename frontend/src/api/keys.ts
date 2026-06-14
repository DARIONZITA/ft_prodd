import { useQuery, useMutation, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import { queryClient } from '../main'

export interface ApiKeyItem {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface ApiKeysListResponse {
  success: boolean
  data: ApiKeyItem[]
}

export interface CreateApiKeyResponse {
  success: boolean
  message: string
  data: {
    id: number
    name: string
    createdAt: string
    key: string
  }
}

export interface DeleteApiKeyResponse {
  success: boolean
  message: string
}

const keyKeys = {
  list: ['apiKeys'] as const,
}

async function listApiKeysRequest(): Promise<ApiKeysListResponse> {
  const response = await api.get<ApiKeysListResponse>('/api/keys')
  return response.data
}

async function createApiKeyRequest(name: string): Promise<CreateApiKeyResponse> {
  const response = await api.post<CreateApiKeyResponse>('/api/keys', { name })
  return response.data
}

async function deleteApiKeyRequest(id: number): Promise<DeleteApiKeyResponse> {
  const response = await api.delete<DeleteApiKeyResponse>(`/api/keys/${id}`)
  return response.data
}

export function useListApiKeysQuery(
  options?: Omit<UseQueryOptions<ApiKeysListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: keyKeys.list,
    queryFn: listApiKeysRequest,
    ...options,
  })
}

export function useCreateApiKeyMutation(
  options?: Omit<UseMutationOptions<CreateApiKeyResponse, Error, string>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: createApiKeyRequest,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: keyKeys.list })
      await options?.onSuccess?.(data, variables, context)
    },
  })
}

export function useDeleteApiKeyMutation(
  options?: Omit<UseMutationOptions<DeleteApiKeyResponse, Error, number>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: deleteApiKeyRequest,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: keyKeys.list })
      await options?.onSuccess?.(data, variables, context)
    },
  })
}
