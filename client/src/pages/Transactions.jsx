import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTransactions,
  removeTransactionById,
  saveTransaction,
  importTransactionsBatch
} from '../redux/slices/transactionSlice'
import { categories, formatCurrency, formatDate, paymentMethods } from '../utils/format'
import { exportTransactionsToCSV, parseTransactionsCSV } from '../utils/csvHelper'
import { useToast } from '../context/ToastContext'
import { TableSkeleton } from '../components/common/SkeletonLoader'

const emptyForm = {
  type: 'expense',
  title: '',
  amount: '',
  category: 'Food',
  paymentMethod: 'upi',
  description: '',
  transactionDate: new Date().toISOString().slice(0, 10)
}

function Transactions() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { transactions, pagination, loading, error } = useSelector(state => state.transactions)

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    sort: 'latest',
    page: 1
  })

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  
  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parsedPreview, setParsedPreview] = useState([])
  const fileInputRef = useRef(null)

  const query = useMemo(() => ({ ...filters, limit: 10 }), [filters])

  useEffect(() => {
    dispatch(fetchTransactions(query))
  }, [dispatch, query])

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? value : 1
    }))
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      sort: 'latest',
      page: 1
    })
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditingId(item._id)
    setForm({
      type: item.type,
      title: item.title,
      amount: item.amount,
      category: item.category,
      paymentMethod: item.paymentMethod || 'upi',
      description: item.description || '',
      transactionDate: item.transactionDate
        ? new Date(item.transactionDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    })
    setShowForm(true)
  }

  const submitForm = async (event) => {
    event.preventDefault()
    try {
      await dispatch(saveTransaction({
        id: editingId,
        data: {
          ...form,
          amount: Number(form.amount)
        }
      })).unwrap()

      setShowForm(false)
      dispatch(fetchTransactions(query))
      toast.success(editingId ? 'Transaction updated successfully.' : 'Transaction added successfully.')
    } catch (err) {
      toast.error(err || 'Failed to save transaction.')
    }
  }

  const deleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return
    try {
      await dispatch(removeTransactionById(item._id)).unwrap()
      dispatch(fetchTransactions(query))
      toast.success('Transaction deleted successfully.')
    } catch (err) {
      toast.error(err || 'Failed to delete transaction.')
    }
  }

  const handleExportCSV = () => {
    try {
      exportTransactionsToCSV(transactions, `FinTrack_Transactions_${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success('Transactions exported to CSV.')
    } catch (err) {
      toast.error(err.message || 'Export failed.')
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await parseTransactionsCSV(file)
      setParsedPreview(data)
      toast.info(`Parsed ${data.length} transactions from file. Ready to import.`)
    } catch (err) {
      toast.error(err.message || 'Failed to parse CSV file.')
      setParsedPreview([])
    }
  }

  const executeImport = async () => {
    if (!parsedPreview.length) return
    setImporting(true)
    try {
      await dispatch(importTransactionsBatch(parsedPreview)).unwrap()
      setShowImportModal(false)
      setParsedPreview([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      dispatch(fetchTransactions(query))
      toast.success(`Successfully imported ${parsedPreview.length} transactions!`)
    } catch (err) {
      toast.error(err || 'Failed to import transactions.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
          <p className="mt-1 text-sm text-slate-500">Record, organize, search, and export your income and expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5"
            title="Download table data as CSV"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5"
            title="Upload transactions from CSV file"
          >
            📤 Import CSV
          </button>
          <button
            onClick={openCreate}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors shadow-sm"
          >
            + Add Transaction
          </button>
        </div>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            placeholder="Search title/category..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
          />

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Amount High → Low</option>
            <option value="amount_asc">Amount Low → High</option>
          </select>

          <button
            onClick={resetFilters}
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions?.length ? (
                  transactions.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{item.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                          item.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.category}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(item.transactionDate)}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{item.paymentMethod?.replace('_', ' ') || 'Card'}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(item)}
                            className="rounded px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                      <p className="font-medium text-slate-700">No transactions recorded yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Click "+ Add Transaction" or "Import CSV" to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <p className="text-slate-600">
              Page <span className="font-semibold text-slate-900">{pagination?.page || 1}</span> of{' '}
              <span className="font-semibold text-slate-900">{pagination?.pages || 1}</span> (Total: {pagination?.total || 0})
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination?.page <= 1}
                onClick={() => handleFilterChange('page', (pagination?.page || 1) - 1)}
                className="rounded border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={pagination?.page >= (pagination?.pages || 1)}
                onClick={() => handleFilterChange('page', (pagination?.page || 1) + 1)}
                className="rounded border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Transaction' : 'Add New Transaction'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitForm} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery shopping"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={form.transactionDate}
                  onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Additional notes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-secondary px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  {editingId ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Import Transactions via CSV</h3>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false)
                  setParsedPreview([])
                }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload a `.csv` file with columns: <span className="font-semibold text-slate-700">Title, Amount, Type (income/expense), Category, Date, PaymentMethod, Description</span>.
            </p>

            <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {parsedPreview.length > 0 && (
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-800">
                  Ready to import {parsedPreview.length} entries. Preview of first 3 items:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {parsedPreview.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="truncate">
                      • <span className="font-medium">{item.title}</span> ({item.type}): ₹{item.amount} [{item.category}]
                    </li>
                  ))}
                  {parsedPreview.length > 3 && (
                    <li className="text-slate-400 italic">... and {parsedPreview.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false)
                  setParsedPreview([])
                }}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!parsedPreview.length || importing}
                onClick={executeImport}
                className="rounded-lg bg-secondary px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Import ${parsedPreview.length || 0} Transactions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions