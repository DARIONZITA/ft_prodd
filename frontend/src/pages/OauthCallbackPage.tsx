import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import LoadingPage             from './LoadingPage'

export default function OAuthCallbackPage() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | undefined>(undefined)
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token  = params.get('token')
        const err    = params.get('error')

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
            setIsSuccess(true)
            return
        }

        // Nem token nem erro — algo correu mal
        setError('Unexpected response')
    }, [navigate])

    // Render LoadingPage with appropriate props
    return (
        <LoadingPage
            error={error}
            message={!error && isSuccess ? 'Sign in successful! Redirecting...' : !error ? 'Completing sign in...' : undefined}
            isSuccess={isSuccess}
            successRedirect="/dashboard"
            successDelay={1500}
        />
    )
}
