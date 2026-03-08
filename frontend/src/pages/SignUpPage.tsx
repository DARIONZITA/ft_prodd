import { useRef, useState } from 'react'
import Layout from '../components/auth/Layout'
import LegalText from '../components/auth/LegalText'
import FooterLink from '../components/auth/FooterLink'
import PasswordInput from '../components/auth/PasswordInput'
import { parseSignUp } from '../utils/authValidation'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { AxiosError } from 'axios'

export default function SignUpPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', repeat: '' })
  const [loading, setLoading] = useState(false)
  const [srvError, setSrvError] = useState<string | null>(null)
  const navigate = useNavigate()

  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const repeatRef   = useRef<HTMLInputElement>(null)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setSrvError(null)
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const result = parseSignUp(form)
    if (!result.success) {
      if (result.errors.username && usernameRef.current) {
        usernameRef.current.setCustomValidity(result.errors.username)
        return usernameRef.current.reportValidity()
      }
      if (result.errors.password && passwordRef.current) {
        passwordRef.current.setCustomValidity(result.errors.password)
        return passwordRef.current.reportValidity()
      }
      if (result.errors.repeat && repeatRef.current) {
        repeatRef.current.setCustomValidity(result.errors.repeat)
        return repeatRef.current.reportValidity()
      }
      return
    }

    console.log(form)

    setLoading(true)
    setSrvError(null)

    try {
      const response = await api.post('/api/auth/signup', {
        email: form.email,
        username: form.username,
        password: form.password,
      })
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>
      const message = axiosError.response?.data?.error || 'Something went wrong. Try again.'
      setSrvError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <h1 className="font-display font-extrabold text-[32px] text-slate-900 tracking-tight mb-8">
        Sign up
      </h1>

      {srvError && <p className="text-red-500 text-sm">{srvError}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Enter your email..."
          value={form.email}
          onChange={set('email')}
          required
          className="w-full px-3.5 py-3 border border-slate-200 rounded-lg font-body text-sm text-slate-900 bg-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 placeholder:text-slate-400"
        />

        <div>
          <input
            ref={usernameRef}
            type="text"
            placeholder="Enter your username..."
            value={form.username}
            onChange={set('username')}
            onInput={() => usernameRef.current?.setCustomValidity('')}
            required
            className="w-full px-3.5 py-3 border border-slate-200 rounded-lg font-body text-sm text-slate-900 bg-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 placeholder:text-slate-400"
          />
          <p className="font-body text-xs text-slate-400 mt-1.5 pl-0.5">This is how your teammates will see you.</p>
        </div>

        <PasswordInput
          ref={passwordRef}
          placeholder="Enter your password..."
          value={form.password}
          onChange={set('password')}
          onInput={() => passwordRef.current?.setCustomValidity('')}
        />

        <PasswordInput
          ref={repeatRef}
          placeholder="Repeat your password..."
          value={form.repeat}
          onChange={set('repeat')}
          onInput={() => repeatRef.current?.setCustomValidity('')}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3.5 mt-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed text-white rounded-lg font-display font-bold text-[15px] cursor-pointer transition-colors duration-150"
        >
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      <LegalText />
      <FooterLink message="Already signed up?" label="Go to Sign in" to="/signin" />
    </Layout>
  )
}
