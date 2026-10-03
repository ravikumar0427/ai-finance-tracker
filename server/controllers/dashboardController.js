import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const { timeframe } = req.query;

    let query = {
      userId: req.userId,
      isDeleted: { $ne: true }
    };

    if (timeframe && timeframe !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      if (timeframe === '1m' || timeframe === 'month') {
        cutoff.setMonth(now.getMonth() - 1);
      } else if (timeframe === '3m') {
        cutoff.setMonth(now.getMonth() - 3);
      } else if (timeframe === '6m') {
        cutoff.setMonth(now.getMonth() - 6);
      } else if (timeframe === '1y' || timeframe === 'year') {
        cutoff.setFullYear(now.getFullYear() - 1);
      }
      query.transactionDate = { $gte: cutoff };
    }

    const transactions = await Transaction.find(query).sort({ transactionDate: -1 });
    const budget = await Budget.findOne({ userId: req.userId });
    const summary = summarizeTransactions(transactions, budget);

    res.status(200).json({
      success: true,
      data: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        savings: summary.savings,
        budgetRemaining: summary.budgetRemaining,
        monthlyTrend: summary.monthlyTrend,
        dailyTrend: summary.dailyTrend,
        categoryBreakdown: summary.categoryBreakdown,
        categoryMonthlyMap: summary.categoryMonthlyMap,
        recentTransactions: transactions.slice(0, 10),
        allTransactions: transactions.map((t) => ({
          _id: t._id,
          title: t.title,
          amount: t.amount,
          type: t.type,
          category: t.category,
          paymentMethod: t.paymentMethod,
          transactionDate: t.transactionDate
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};