import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import api from './axios'
import type { AuthResponseData, SignInForm, SignUpForm } from '../types/auth'
import { queryClient } from '../main'

async function authRequest<T>(endpoint: string, form: T): Promise<AuthResponseData['user']>
{
  const response = await api.post<AuthResponseData>(endpoint, form)
  const { user } = response.data

  queryClient.setQueryData(['user', 'me'], user)
  return user
}

export const signInRequest = (form: SignInForm) => authRequest('/api/auth/signin', form)
export const signUpRequest = (form: Omit<SignUpForm, 'repeat'>) => authRequest('/api/auth/signup', form)

export function useSignInMutation(
  options?: UseMutationOptions<AuthResponseData['user'], unknown, SignInForm>
)
{
  return useMutation({
    mutationFn: signInRequest,
    ...options,
  })
}

export function useSignUpMutation(
  options?: UseMutationOptions<AuthResponseData['user'], unknown, Omit<SignUpForm, 'repeat'>>
)
{
  return useMutation({
    mutationFn: signUpRequest,
    ...options,
  })
}
