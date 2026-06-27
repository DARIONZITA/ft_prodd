import { useRef }                     from 'react'
import { Navigate }                   from 'react-router-dom'
import Layout                         from '../../components/auth/Layout'
import LegalText                      from '../../components/auth/LegalText'
import FooterLink                     from '../../components/auth/FooterLink'
import PasswordInput                  from '../../components/auth/PasswordInput'
import { signUpSchema, parseSchema }  from '../../validation/auth'
import { authInit, reportFieldError } from './utils'
import { useSignUpMutation }          from '../../api/auth'
import { useGetUserRequest }          from '../../api/user'
import { getApiErrorMessage }         from '../../api/axios'
import type { SignUpForm }            from '../../types/auth'

type Fields = 'email' | 'username' | 'password' | 'repeat'

export default function SignUpPage()
{
  const fieldRefs = useRef<Partial<Record<Fields, HTMLInputElement>>>({})
  const userQuery = useGetUserRequest({ retry: false, refetchOnWindowFocus: false })
  const { form, srvError, setSrvError, navigate, updateField } = authInit<SignUpForm>({ email: '', username: '', password: '', repeat: '' })
  const signUpMutation = useSignUpMutation({
    onSuccess: () => { navigate('/dashboard') },
    onError: (error) => { setSrvError(getApiErrorMessage(error)) },
  })

  if (userQuery.isLoading) {
    return null
  }

  if (userQuery.data?.success) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = parseSchema(signUpSchema, form)
    if (!result.success) {
      reportFieldError(result.errors, fieldRefs.current)
      return
    }

    setSrvError(null)

    try {
      await signUpMutation.mutateAsync({ email: form.email, username: form.username, password: form.password })
    } catch (error) { }
  }

  return (
    <Layout>
      <h1 className="font-display font-extrabold text-[clamp(22px,8vw,32px)] text-slate-900 tracking-tight mb-8">
        Sign up
      </h1>

      {srvError && <p className="text-red-500 text-sm">{srvError}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          ref={el => { if (el) fieldRefs.current.email = el }}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Enter your email..."
          value={form.email}
          onChange={updateField('email')}
          onInput={() => fieldRefs.current.email?.setCustomValidity('')}
          required
          className="w-full px-3.5 py-3 border border-slate-200 rounded-lg font-body text-sm text-slate-900 bg-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 placeholder:text-slate-400"
        />

        <div>
          <input
            ref={el => { if (el) fieldRefs.current.username = el }}
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Enter your username..."
            value={form.username}
            onChange={updateField('username')}
            onInput={() => fieldRefs.current.username?.setCustomValidity('')}
            required
            className="w-full px-3.5 py-3 border border-slate-200 rounded-lg font-body text-sm text-slate-900 bg-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 placeholder:text-slate-400"
          />
          <p className="font-body text-xs text-slate-400 mt-1.5 pl-0.5">This is how your teammates will see you.</p>
        </div>

        <PasswordInput
          ref={el => { if (el) fieldRefs.current.password = el }}
          name="password"
          autoComplete="new-password"
          placeholder="Enter your password..."
          value={form.password}
          onChange={updateField('password')}
          onInput={() => fieldRefs.current.password?.setCustomValidity('')}
        />

        <PasswordInput
          ref={el => { if (el) fieldRefs.current.repeat = el }}
          name="repeat"
          autoComplete="new-password"
          placeholder="Repeat your password..."
          value={form.repeat}
          onChange={updateField('repeat')}
          onInput={() => fieldRefs.current.repeat?.setCustomValidity('')}
        />

        <button
          type="submit"
          disabled={signUpMutation.isPending}
          className="w-full px-4 py-3.5 mt-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed text-white rounded-lg font-display font-bold text-[15px] cursor-pointer transition-colors duration-150"
        >
          {signUpMutation.isPending ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      <LegalText />
      <FooterLink message="Already signed up?" label="Go to Sign in" to="/signin" />
    </Layout>
  )
}
