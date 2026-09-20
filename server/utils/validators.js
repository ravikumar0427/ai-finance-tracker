import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters').optional(),
  email: z.string().trim().email('Please provide a valid email address').toLowerCase().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: "Type must be either 'income' or 'expense'" })
  }),
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().trim().min(1, 'Category is required').max(50, 'Category cannot exceed 50 characters'),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']).optional().default('upi'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().default(''),
  transactionDate: z.string().optional().or(z.date().optional())
});

export const updateTransactionSchema = transactionSchema.partial();

export const batchTransactionSchema = z.object({
  transactions: z.array(transactionSchema).min(1, 'At least one transaction is required').max(500, 'Cannot batch import more than 500 transactions at once')
});

export const budgetSchema = z.object({
  monthlyBudget: z.coerce.number().min(0, 'Monthly budget must be 0 or greater'),
  categoryBudgets: z.array(
    z.object({
      category: z.string().trim().min(1, 'Category name is required'),
      limit: z.coerce.number().min(0, 'Limit must be 0 or greater')
    })
  ).optional().default([])
});

export const reportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  format: z.enum(['json', 'pdf']).optional()
});
