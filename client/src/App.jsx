import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './App.css'
import { ToastProvider } from './context/ToastContext'

// Lazy loaded page components for optimal production chunking
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Budget = lazy(() => import('./pages/Budget'))
const Insights = lazy(() => import('./pages/Insights'))
const Reports = lazy(() => import('./pages/Reports'))
const Profile = lazy(() => import('./pages/Profile'))

// Layout
import Layout from './components/layout/Layout'

// Redux
import { useDispatch, useSelector } from 'react-redux'
import { refreshUser } from './redux/slices/authSlice'

function PageLoader() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-secondary"></div>
        <p className="text-xs font-semibold text-slate-500">Loading FinTrack...</p>
      </div>
    </div>
  )
}

function ProtectedRoute() {
  const { isAuthenticated } = useSelector(state => state.auth)

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) return

    dispatch(refreshUser())
  }, [dispatch])

  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  )
}

export default App