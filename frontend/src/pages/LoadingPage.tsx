import api                      from '../api/axios'
import { useNavigate }          from 'react-router-dom'
import { useEffect, useState }  from 'react'

interface LoadingPageProps {
  message?: string
  error?: string
  isSuccess?: boolean
  successRedirect?: string
  successDelay?: number
}

export default function LoadingPage(props: LoadingPageProps) {
  const { message, error: errorProp, isSuccess, successRedirect = '/dashboard', successDelay = 2000 } = props
  const [error, setError] = useState<string | null>(errorProp || null)
  const [displayMessage, setDisplayMessage] = useState<string | null>(message || null)
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')
    const messageParam = params.get('message')

    // If message is provided in URL, set it (for the redirecting state)
    if (messageParam) {
      setDisplayMessage(messageParam)
    }

    // If there's an error, display it
    if (errorParam) {
      setError(errorDescription || errorParam)
      return
    }

    // If oauth=42, redirect to backend
    if (params.get('oauth') === '42')
    {
      // Replace history so back button doesn't loop back to loading page
      window.history.replaceState(null, '', window.location.pathname)
      window.location.href = `${api.defaults.baseURL}/api/auth/42/login`
    }
  }, [])

  // Handle success redirect
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate(successRedirect, { replace: true })
      }, successDelay)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, successRedirect, successDelay, navigate])


  // The error will be rendered inline below the animation so users still see the loading UI

  return (
    <div className="font-body bg-slate-50 min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50%       { transform: translateX(-50%) translateY(-5px); }
        }
        @keyframes fill {
          0%   { transform: translateY(100%); }
          50%  { transform: translateY(0%); }
          100% { transform: translateY(-100%); }
        }
        .loading-circle::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, #ecfeff 0%, #0891b2 100%);
          transform: translateY(100%);
          animation: fill 2s ease-in-out infinite;
        }
        .loading-circle-wrapper {
          position: absolute;
          left: 50%;
          top: 54px;
          animation: float 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-10">
        <div className="relative w-[49px] h-[60px]">

          <svg viewBox="0 0 49 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[49px] h-10">
            <path opacity="0.8" d="M0 0.999999C0 0.447714 0.447715 0 1 0H14C14.5523 0 15 0.447715 15 1V39C15 39.5523 14.5523 40 14 40H1C0.447715 40 0 39.5523 0 39V0.999999Z" fill="#0891B2"/>
            <path opacity="0.8" d="M17 0.999999C17 0.447714 17.4477 0 18 0H31C31.5523 0 32 0.447715 32 1V39C32 39.5523 31.5523 40 31 40H18C17.4477 40 17 39.5523 17 39V0.999999Z" fill="#4F46E5"/>
            <path opacity="0.8" d="M34 0.999999C34 0.447714 34.4477 0 35 0H48C48.5523 0 49 0.447715 49 1V39C49 39.5523 48.5523 40 48 40H35C34.4477 40 34 39.5523 34 39V0.999999Z" fill="#06B6D4"/>
            <rect x="36" y="2"  width="11" height="7" fill="#FEFFFF"/>
            <rect x="19" y="2"  width="11" height="7" fill="#FEFFFF"/>
            <rect x="19" y="12" width="11" height="7" fill="#FEFFFF"/>
            <rect x="2"  y="2"  width="11" height="7" fill="#FEFFFF"/>
            <rect x="2"  y="12" width="11" height="7" fill="#FEFFFF"/>
            <rect x="2"  y="21" width="11" height="7" fill="#FEFFFF"/>
            <rect x="2"  y="22" width="11" height="7" fill="#FEFFFF"/>
            <rect x="36" y="12" width="11" height="7" fill="white"/>
            <rect x="36" y="22" width="11" height="7" fill="white"/>
            <rect x="36" y="31" width="11" height="7" fill="white"/>
          </svg>

          <div className="loading-circle-wrapper">
            <div className="loading-circle w-2.5 h-2.5 rounded-full relative overflow-hidden border border-indigo-500 bg-white" />
          </div>

        </div>
        {/* Error message shown below the animation */}
        {error && (
          <div className="mt-48 text-center px-6">
            <p className="font-body text-sm text-red-500">{error}</p>
          </div>
        )}
        {/* Message shown when provided (redirecting, success, etc) */}
        {displayMessage && !error && (
          <div className="mt-48 text-center px-6">
            <p className="font-body text-sm text-slate-600">{displayMessage}</p>
          </div>
        )}
        {/* Success state without custom message */}
        {isSuccess && !displayMessage && !error && (
          <div className="mt-48 text-center px-6">
            <p className="font-body text-sm text-green-600">Sign in successful! Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  )
}
