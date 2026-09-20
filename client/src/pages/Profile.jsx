import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfileThunk } from '../redux/slices/authSlice'
import { changePassword, getAccountStats } from '../services/authService'
import { formatCurrency } from '../utils/format'
import { useToast } from '../context/ToastContext'

function Profile() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { user } = useSelector(state => state.auth)
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [stats, setStats] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '' })
    }
    getAccountStats()
      .then((response) => setStats(response.data.data))
      .catch(() => {})
  }, [user])

  const saveProfile = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      await dispatch(updateProfileThunk(profile)).unwrap()
      toast.success('Profile details updated successfully.')
    } catch (err) {
      toast.error(err || 'Unable to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setSavingPassword(true)
    try {
      await changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      toast.success('Password changed successfully.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Profile & Security</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your account credentials, security settings, and review financial history.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2 space-y-8">
          <div>
            <h3 className="font-semibold text-slate-900 border-b pb-3">User Details</h3>
            <form onSubmit={saveProfile} className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  placeholder="Name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm shadow-sm"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 border-b pb-3">Change Password</h3>
            <form onSubmit={savePassword} className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  placeholder="Current password"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  minLength="6"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  placeholder="New password (min 6 chars)"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-lg bg-secondary px-5 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm shadow-sm"
                >
                  {savingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 border-b pb-3">Account Statistics</h3>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Transactions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.transactionCount || 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">All-time Income</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(stats?.totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">All-time Expenses</p>
              <p className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(stats?.totalExpense)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">All-time Savings</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(stats?.savings)}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Profile