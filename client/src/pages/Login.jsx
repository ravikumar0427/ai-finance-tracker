import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../redux/slices/authSlice'
import { useToast } from '../context/ToastContext'
import Logo from '../components/common/Logo'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const { loading } = useSelector(state => state.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await dispatch(loginUser(formData)).unwrap()
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      setError(err || 'Login failed')
      toast.error(err || 'Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-slate-100">
        <div className="flex flex-col items-center justify-center mb-8">
          <Logo size="lg" />
          <p className="text-xs text-slate-500 mt-2 text-center">Smart AI-Powered Personal Finance Tracker</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-4 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-secondary text-sm"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-secondary text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white font-bold py-2.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-md text-sm mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-600 text-xs">
          Don't have an account?{' '}
          <Link to="/signup" className="text-secondary font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login