import API from './api'

export const getDashboardSummary = (timeframe = 'all') =>
  API.get('/dashboard/summary', { params: { timeframe } })
