import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBudget, saveBudget } from '../redux/slices/budgetSlice'
import { getDashboardSummary } from '../services/dashboardService'
import { categories, formatCurrency } from '../utils/format'
import { useToast } from '../context/ToastContext'
import { CardSkeleton } from '../components/common/SkeletonLoader'

function Budget() {
  const dispatch = useDispatch()
  const toast = useToast()
  const budget = useSelector(state => state.budget)
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [categoryBudgets, setCategoryBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dispatch(fetchBudget()).unwrap(),
      getDashboardSummary()
    ])
      .then(([_, response]) => setSummary(response.data.data))
      .catch((err) => toast.error(err?.message || 'Unable to load budget info.'))
      .finally(() => setLoading(false))
  }, [dispatch])

  useEffect(() => {
    if (budget.monthlyBudget !== undefined) {
      setMonthlyBudget(budget.monthlyBudget)
    }
    if (budget.categories) {
      setCategoryBudgets(budget.categories)
    }
  }, [budget.monthlyBudget, budget.categories])

  const addCategory = () => {
    setCategoryBudgets([...categoryBudgets, { category: 'Food', limit: 0 }])
  }

  const updateCategory = (index, field, value) => {
    setCategoryBudgets(categoryBudgets.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: field === 'limit' ? Number(value) : value } : item
    )))
  }

  const removeCategory = (index) => {
    setCategoryBudgets(categoryBudgets.filter((_, itemIndex) => itemIndex !== index))
  }

  const save = async (event) => {
    event.preventDefault()
    try {
      await dispatch(saveBudget({ monthlyBudget: Number(monthlyBudget), categoryBudgets })).unwrap()
      const response = await getDashboardSummary()
      setSummary(response.data.data)
      toast.success('Budget settings saved successfully.')
    } catch (err) {
      toast.error(err || 'Failed to save budget.')
    }
  }

  const totalExpense = summary?.totalExpense || 0
  const remaining = Number(monthlyBudget || 0) - totalExpense
  const usedPercent = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpense / monthlyBudget) * 100)) : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Budget</h2>
          <p className="mt-1 text-sm text-slate-500">Set monthly and category limits, then track progress as spending changes.</p>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <CardSkeleton />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Budget</h2>
        <p className="mt-1 text-sm text-slate-500">Set monthly and category limits, then track progress as spending changes.</p>
      </div>

      {budget.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {budget.error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <form onSubmit={save} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Monthly Budget (₹)</label>
              <input
                type="number"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                placeholder="e.g. 50000"
              />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Category Budgets</h3>
              <button
                type="button"
                onClick={addCategory}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                + Add Category
              </button>
            </div>

            <div className="space-y-3">
              {categoryBudgets.map((item, index) => {
                const spent = summary?.categoryBreakdown?.find((entry) => entry.category === item.category)?.amount || 0
                const percent = item.limit ? Math.min(100, Math.round((spent / item.limit) * 100)) : 0
                return (
                  <div key={`${item.category}-${index}`} className="rounded-lg border p-4 bg-slate-50/50">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <select
                        value={item.category}
                        onChange={(e) => updateCategory(index, 'category', e.target.value)}
                        className="rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Limit (₹)"
                        value={item.limit}
                        onChange={(e) => updateCategory(index, 'limit', e.target.value)}
                        className="rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>{formatCurrency(spent)} spent of {formatCurrency(item.limit)}</span>
                        <span className="font-semibold">{percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${percent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {!categoryBudgets.length && (
                <p className="text-xs text-slate-400 italic py-2">No category limits defined yet. Click "+ Add Category" above to set specific category limits.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={budget.loading}
              className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm shadow-sm"
            >
              {budget.loading ? 'Saving...' : 'Save Budget'}
            </button>
          </form>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 border-b pb-3">Monthly Progress</h3>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Spent</p>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpense)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Remaining</p>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs text-slate-600">
                <span>Budget used</span>
                <span className="font-semibold">{usedPercent}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${usedPercent >= 100 ? 'bg-rose-500' : 'bg-sky-500'}`}
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
            </div>
            {remaining < 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                ⚠️ Overspending alert: you are over budget by {formatCurrency(Math.abs(remaining))}.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Budget