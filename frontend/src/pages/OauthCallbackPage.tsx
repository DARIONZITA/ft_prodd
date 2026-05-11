import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'

export default function OAuthCallbackPage() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token  = params.get('token')
        const err    = params.get('error')

        if (err) {
            setError(err)
            // Redireciona para signin após 3s a mostrar o erro
            setTimeout(() => navigate('/signin', { replace: true }), 3000)
            return
        }

        if (token) {
            localStorage.setItem('token', token)
            navigate('/dashboard', { replace: true })
            return
        }

        // Nem token nem erro — algo correu mal
        setError('Unexpected response. Redirecting...')
        setTimeout(() => navigate('/signin', { replace: true }), 3000)
    }, [navigate])

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3">
                <p className="text-red-500 font-semibold">{error}</p>
                <p className="text-slate-400 text-sm">Redirecting to sign in...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
            <span className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-cyan-600 animate-spin" />
            <p className="text-slate-500 text-sm">Completing sign in...</p>
        </div>
    )
}