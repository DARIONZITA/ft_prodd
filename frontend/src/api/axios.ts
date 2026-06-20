import axios, { HttpStatusCode, type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from "axios"

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  withCredentials: true,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  console.log(
    `[FRONTEND] REQUEST -> 
    ${config.method?.toUpperCase()} 
    ${config.url}`
  )
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(
      `[FRONTEND] RESPONSE <- 
      ${response.status} 
      ${response.config.method?.toUpperCase()} 
      ${response.config.url}`
    )
    return response
  },
  (error) => {
    console.log(
      `[FRONTEND] RESPONSE ERROR <- 
      ${error.response?.status} 
      ${error.response?.config?.method?.toUpperCase()} 
      ${error.response?.config?.url} 
      ${getApiErrorMessage(error)}`
    )
    if (error.response?.status === HttpStatusCode.Unauthorized) {
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error))
    return 'Unexpected error (not an Axios error)';
  if (error.response)
    return error.response.data.message ?? 'API error without message';
  if (error.request)
    return 'Could not reach the server. Check your connection.';
  return error.message || 'Unknown error occurred.';
}

export default api
