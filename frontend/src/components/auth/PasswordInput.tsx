import { forwardRef, useState } from 'react'
import { Eye, EyeOff }          from 'lucide-react'

interface PasswordInputProps {
  placeholder:  string
  value:        string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onInput?: () => void
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ placeholder, value, onChange, onInput }, ref) => {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onInput={onInput}
        required
        className="w-full px-3.5 py-3 pr-11 border border-slate-200 rounded-lg font-body text-sm text-slate-900 bg-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center p-0 bg-transparent border-none cursor-pointer"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  )
})

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
