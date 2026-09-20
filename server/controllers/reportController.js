import PDFDocument from 'pdfkit';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';

const formatCurrency = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

export const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [transactions, budget, user] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        isDeleted: { $ne: true },
        transactionDate: { $gte: start, $lt: end }
      }).sort({ transactionDate: -1 }),
      Budget.findOne({ userId: req.userId }),
      User.findById(req.userId).select('name email')
    ]);

    const summary = summarizeTransactions(transactions, budget);
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

    const report = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      monthName,
      year,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      savings: summary.savings,
      budgetRemaining: summary.budgetRemaining,
      categoryBreakdown: summary.categoryBreakdown,
      monthlyTrend: summary.monthlyTrend,
      transactions,
      user: {
        name: user?.name || 'Valued User',
        email: user?.email || ''
      }
    };

    if (req.query.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=FinTrack-Report-${report.period}.pdf`);

      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true
      });

      doc.pipe(res);

      const primaryColor = '#0f172a'; // Slate 900
      const secondaryColor = '#2563eb'; // Blue 600
      const emeraldColor = '#059669'; // Green 600
      const roseColor = '#dc2626'; // Red 600
      const grayLight = '#f8fafc'; // Slate 50
      const grayBorder = '#e2e8f0'; // Slate 200
      const textDark = '#1e293b'; // Slate 800
      const textMuted = '#64748b'; // Slate 500

      // --- 1. HEADER BANNER ---
      doc.rect(40, 40, 515, 85).fill(primaryColor);

      // Logo Icon box
      doc.roundedRect(55, 55, 36, 36, 8).fill(secondaryColor);
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('₹', 68, 62);

      // Header Text
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('FinTrack', 102, 53);
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('AI Personal Finance & Expense Intelligence', 102, 75);

      // Period & User info (Right aligned in banner)
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(`${monthName} ${year}`, 360, 55, { align: 'right', width: 180 });
      doc.fillColor('#94a3b8').fontSize(8.5).font('Helvetica').text(`Account: ${report.user.name}`, 360, 72, { align: 'right', width: 180 });
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 360, 85, { align: 'right', width: 180 });

      // --- 2. EXECUTIVE SUMMARY CARDS (4 Grid Cards) ---
      const cardY = 140;
      const cardW = 120;
      const cardH = 65;
      const cardGap = 11.5;

      const cards = [
        { label: 'Total Income', val: formatCurrency(report.totalIncome), color: emeraldColor, bg: '#ecfdf5', border: '#a7f3d0' },
        { label: 'Total Expense', val: formatCurrency(report.totalExpense), color: roseColor, bg: '#fff1f2', border: '#fecdd3' },
        { label: 'Net Savings', val: formatCurrency(report.savings), color: report.savings >= 0 ? emeraldColor : roseColor, bg: '#f0fdf4', border: '#bbf7d0' },
        { label: 'Budget Remaining', val: formatCurrency(report.budgetRemaining), color: secondaryColor, bg: '#eff6ff', border: '#bfdbfe' }
      ];

      cards.forEach((c, i) => {
        const x = 40 + i * (cardW + cardGap);
        doc.roundedRect(x, cardY, cardW, cardH, 6).fillAndStroke(c.bg, c.border);
        doc.fillColor(textMuted).fontSize(7.5).font('Helvetica-Bold').text(c.label.toUpperCase(), x + 8, cardY + 10, { width: cardW - 16 });
        doc.fillColor(c.color).fontSize(13).font('Helvetica-Bold').text(c.val, x + 8, cardY + 28, { width: cardW - 16 });
        
        const subtext = i === 2 
          ? (report.totalIncome > 0 ? `${Math.round((report.savings / report.totalIncome) * 100)}% savings rate` : '0%')
          : i === 1 && report.totalIncome > 0 ? `${Math.round((report.totalExpense / report.totalIncome) * 100)}% of income` : '';
        if (subtext) {
          doc.fillColor(textMuted).fontSize(7).font('Helvetica').text(subtext, x + 8, cardY + 48);
        }
      });

      // --- 3. SECTION: CATEGORY EXPENSE BREAKDOWN (Vector Bar Charts) ---
      let currentY = 225;
      doc.fillColor(textDark).fontSize(12).font('Helvetica-Bold').text('Expense Distribution by Category', 40, currentY);
      doc.rect(40, currentY + 16, 515, 1).fill(grayBorder);

      currentY += 26;

      const categories = report.categoryBreakdown || [];
      const totalExpenseVal = report.totalExpense || 1;

      if (categories.length === 0) {
        doc.fillColor(textMuted).fontSize(9).font('Helvetica-Oblique').text('No expense records recorded for this monthly period.', 40, currentY);
        currentY += 20;
      } else {
        const palette = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#4b5563'];
        
        categories.slice(0, 6).forEach((cat, idx) => {
          const pct = Math.round((cat.amount / totalExpenseVal) * 100);
          const barColor = palette[idx % palette.length];
          const barMaxW = 280;
          const barW = Math.max(6, Math.min(barMaxW, (cat.amount / totalExpenseVal) * barMaxW));

          // Category Label
          doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text(cat.category, 40, currentY + 2, { width: 90 });
          
          // Background Bar Track
          doc.roundedRect(135, currentY + 2, barMaxW, 10, 3).fill('#f1f5f9');
          // Filled Colored Bar
          doc.roundedRect(135, currentY + 2, barW, 10, 3).fill(barColor);

          // Value and Percent
          doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text(formatCurrency(cat.amount), 430, currentY + 2, { width: 75, align: 'right' });
          doc.fillColor(textMuted).fontSize(8).font('Helvetica').text(`${pct}%`, 515, currentY + 2, { width: 40, align: 'right' });

          currentY += 18;
        });
      }

      // --- 4. SECTION: CASH FLOW RATIO VISUALIZER ---
      currentY += 10;
      doc.roundedRect(40, currentY, 515, 34, 6).fill('#f8fafc');
      doc.rect(40, currentY, 515, 34).stroke(grayBorder);
      
      const incomeVal = Math.max(1, report.totalIncome);
      const expenseVal = report.totalExpense;
      const incomeRatio = Math.min(100, Math.round((expenseVal / incomeVal) * 100));

      doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text('Monthly Cash Flow Health:', 52, currentY + 11);
      doc.fillColor(incomeRatio > 90 ? roseColor : emeraldColor).font('Helvetica-Bold').text(
        incomeRatio <= 100 ? `${100 - incomeRatio}% Saved / Retained` : `Budget Deficit (Exceeded by ${incomeRatio - 100}%)`,
        200,
        currentY + 11
      );

      // Mini Progress Bar
      doc.roundedRect(365, currentY + 10, 175, 12, 4).fill('#e2e8f0');
      doc.roundedRect(365, currentY + 10, Math.min(175, (incomeRatio / 100) * 175), 12, 4).fill(incomeRatio > 90 ? roseColor : secondaryColor);

      currentY += 46;

      // --- 5. SECTION: ITEMIZED STATEMENT TABLE ---
      doc.fillColor(textDark).fontSize(12).font('Helvetica-Bold').text('Itemized Transaction Statement', 40, currentY);
      currentY += 18;

      // Table Header Row
      const tableTop = currentY;
      doc.rect(40, tableTop, 515, 20).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('DATE', 48, tableTop + 6, { width: 65 });
      doc.text('DESCRIPTION / TITLE', 115, tableTop + 6, { width: 175 });
      doc.text('CATEGORY', 295, tableTop + 6, { width: 90 });
      doc.text('METHOD', 390, tableTop + 6, { width: 70 });
      doc.text('AMOUNT', 465, tableTop + 6, { width: 80, align: 'right' });

      currentY = tableTop + 20;

      const txList = report.transactions || [];
      if (!txList.length) {
        doc.rect(40, currentY, 515, 26).fill('#ffffff').stroke(grayBorder);
        doc.fillColor(textMuted).fontSize(8.5).font('Helvetica-Oblique').text('No transactions recorded during this period.', 50, currentY + 8);
        currentY += 26;
      } else {
        txList.slice(0, 22).forEach((tx, idx) => {
          const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(40, currentY, 515, 18).fill(rowBg);
          doc.rect(40, currentY, 515, 18).stroke(grayBorder);

          const isIncome = tx.type === 'income';
          const dateStr = new Date(tx.transactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

          doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(dateStr, 48, currentY + 5, { width: 65 });
          doc.fillColor(textDark).fontSize(8).font('Helvetica-Bold').text(tx.title.slice(0, 30), 115, currentY + 5, { width: 175, lineBreak: false });
          doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(tx.category, 295, currentY + 5, { width: 90, lineBreak: false });
          doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(tx.paymentMethod?.replace('_', ' ').toUpperCase() || 'UPI', 390, currentY + 5, { width: 70 });

          doc.fillColor(isIncome ? emeraldColor : roseColor).fontSize(8).font('Helvetica-Bold').text(
            `${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`,
            465,
            currentY + 5,
            { width: 80, align: 'right' }
          );

          currentY += 18;
        });

        if (txList.length > 22) {
          doc.fillColor(textMuted).fontSize(7.5).font('Helvetica-Oblique').text(`* Showing first 22 of ${txList.length} transactions for this period.`, 45, currentY + 6);
          currentY += 16;
        }
      }

      // --- 6. FOOTER ---
      const pageHeight = 841.89; // Standard A4 height
      doc.rect(40, pageHeight - 45, 515, 1).fill(grayBorder);
      doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(
        'FinTrack AI Personal Finance Statement • Generated automatically for authorized account holder only • Strictly Confidential',
        40,
        pageHeight - 34,
        { width: 515, align: 'center' }
      );

      doc.end();
      return;
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};