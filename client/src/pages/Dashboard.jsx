import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import SummaryCard from '../components/dashboard/SummaryCard'
import { getDashboardSummary } from '../services/dashboardService'
import { formatCurrency, formatDate, categories as allCategoryList } from '../utils/format'
import { CardSkeleton, ChartSkeleton } from '../components/common/SkeletonLoader'

const COLORS = ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#ec4899', '#6366f1']

const tooltipStyle = {
  backgroundColor: '#0f172a',
  borderRadius: '0.5rem',
  border: '1px solid #334155',
  color: '#f8fafc',
  padding: '8px 12px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
}

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Interactive controls
  const [dailyRange, setDailyRange] = useState('7d') // '7d' | '14d' | '30d' | 'month' | 'all'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [monthlyViewMode, setMonthlyViewMode] = useState('area') // 'area' | 'line' | 'bar'
  const [activeFilter, setActiveFilter] = useState({ type: null, value: null, label: null })

  useEffect(() => {
    getDashboardSummary()
      .then((response) => setSummary(response.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  // 1. Filtered Daily Trend & KPIs
  const filteredDailyTrend = useMemo(() => {
    const raw = summary?.dailyTrend || []
    if (!raw.length) return []
    if (dailyRange === 'all') return raw

    const now = new Date()
    if (dailyRange === 'month') {
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const matched = raw.filter((item) => item.date?.startsWith(currentYearMonth))
      return matched.length ? matched : raw.slice(-30)
    }

    const days = dailyRange === '7d' ? 7 : dailyRange === '14d' ? 14 : 30
    return raw.slice(-days)
  }, [summary?.dailyTrend, dailyRange])

  const dailyStats = useMemo(() => {
    if (!filteredDailyTrend.length) {
      return { total: 0, average: 0, peakDay: null, peakAmount: 0 }
    }
    const total = filteredDailyTrend.reduce((sum, item) => sum + (item.expense || 0), 0)
    const average = Math.round(total / (filteredDailyTrend.length || 1))
    let peakDay = null
    let peakAmount = 0
    filteredDailyTrend.forEach((item) => {
      if ((item.expense || 0) > peakAmount) {
        peakAmount = item.expense
        peakDay = item.date
      }
    })
    return { total, average, peakDay, peakAmount }
  }, [filteredDailyTrend])

  // 2. Filtered Monthly Trend & KPIs
  const filteredMonthlyTrend = useMemo(() => {
    const baseMonthly = summary?.monthlyTrend || []
    if (!baseMonthly.length) return []

    if (selectedCategory === 'all') {
      return baseMonthly.map((item) => ({
        month: item.month,
        expense: item.expense || 0,
        income: item.income || 0
      }))
    }

    const catMap = summary?.categoryMonthlyMap?.[selectedCategory] || {}
    return baseMonthly.map((item) => ({
      month: item.month,
      expense: catMap[item.month] || 0,
      income: item.income || 0
    }))
  }, [summary?.monthlyTrend, summary?.categoryMonthlyMap, selectedCategory])

  const monthlyStats = useMemo(() => {
    if (!filteredMonthlyTrend.length) {
      return { latestTotal: 0, prevTotal: 0, deltaPercent: 0, deltaAmount: 0, isIncrease: false }
    }
    const latest = filteredMonthlyTrend[filteredMonthlyTrend.length - 1]?.expense || 0
    const prev = filteredMonthlyTrend.length > 1 ? filteredMonthlyTrend[filteredMonthlyTrend.length - 2]?.expense || 0 : 0
    const deltaAmount = latest - prev
    const deltaPercent = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0
    const isIncrease = deltaAmount > 0
    return { latestTotal: latest, prevTotal: prev, deltaPercent, deltaAmount, isIncrease }
  }, [filteredMonthlyTrend])

  // 3. Category Breakdown & Income vs Expense
  const trend = summary?.monthlyTrend || []
  const categories = summary?.categoryBreakdown || []
  const incomeExpense = trend.map((item) => ({
    month: item.month,
    Income: item.income,
    Expense: item.expense
  }))

  // 4. Cross-filtered Transactions Feed
  const displayedTransactions = useMemo(() => {
    const pool = summary?.allTransactions?.length ? summary.allTransactions : (summary?.recentTransactions || [])
    let filtered = pool

    if (activeFilter.type === 'date' && activeFilter.value) {
      filtered = filtered.filter((t) => {
        const d = new Date(t.transactionDate)
        if (isNaN(d.getTime())) return false
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return dateKey === activeFilter.value
      })
    } else if (activeFilter.type === 'month' && activeFilter.value) {
      filtered = filtered.filter((t) => {
        const d = new Date(t.transactionDate)
        if (isNaN(d.getTime())) return false
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return monthKey === activeFilter.value
      })
    } else if (activeFilter.type === 'category' && activeFilter.value) {
      filtered = filtered.filter((t) => t.category === activeFilter.value)
    }

    return filtered.slice(0, 10)
  }, [summary, activeFilter])

  const handleClearFilter = () => {
    setActiveFilter({ type: null, value: null, label: null })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Your financial snapshot, trends, and recent activity.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton height="h-80" />
          <ChartSkeleton height="h-80" />
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ChartSkeleton height="h-80" />
          </div>
          <div>
            <ChartSkeleton height="h-80" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Interactive financial snapshot, daily burn rates, and spending trends.</p>
        </div>
        {activeFilter.type && (
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm animate-pulse">
            <span>Filtered: {activeFilter.label}</span>
            <button
              onClick={handleClearFilter}
              className="ml-1 rounded-full p-0.5 hover:bg-blue-200 text-blue-800 transition-colors"
              title="Clear Filter"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Income" value={formatCurrency(summary?.totalIncome)} tone="green" />
        <SummaryCard label="Total Expense" value={formatCurrency(summary?.totalExpense)} tone="red" />
        <SummaryCard label="Remaining Budget" value={formatCurrency(summary?.budgetRemaining)} tone="blue" />
        <SummaryCard label="Savings" value={formatCurrency(summary?.savings)} />
      </div>

      {/* Section 1: Daily & Monthly Spending Trends (Side by Side) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Spending Trend Card */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          {/* Header & Range Selector */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span>📈 Daily Spending Trend</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any data point to filter transactions below</p>
            </div>
            {/* Time Range Pills */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start sm:self-auto">
              {[
                { label: '7D', value: '7d' },
                { label: '14D', value: '14d' },
                { label: '30D', value: '30d' },
                { label: 'This Month', value: 'month' },
                { label: 'All', value: 'all' }
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setDailyRange(pill.value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                    dailyRange === pill.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center text-xs">
            <div>
              <p className="text-slate-500">Period Total</p>
              <p className="font-bold text-slate-800">{formatCurrency(dailyStats.total)}</p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-slate-500">Daily Average</p>
              <p className="font-bold text-slate-800">{formatCurrency(dailyStats.average)}/day</p>
            </div>
            <div>
              <p className="text-slate-500">Peak Spend</p>
              <p className="font-bold text-rose-600">
                {dailyStats.peakDay
                  ? `${formatDate(dailyStats.peakDay).split(',')[0]} (${formatCurrency(dailyStats.peakAmount)})`
                  : '₹0'}
              </p>
            </div>
          </div>

          {/* Daily Line / Area Chart */}
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredDailyTrend}
                key={`daily-area-${dailyRange}-${filteredDailyTrend.length}`}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const pointDate = e.activePayload[0].payload.date
                    setActiveFilter({
                      type: 'date',
                      value: pointDate,
                      label: `Day: ${formatDate(pointDate)}`
                    })
                  }
                }}
              >
                <defs>
                  <linearGradient id="dailyExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (!val) return ''
                    const d = new Date(val)
                    return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                  }}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatCurrency(value), 'Daily Expense']}
                  labelFormatter={(label) => {
                    if (!label) return ''
                    const d = new Date(label)
                    return isNaN(d.getTime()) ? label : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#dailyExpenseGradient)"
                  dot={{ r: 3, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff', cursor: 'pointer' }}
                  isAnimationActive={true}
                  animationDuration={1300}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Monthly Expenses Trend Card with Category Filter & View Switcher */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          {/* Header & Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span>🗓️ Monthly Expenses Trend</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Filter by category or switch chart visualization</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Dropdown Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {allCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* View Switcher (Area / Line / Bar) */}
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
                <button
                  onClick={() => setMonthlyViewMode('area')}
                  className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${
                    monthlyViewMode === 'area' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Gradient Area View"
                >
                  Area
                </button>
                <button
                  onClick={() => setMonthlyViewMode('line')}
                  className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${
                    monthlyViewMode === 'line' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Line View"
                >
                  Line
                </button>
                <button
                  onClick={() => setMonthlyViewMode('bar')}
                  className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${
                    monthlyViewMode === 'bar' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Bar Comparison View"
                >
                  Bar
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center text-xs">
            <div>
              <p className="text-slate-500">Selected Filter</p>
              <p className="font-bold text-slate-800 truncate">{selectedCategory === 'all' ? 'All Spending' : selectedCategory}</p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-slate-500">Latest Month</p>
              <p className="font-bold text-slate-800">{formatCurrency(monthlyStats.latestTotal)}</p>
            </div>
            <div>
              <p className="text-slate-500">MoM Change</p>
              <p className={`font-bold ${monthlyStats.isIncrease ? 'text-rose-600' : 'text-emerald-600'}`}>
                {monthlyStats.prevTotal > 0
                  ? `${monthlyStats.isIncrease ? '↑' : '↓'} ${Math.abs(monthlyStats.deltaPercent)}%`
                  : 'Baseline'}
              </p>
            </div>
          </div>

          {/* Monthly Dynamic Chart */}
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              {monthlyViewMode === 'bar' ? (
                <BarChart
                  data={filteredMonthlyTrend}
                  key={`monthly-bar-${selectedCategory}-${filteredMonthlyTrend.length}`}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      const pointMonth = e.activePayload[0].payload.month
                      setActiveFilter({
                        type: 'month',
                        value: pointMonth,
                        label: `Month: ${pointMonth}`
                      })
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), 'Expense']} />
                  <Bar
                    dataKey="expense"
                    fill="#dc2626"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1300}
                    cursor="pointer"
                  />
                </BarChart>
              ) : monthlyViewMode === 'line' ? (
                <LineChart
                  data={filteredMonthlyTrend}
                  key={`monthly-line-${selectedCategory}-${filteredMonthlyTrend.length}`}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      const pointMonth = e.activePayload[0].payload.month
                      setActiveFilter({
                        type: 'month',
                        value: pointMonth,
                        label: `Month: ${pointMonth}`
                      })
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), 'Expense']} />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#dc2626', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, stroke: '#dc2626', strokeWidth: 2, fill: '#ffffff', cursor: 'pointer' }}
                    isAnimationActive={true}
                    animationDuration={1300}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              ) : (
                <AreaChart
                  data={filteredMonthlyTrend}
                  key={`monthly-area-${selectedCategory}-${filteredMonthlyTrend.length}`}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      const pointMonth = e.activePayload[0].payload.month
                      setActiveFilter({
                        type: 'month',
                        value: pointMonth,
                        label: `Month: ${pointMonth}`
                      })
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="monthlyExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), 'Expense']} />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#monthlyExpenseGradient)"
                    dot={{ r: 4, fill: '#dc2626', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, stroke: '#dc2626', strokeWidth: 2, fill: '#ffffff', cursor: 'pointer' }}
                    isAnimationActive={true}
                    animationDuration={1300}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Section 2: Income vs Expense & Category Distribution */}
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900">📊 Income vs Expense Comparison</h3>
              <p className="text-xs text-slate-500 mt-0.5">Month-by-month cash flow balance</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpense} key={`income-expense-${incomeExpense.length}`}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="Income" fill="#059669" radius={[5, 5, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                <Bar dataKey="Expense" fill="#dc2626" radius={[5, 5, 0, 0]} isAnimationActive={true} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900">🍰 Category Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Where your money goes</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key={`categories-${categories.length}`}>
                <Pie
                  data={categories}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={95}
                  isAnimationActive={true}
                  animationDuration={1300}
                  onClick={(entry) => {
                    if (entry && entry.category) {
                      setActiveFilter({
                        type: 'category',
                        value: entry.category,
                        label: `Category: ${entry.category}`
                      })
                    }
                  }}
                  cursor="pointer"
                >
                  {categories.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Section 3: Interactive Filtered Transactions Feed */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span>💳 Recent & Filtered Activity</span>
              {activeFilter.type && (
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {activeFilter.label}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeFilter.type
                ? `Showing records matching ${activeFilter.label}`
                : 'Latest recorded financial activity'}
            </p>
          </div>

          {activeFilter.type && (
            <button
              onClick={handleClearFilter}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          {displayedTransactions.length ? (
            displayedTransactions.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3.5 hover:border-slate-300 hover:bg-slate-50/70 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {item.type === 'income' ? '↓' : '↑'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{item.category}</span> • {formatDate(item.transactionDate)} •{' '}
                      <span className="uppercase text-slate-400">{item.paymentMethod || 'Card'}</span>
                    </p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-500">No transactions found for the selected filter.</p>
              {activeFilter.type && (
                <button
                  onClick={handleClearFilter}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Reset filter to view all
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard