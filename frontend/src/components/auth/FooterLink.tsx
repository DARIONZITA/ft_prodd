import { Link } from 'react-router-dom'

interface FooterLinkProps {
  message: string
  label: string
  to: string
}

export default function FooterLink({ message, label, to }: FooterLinkProps) {
  return (
    <>
      <div className="h-px bg-slate-200 my-6" />
      <p className="text-center font-body text-sm text-slate-500">
        {message}{' '}
        <Link to={to} className="text-cyan-600 font-semibold no-underline hover:underline">{label}</Link>
      </p>
    </>
  )
}
