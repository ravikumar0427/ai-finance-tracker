import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights, fetchPrediction } from '../redux/slices/insightSlice'
import { formatCurrency } from '../utils/format'
import { useToast } from '../context/ToastContext'
import { CardSkeleton, InsightSkeleton } from '../components/common/SkeletonLoader'

function Insights() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { insights, predictions, provider, loading, error } = useSelector(state => state.insights)

  useEffect(() => {
    dispatch(fetchInsights())
    dispatch(fetchPrediction())
  }, [dispatch])

  const refresh = async () => {
    try {
      await Promise.all([
        dispatch(fetchInsights()).unwrap(),
        dispatch(fetchPrediction()).unwrap()
      ])
      toast.success('Insights refreshed.')
    } catch (err) {
      toast.error(err || 'Failed to refresh insights.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Insights & Forecasting</h2>
          <p className="mt-1 text-sm text-slate-500">
            Smart analysis powered by OpenAI with intelligent deterministic fallback engine.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-lg bg-secondary px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm text-sm"
        >
          🔄 Refresh Insights
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <h3 className="font-semibold text-slate-900">Recommendations & Insights</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600 border">
              Provider: {provider || 'heuristic'}
            </span>
          </div>

          {loading ? (
            <InsightSkeleton />
          ) : (
            <div className="space-y-3">
              {insights?.length ? (
                insights.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 text-slate-800 text-sm leading-relaxed"
                  >
                    💡 {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic py-4">Add transactions to generate financial insights and recommendations.</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 border-b pb-3">Spending Prediction</h3>
          {loading ? (
            <div className="pt-4">
              <CardSkeleton />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Predicted Monthly Expense</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(predictions?.predictedExpense || 0)}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Model Confidence</span>
                  <span className="font-semibold">{predictions?.confidence || 0}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${predictions?.confidence || 0}%` }}
                  />
                </div>
              </div>

              {predictions?.budgetRisk && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  ⚠️ <span className="font-medium">Budget Warning:</span> Predicted spending exceeds your configured monthly budget.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Insights