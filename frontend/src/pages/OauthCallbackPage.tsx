import { useMemo }              from 'react'
import { useNavigate }          from 'react-router-dom'
import LoadingPage              from './LoadingPage'
import { useGetUserRequest }    from '../api/user'

export default function OAuthCallbackPage() {
    const navigate = useNavigate()
    const params = new URLSearchParams(window.location.search)
    const err    = params.get('error')

    const error: string | undefined = useMemo(() => {
        if (err) return err
        return undefined
    }, [err])

    const userQuery = useGetUserRequest({
        enabled: !err,
        retry: false,
    })

    if (error) {
        setTimeout(() => navigate('/signin', { replace: true }), 3000)
    }

    return (
        <LoadingPage
            error={error}
                message={!error && userQuery.data?.success ? 'Sign in successful! Redirecting...' : !error ? 'Completing sign in...' : undefined}
                isSuccess={!!userQuery.data?.success}
            successRedirect="/dashboard"
            successDelay={1500}
        />
    )
}
