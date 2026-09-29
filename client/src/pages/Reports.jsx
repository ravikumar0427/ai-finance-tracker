import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadMonthlyReport, getMonthlyReport } from '../services/reportService'
import { formatCurrency, formatDate } from '../utils/format'
import { useToast } from '../context/ToastContext'
import { CardSkeleton, ChartSkeleton } from '../components/common/SkeletonLoader'

function Reports() {
  const toast = useToast()
  const now = new Date()
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const params = useMemo(() => period, [period])

  useEffect(() => {
    setLoading(true)
    setError('')
    getMonthlyReport(params)
      .then((response) => setReport(response.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load report'))
      .finally(() => setLoading(false))
  }, [params])

  const exportPdf = async () => {
    try {
      setExporting(true)
      const response = await downloadMonthlyReport(params)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `finance-report-${period.year}-${String(period.month).padStart(2, '0')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('PDF report generated and downloaded.')
    } catch (err) {
      toast.error('Failed to export PDF: ' + (err.response?.data?.message || err.message))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monthly Reports & PDF Export</h2>
          <p className="mt-1 text-sm text-slate-500">Review monthly trends, category analytics, and export a formatted PDF report.</p>
        </div>
        <button
          onClick={exportPdf}
          disabled={exporting || loading}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm text-sm"
        >
          {exporting ? 'Generating PDF...' : '📄 Export PDF'}
        </button>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Month</label>
            <select
              value={period.month}
              onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
            <input
              type="number"
              value={period.year}
              onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <ChartSkeleton height="h-80" />
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Total Income</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(report.totalIncome)}</p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Total Expense</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(report.totalExpense)}</p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Net Savings</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(report.savings)}</p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Remaining Budget</p>
              <p className="text-2xl font-bold text-sky-700 mt-1">{formatCurrency(report.budgetRemaining)}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
              <h3 className="font-semibold text-slate-900 border-b pb-3">Category Breakdown</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.categoryBreakdown || []} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="category"
                      interval={0}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      angle={-18}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '0.5rem',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        padding: '8px 12px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-lg border bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 border-b pb-3">Period Transactions</h3>
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {report.transactions?.length ? (
                  report.transactions.map((item) => (
                    <div key={item._id} className="rounded-lg border p-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className={item.type === 'income' ? 'font-semibold text-emerald-600 text-sm' : 'font-semibold text-rose-600 text-sm'}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.category} • {formatDate(item.transactionDate)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic py-4">No transactions recorded for this period.</p>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default Reports