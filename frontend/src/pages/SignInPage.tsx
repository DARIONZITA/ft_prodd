import { useState } from 'react'
import Layout from '../components/auth/Layout'
import Divider from '../components/auth/Divider'
import LegalText from '../components/auth/LegalText'
import FooterLink from '../components/auth/FooterLink'
import PasswordInput from '../components/auth/PasswordInput'
import { parseSignIn } from '../utils/authValidation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const result = parseSignIn({ email, password })
    if (!result.success)
      return
    // TODO: call sign-in API
    console.log({ email, password })
  }

  return (
    <Layout>
      <h1 className="font-display font-extrabold text-[32px] text-slate-900 tracking-tight mb-8">
        Welcome back!
      </h1>

      <Divider label="Sign in with" />

      <button className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 cursor-pointer font-display font-semibold text-[15px] text-slate-900 mb-5 transition-colors duration-150">
        <img src="/src/assets/42.svg" alt="42" className="h-5" />
        Intra
      </button>

      <Divider label="or continue with" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Enter your email..."
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-3.5 py-3 border border-slate-200 rounded-lg font-body text-sm text-slate-900 bg-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 placeholder:text-slate-400"
        />

        <PasswordInput
          placeholder="Enter your password..."
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full px-4 py-3.5 mt-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-display font-bold text-[15px] cursor-pointer transition-colors duration-150"
        >
          Sign in
        </button>
      </form>

      <LegalText />
      <FooterLink message="Don't have an account?" label="Sign up" to="/signup" />
    </Layout>
  )
}
