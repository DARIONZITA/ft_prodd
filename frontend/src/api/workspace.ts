import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import api from './axios'
import { queryClient } from '../query-client'

export type WorkspaceRole = 'admin' | 'member' | 'guest' | 'pending' | 'requesting'

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
  invitedRole?: WorkspaceRole
  invitedById?: number
  createdAt?: string
  updatedAt?: string
  user?: WorkspaceUser
}

export interface WorkspaceInvitation {
  workspaceId: number
  workspace: {
    id: number
    name: string
    description: string
    createdAt: string
  }
  invitedRole: WorkspaceRole
  invitedBy: { id: number; username: string; avatarUrl: string } | null
  invitedAt: string
}

export interface Workspace {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
  role?: WorkspaceRole
  taskCount?: number
  memberCount?: number
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
  invitations: ['workspace-invitations'] as const,
}

// ─── Raw Requests ─────────────────────────────────────────────────────────────

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
  const response = await api.patch<ApiResponse<Workspace>>(`/api/workspaces/${id}`, form)
  return response.data.data
}

export const deleteWorkspaceRequest = async (id: number | string) => {
  const response = await api.delete<ApiResponse<null>>(`/api/workspaces/${id}`)
  return response.data
}

// Invite user (creates pending membership)
export const createWorkspaceMemberRequest = async (id: number | string, form: CreateWorkspaceMemberForm) => {
  const response = await api.post<ApiResponse<WorkspaceMember>>(`/api/workspaces/${id}/members/${form.userId}`, { role: form.role ?? 'member' })
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

// Invitation endpoints
export const listMyInvitationsRequest = async (): Promise<ApiResponse<WorkspaceInvitation[]>> => {
  const response = await api.get<ApiResponse<WorkspaceInvitation[]>>('/api/workspaces/invitations')
  return response.data
}

export const acceptInvitationRequest = async (workspaceId: number | string) => {
  const response = await api.post<ApiResponse<WorkspaceMember>>(`/api/workspaces/${workspaceId}/members/invite/accept`)
  return response.data
}

export const declineInvitationRequest = async (workspaceId: number | string) => {
  const response = await api.delete<ApiResponse<null>>(`/api/workspaces/${workspaceId}/members/invite/decline`)
  return response.data
}

// Join Request endpoints
export const requestToJoinWorkspaceRequest = async (workspaceId: number | string): Promise<ApiResponse<WorkspaceMember>> => {
  const response = await api.post<ApiResponse<WorkspaceMember>>(`/api/workspaces/${workspaceId}/join-request`)
  return response.data
}

export interface JoinRequest {
  userId: number
  user: WorkspaceUser
  requestedAt: string
}

export const listJoinRequestsRequest = async (workspaceId: number): Promise<ApiResponse<JoinRequest[]>> => {
  const response = await api.get<ApiResponse<JoinRequest[]>>(`/api/workspaces/${workspaceId}/members/requests`)
  return response.data
}

export const acceptJoinRequestRequest = async (workspaceId: number | string, userId: number | string): Promise<ApiResponse<WorkspaceMember>> => {
  const response = await api.post<ApiResponse<WorkspaceMember>>(`/api/workspaces/${workspaceId}/members/requests/${userId}/accept`)
  return response.data
}

export const declineJoinRequestRequest = async (workspaceId: number | string, userId: number | string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/api/workspaces/${workspaceId}/members/requests/${userId}/decline`)
  return response.data
}

// ─── React Query Hooks ────────────────────────────────────────────────────────

export function useUserWorkspacesQuery(
  options?: Omit<UseQueryOptions<ApiResponse<Workspace[]>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: workspaceKeys.list,
    queryFn: listUserWorkspacesRequest,
    ...options,
  })
}

async function listUserWorkspacesForUserRequest(userId: string | number): Promise<ApiResponse<Workspace[]>> {
  const response = await api.get<ApiResponse<Workspace[]>>(`/api/users/${userId}/workspaces`)
  return response.data
}

export function useUserWorkspacesForUserQuery(
  userId: string | number | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Workspace[]>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['user-workspaces', userId],
    queryFn: () => listUserWorkspacesForUserRequest(userId!),
    enabled: userId != null,
    ...options,
  })
}

export function useWorkspaceDetailsQuery(
  id: number | string | undefined,
  options?: Omit<UseQueryOptions<Workspace, Error>, 'queryKey' | 'queryFn'>
) {
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
) {
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
) {
  return useQuery({
    queryKey: id == null || userId == null ? workspaceKeys.member('unknown', 'unknown') : workspaceKeys.member(id, userId),
    queryFn: () => getWorkspaceMemberRequest(id as number | string, userId as number | string),
    enabled: id != null && userId != null && (options?.enabled ?? true),
    ...options,
  })
}

export function useMyInvitationsQuery(
  options?: Omit<UseQueryOptions<ApiResponse<WorkspaceInvitation[]>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: workspaceKeys.invitations,
    queryFn: listMyInvitationsRequest,
    ...options,
  })
}

export function useCreateWorkspaceMutation(
  options?: UseMutationOptions<Workspace, Error, CreateWorkspaceForm>
) {
  return useMutation({
    mutationFn: createWorkspaceRequest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options,
  })
}

export function useUpdateWorkspaceMutation(
  options?: UseMutationOptions<Workspace, Error, { id: number | string; form: UpdateWorkspaceForm }>
) {
  return useMutation({
    mutationFn: ({ id, form }) => updateWorkspaceRequest(id, form),
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options,
  })
}

export function useDeleteWorkspaceMutation(
  options?: UseMutationOptions<unknown, Error, number | string>
) {
  return useMutation({
    mutationFn: deleteWorkspaceRequest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options,
  })
}

export function useCreateWorkspaceMemberMutation(
  options?: UseMutationOptions<WorkspaceMember, Error, { id: number | string; form: CreateWorkspaceMemberForm }>
) {
  return useMutation({
    mutationFn: ({ id, form }) => createWorkspaceMemberRequest(id, form),
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options,
  })
}

export function useUpdateWorkspaceMemberRoleMutation(
  options?: UseMutationOptions<WorkspaceMember, Error, { id: number | string; userId: number | string; form: UpdateWorkspaceMemberRoleForm }>
) {
  return useMutation({
    mutationFn: ({ id, userId, form }) => updateWorkspaceMemberRoleRequest(id, userId, form),
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.member(variables.id, variables.userId) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options,
  })
}

export function useDeleteWorkspaceMemberMutation(
  options?: UseMutationOptions<ApiResponse<null>, Error, { id: number | string; userId: number | string }>
) {
  return useMutation({
    mutationFn: ({ id, userId }) => deleteWorkspaceMemberRequest(id, userId),
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.member(variables.id, variables.userId) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options,
  })
}

export function useAcceptInvitationMutation(
  options?: UseMutationOptions<unknown, Error, number | string>
) {
  return useMutation({
    mutationFn: acceptInvitationRequest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.invitations })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options,
  })
}

export function useDeclineInvitationMutation(
  options?: UseMutationOptions<unknown, Error, number | string>
) {
  return useMutation({
    mutationFn: declineInvitationRequest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.invitations })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options,
  })
}

export function useRequestToJoinWorkspaceMutation(
  options?: UseMutationOptions<ApiResponse<WorkspaceMember>, Error, number | string>
) {
  return useMutation({
    mutationFn: requestToJoinWorkspaceRequest,
    ...options
  })
}

export function useWorkspaceJoinRequestsQuery(
  workspaceId: number,
  options?: Omit<UseQueryOptions<ApiResponse<JoinRequest[]>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['workspace-join-requests', workspaceId],
    queryFn: () => listJoinRequestsRequest(workspaceId),
    enabled: workspaceId != null,
    ...options
  })
}

export function useAcceptJoinRequestMutation(
  options?: UseMutationOptions<ApiResponse<WorkspaceMember>, Error, { workspaceId: number | string; userId: number | string }>
) {
  return useMutation({
    mutationFn: ({ workspaceId, userId }) => acceptJoinRequestRequest(workspaceId, userId),
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: ['workspace-join-requests', variables.workspaceId] })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.workspaceId) })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options
  })
}

export function useDeclineJoinRequestMutation(
  options?: UseMutationOptions<ApiResponse<null>, Error, { workspaceId: number | string; userId: number | string }>
) {
  return useMutation({
    mutationFn: ({ workspaceId, userId }) => declineJoinRequestRequest(workspaceId, userId),
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({ queryKey: ['workspace-join-requests', variables.workspaceId] })
      await options?.onSuccess?.(data, variables, context, mutationContext)
    },
    ...options
  })
}
