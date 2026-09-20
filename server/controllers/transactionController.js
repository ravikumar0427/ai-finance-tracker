import Transaction from '../models/Transaction.js';

export const createTransaction = async (req, res) => {
  try {
    const { type, title, amount, category, paymentMethod, description, transactionDate } = req.body;

    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
      paymentMethod: paymentMethod || 'upi',
      description: description?.trim() || '',
      transactionDate: transactionDate || new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type, search, sort = 'latest' } = req.query;

    const query = { userId: req.userId, isDeleted: { $ne: true } };
    if (category) query.category = category;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortMap = {
      latest: { transactionDate: -1 },
      oldest: { transactionDate: 1 },
      amount_desc: { amount: -1 },
      amount_asc: { amount: 1 }
    };

    const transactions = await Transaction.find(query)
      .sort(sortMap[sort] || sortMap.latest)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, amount, category, paymentMethod, description, transactionDate } = req.body;

    const update = {
      ...(type && { type }),
      ...(title !== undefined && { title: title.trim() }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(category !== undefined && { category: category.trim() }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(transactionDate !== undefined && { transactionDate })
    };

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete transaction for audit trail and data safety
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const batchImportTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty array of transactions'
      });
    }

    const docs = transactions.map((t) => ({
      userId: req.userId,
      type: t.type,
      title: t.title.trim(),
      amount: Number(t.amount),
      category: t.category.trim(),
      paymentMethod: t.paymentMethod || 'upi',
      description: t.description?.trim() || '',
      transactionDate: t.transactionDate ? new Date(t.transactionDate) : new Date(),
      isDeleted: false
    }));

    const result = await Transaction.insertMany(docs);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.length} transactions`,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};