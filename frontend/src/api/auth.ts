import api from './axios'
import type { ApiResponse } from '../types/generic'
import type { AuthResponseData } from '../types/auth'

async function authRequest<T>(endpoint: string, form: T): Promise<void>
{
  const response = await api.post<ApiResponse<AuthResponseData>>(endpoint, form)
  const data = response.data.data

  if (!data)
    throw new Error(`authRequest(): missing response data from ${endpoint}`)
  console.log(`Received response from POST ${endpoint}:`, response)
  localStorage.setItem('token', data.token)
}

export const signInRequest = <T>(form: T) => authRequest('/api/auth/signin', form)
export const signUpRequest = <T>(form: T) => authRequest('/api/auth/signup', form)
