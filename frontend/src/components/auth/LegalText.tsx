import { Link } from 'react-router-dom'

export default function LegalText() {
  return (
    <p className="font-body text-[13px] text-slate-500 mt-5 leading-relaxed">
      By continuing, you acknowledge that you understand and agree to the{' '}
      <Link to="/terms" className="text-cyan-600 no-underline hover:underline">Terms of Service</Link>{' '}
      and{' '}
      <Link to="/privacy" className="text-cyan-600 no-underline hover:underline">Privacy Policy</Link>.
    </p>
  )
}
