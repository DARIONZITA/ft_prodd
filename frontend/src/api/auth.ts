import api from './axios'
import type { AuthResponseData } from '../types/auth'

async function authRequest<T>(endpoint: string, form: T): Promise<AuthResponseData['user']>
{
  const response = await api.post<AuthResponseData>(endpoint, form)
  const { token, user } = response.data

  console.log(`Received response from POST ${endpoint}: token=${token}, user=${JSON.stringify(user)}`)
  localStorage.setItem('token', token)
  return user
}

export const signInRequest = <T>(form: T) => authRequest('/api/auth/signin', form)
export const signUpRequest = <T>(form: T) => authRequest('/api/auth/signup', form)
