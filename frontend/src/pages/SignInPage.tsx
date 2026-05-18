import { useState }        from 'react'
import Layout              from '../components/auth/Layout'
import Divider             from '../components/auth/Divider'
import LegalText           from '../components/auth/LegalText'
import FooterLink          from '../components/auth/FooterLink'
import PasswordInput       from '../components/auth/PasswordInput'
import { signInSchema, parseSchema } from '../utils/authValidation'
import { useNavigate }     from 'react-router-dom'
import api                 from '../api/axios'
import type { AxiosError } from 'axios'
import logo42              from '../assets/42.svg'

export default function SignInPage() {
    const [identifier, setIdentifier] = useState('')
    const [password,   setPassword]   = useState('')
    const [loading,    setLoading]    = useState(false)
    const [srvError,   setSrvError]   = useState<string | null>(null)
    const navigate = useNavigate()

    const handleOAuthLogin = () => {
        setSrvError(null)
        navigate('/loading?oauth=42&message=Redirecting to 42 Intra API...', { replace: true })
    }

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()

        const result = parseSchema(signInSchema, { identifier, password })

        if (!result.success)
        {
            setSrvError(result.errors.identifier || result.errors.password || 'Please check your inputs.')
            return
        }

        console.log({ identifier, password })

        setLoading(true)
        setSrvError(null)

        try
        {
          const response = await api.post('/api/auth/signin', { identifier, password })

          localStorage.setItem('token', response.data.token)
          navigate('/dashboard')
        }
        catch ( error )
        {
          const axiosError = error as AxiosError<{ message: string }>
          const message = axiosError.response?.data?.message
            || (axiosError.request ? 'Could not reach the server. Check your connection.'
              : 'Something went wrong. Try again.')
          setSrvError(message)
        }
        finally
        {
          setLoading(false)
        }
    }

    return (
        <Layout>
            <h1 className="font-display font-extrabold text-[32px] text-slate-900 tracking-tight mb-8">
                Welcome back!
            </h1>

            <Divider label="Sign in with" />

            <button
                onClick={handleOAuthLogin}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 cursor-pointer font-display font-semibold text-[15px] text-slate-900 mb-5 transition-colors duration-150"
            >
                <img src={logo42} alt="42" className="h-5" />
                Intra
            </button>

            <Divider label="or continue with" />

            {srvError && <p className="text-red-500 text-sm">{srvError}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                    type="text"
                    placeholder="Enter your username or email..."
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setSrvError(null) }}
                    required
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-lg font-body text-sm text-slate-900 bg-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 placeholder:text-slate-400"
                />
                <PasswordInput
                    placeholder="Enter your password..."
                    value={password}
                    onChange={e => { setPassword(e.target.value); setSrvError(null) }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3.5 mt-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed text-white rounded-lg font-display font-bold text-[15px] cursor-pointer transition-colors duration-150"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <LegalText />
            <FooterLink message="Don't have an account?" label="Sign up" to="/signup" />
        </Layout>
    )
}