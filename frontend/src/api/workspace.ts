import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import { queryClient } from '../main'

export type WorkspaceRole = 'admin' | 'member' | 'guest'

export interface WorkspaceUser {
  id: string | number
  username: string
  email: string
  avatarUrl: string
}

export interface WorkspaceActivityLog {
  id: number
  workspaceId: number
  userId: number
  action: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string | number
    username: string
    avatarUrl: string
  }
}

export interface WorkspaceMember {
  id: number
  workspaceId: number
  userId: number
  role: WorkspaceRole
  createdAt?: string
  updatedAt?: string
  user?: WorkspaceUser
}

export interface Workspace {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
  role?: WorkspaceRole
  taskCount?: number
  members?: WorkspaceMember[]
  activityLogs?: WorkspaceActivityLog[]
}

export interface CreateWorkspaceForm {
  name: string
  description?: string
}

export interface UpdateWorkspaceForm {
  name?: string
  description?: string
}

export interface CreateWorkspaceMemberForm {
  userId: number
  role?: WorkspaceRole
}

export interface UpdateWorkspaceMemberRoleForm {
  role: WorkspaceRole
}

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

const workspaceKeys = {
  list: ['workspaces'] as const,
  detail: (id: number | string) => ['workspace', id] as const,
  members: (id: number | string) => ['workspace-members', id] as const,
  member: (id: number | string, userId: number | string) => ['workspace-member', id, userId] as const,
}

async function workspaceRequest<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', payload?: T)
{
  const response = await api.request<ApiResponse<unknown>>({
    url: endpoint,
    method,
    data: payload,
  })

  return response.data
}

export const listUserWorkspacesRequest = async (): Promise<ApiResponse<Workspace[]>> => {
  const response = await api.get<ApiResponse<Workspace[]>>('/api/workspaces')
  return response.data
}

export const getWorkspaceDetailsRequest = async (id: number | string) => {
  const response = await api.get<ApiResponse<Workspace>>(`/api/workspaces/${id}`)
  return response.data.data
}

export const listWorkspaceMembersRequest = async (id: number | string) => {
  const response = await api.get<ApiResponse<WorkspaceMember[]>>(`/api/workspaces/${id}/members`)
  return response.data.data
}

export const getWorkspaceMemberRequest = async (id: number | string, userId: number | string) => {
  const response = await api.get<ApiResponse<WorkspaceMember>>(`/api/workspaces/${id}/members/${userId}`)
  return response.data.data
}

export const createWorkspaceRequest = async (form: CreateWorkspaceForm) => {
  const response = await api.post<ApiResponse<Workspace>>('/api/workspaces', form)
  return response.data.data
}

export const updateWorkspaceRequest = async (id: number | string, form: UpdateWorkspaceForm) => {
  const response = await api.put<ApiResponse<Workspace>>(`/api/workspaces/${id}`, form)
  return response.data.data
}

export const deleteWorkspaceRequest = async (id: number | string) => {
  const response = await api.delete<ApiResponse<null>>(`/api/workspaces/${id}`)
  return response.data
}

export const createWorkspaceMemberRequest = async (id: number | string, form: CreateWorkspaceMemberForm) => {
  const response = await api.post<ApiResponse<WorkspaceMember>>(`/api/workspaces/${id}/members`, form)
  return response.data.data
}

export const updateWorkspaceMemberRoleRequest = async (id: number | string, userId: number | string, form: UpdateWorkspaceMemberRoleForm) => {
  const response = await api.put<ApiResponse<WorkspaceMember>>(`/api/workspaces/${id}/members/${userId}`, form)
  return response.data.data
}

export const deleteWorkspaceMemberRequest = async (id: number | string, userId: number | string) => {
  const response = await api.delete<ApiResponse<null>>(`/api/workspaces/${id}/members/${userId}`)
  return response.data
}

export function useUserWorkspacesQuery(
  options?: Omit<UseQueryOptions<ApiResponse<Workspace[]>, Error>, 'queryKey' | 'queryFn'>
)
{
  return useQuery({
    queryKey: workspaceKeys.list,
    queryFn: listUserWorkspacesRequest,
    ...options,
  })
}

export function useWorkspaceDetailsQuery(
  id: number | string | undefined,
  options?: Omit<UseQueryOptions<Workspace, Error>, 'queryKey' | 'queryFn'>
)
{
  return useQuery({
    queryKey: id == null ? workspaceKeys.detail('unknown') : workspaceKeys.detail(id),
    queryFn: () => getWorkspaceDetailsRequest(id as number | string),
    enabled: id != null && (options?.enabled ?? true),
    ...options,
  })
}

export function useWorkspaceMembersQuery(
  id: number | string | undefined,
  options?: Omit<UseQueryOptions<WorkspaceMember[], Error>, 'queryKey' | 'queryFn'>
)
{
  return useQuery({
    queryKey: id == null ? workspaceKeys.members('unknown') : workspaceKeys.members(id),
    queryFn: () => listWorkspaceMembersRequest(id as number | string),
    enabled: id != null && (options?.enabled ?? true),
    ...options,
  })
}

export function useWorkspaceMemberQuery(
  id: number | string | undefined,
  userId: number | string | undefined,
  options?: Omit<UseQueryOptions<WorkspaceMember, Error>, 'queryKey' | 'queryFn'>
)
{
  return useQuery({
    queryKey: id == null || userId == null ? workspaceKeys.member('unknown', 'unknown') : workspaceKeys.member(id, userId),
    queryFn: () => getWorkspaceMemberRequest(id as number | string, userId as number | string),
    enabled: id != null && userId != null && (options?.enabled ?? true),
    ...options,
  })
}

export function useCreateWorkspaceMutation(
  options?: UseMutationOptions<Workspace, Error, CreateWorkspaceForm>
)
{
  return useMutation({
    mutationFn: createWorkspaceRequest,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateWorkspaceMutation(
  options?: UseMutationOptions<Workspace, Error, { id: number | string; form: UpdateWorkspaceForm }>
)
{
  return useMutation({
    mutationFn: ({ id, form }) => updateWorkspaceRequest(id, form),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) })
      await options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteWorkspaceMutation(
  options?: UseMutationOptions<unknown, Error, number | string>
)
{
  return useMutation({
    mutationFn: deleteWorkspaceRequest,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export function useCreateWorkspaceMemberMutation(
  options?: UseMutationOptions<WorkspaceMember, Error, { id: number | string; form: CreateWorkspaceMemberForm }>
)
{
  return useMutation({
    mutationFn: ({ id, form }) => createWorkspaceMemberRequest(id, form),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateWorkspaceMemberRoleMutation(
  options?: UseMutationOptions<WorkspaceMember, Error, { id: number | string; userId: number | string; form: UpdateWorkspaceMemberRoleForm }>
)
{
  return useMutation({
    mutationFn: ({ id, userId, form }) => updateWorkspaceMemberRoleRequest(id, userId, form),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.member(variables.id, variables.userId) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteWorkspaceMemberMutation(
  options?: UseMutationOptions<unknown, Error, { id: number | string; userId: number | string }>
)
{
  return useMutation({
    mutationFn: ({ id, userId }) => deleteWorkspaceMemberRequest(id, userId),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.member(variables.id, variables.userId) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
