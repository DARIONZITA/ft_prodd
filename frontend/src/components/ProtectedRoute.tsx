import { Navigate } from 'react-router-dom'
import { useGetUserRequest } from '../api/user'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const userQuery = useGetUserRequest({ retry: false })

  if (userQuery.isLoading) {
    return null
  }

  if (!userQuery.data?.success) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
