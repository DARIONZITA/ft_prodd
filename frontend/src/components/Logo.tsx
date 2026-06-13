import { Link } from 'react-router-dom'

interface LogoProps {
  iconSize?: number
  fontSize?: string
}

export default function Logo({ iconSize = 28, fontSize = '16px' }: LogoProps) {
  return (
    <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
      <img src="/ft_prodd( ... ).svg" alt="ft_prodd logo" style={{ width: iconSize, height: iconSize }} className="shrink-0" />
      <span className="font-display font-bold tracking-tight text-cyan-600 whitespace-nowrap" style={{ fontSize }}>
        ft_prodd( <span className="text-indigo-600">...</span> )
      </span>
    </Link>
  )
}
