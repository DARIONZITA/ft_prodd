import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import LoadingPage             from './LoadingPage'
import { useGetUserRequest }   from '../api/user'

export default function OAuthCallbackPage() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | undefined>(undefined)
    const [canFetchUser, setCanFetchUser] = useState(false)
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token') ?? undefined
    const err    = params.get('error')

    const userQuery = useGetUserRequest({ enabled: canFetchUser, retry: false })

    useEffect(() => {
        if (err) {
            setError(err)
            console.log("OAuth callback error:", err)
            // Redirect to signin after 3 seconds
            const timer = setTimeout(() => {
                navigate('/signin', { replace: true })
            }, 3000)
            return () => clearTimeout(timer)
        }

        if (token) {
            localStorage.setItem('token', token)
            setCanFetchUser(true)
        }

        // Nem token nem erro — algo correu mal
        if (!token && !err)
            setError('Unexpected response')
    }, [navigate, token, err])

    // Render LoadingPage with appropriate props
    return (
        <LoadingPage
            error={error}
            message={!error && userQuery.isSuccess ? 'Sign in successful! Redirecting...' : !error ? 'Completing sign in...' : undefined}
            isSuccess={userQuery.isSuccess}
            successRedirect="/dashboard"
            successDelay={1500}
        />
    )
}
