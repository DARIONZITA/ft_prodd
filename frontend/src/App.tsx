import { Routes, Route, Navigate }  from "react-router-dom"
import SignInPage                   from './pages/auth/SignInPage'
import SignUpPage                   from './pages/auth/SignUpPage'
import LoadingPage                  from './pages/LoadingPage'
import LandingPage                  from './pages/LandingPage'
//import ProtectedRoute               from './components/ProtectedRoute'
import OAuthCallbackPage            from "./pages/OauthCallbackPage"
import DashboardPagePlaceholder     from './pages/DashboardPagePlaceholder'
import PrivacyPolicy                from './pages/legal/PrivacyPolicy'
import TermsOfService               from './pages/legal/TermsOfService'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/dashboard"
          element={
            //<ProtectedRoute>
              <DashboardPagePlaceholder />
            //</ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App
