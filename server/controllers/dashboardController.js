import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
      isDeleted: { $ne: true }
    }).sort({ transactionDate: -1 });
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
        recentTransactions: transactions.slice(0, 5),
        allTransactions: transactions.slice(0, 100).map((t) => ({
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