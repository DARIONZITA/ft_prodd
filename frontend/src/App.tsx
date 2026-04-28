import { Routes, Route, Navigate } from "react-router-dom"
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import LoadingPage from './pages/LoadingPage'
import DashboardPagePlaceholder from './pages/DashboardPagePlaceholder'
// import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/loading" element={<LoadingPage />} />
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
