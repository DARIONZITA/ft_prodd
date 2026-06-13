import { useState }     from 'react'
import { useNavigate }  from 'react-router-dom'

export function authInit<T extends Record<string, string>>( initial: T )
{
  const [form,     setForm]     = useState<T>(initial)
  const [srvError, setSrvError] = useState<string | null>(null)
  const navigate = useNavigate()

  const updateField = (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setSrvError(null)
  }

  return { form, srvError, setSrvError, navigate, updateField }
}

export function reportFieldError( errors: Partial<Record<string, string>>, refs: Partial<Record<string, HTMLInputElement | null> > ): boolean
{
    for (const field in errors)
    {
        const ref = refs[field]
        const message = errors[field]
        if (ref && message)
        {
            ref.setCustomValidity(message)
            ref.reportValidity()
            return true
        }
    }
    return false
}
