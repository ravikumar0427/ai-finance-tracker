import PDFDocument from 'pdfkit';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';

const formatCurrency = (value) => {
  const isNeg = Number(value || 0) < 0;
  const num = Math.round(Math.abs(value || 0)).toLocaleString('en-IN');
  return isNeg ? `- Rs. ${num}` : `Rs. ${num}`;
};

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
        margin: 0,
        size: 'A4',
        bufferPages: true,
        autoFirstPage: true
      });

      doc.pipe(res);

      const primaryColor = '#0f172a'; // Slate 900
      const secondaryColor = '#2563eb'; // Blue 600
      const emeraldColor = '#059669'; // Green 600
      const roseColor = '#dc2626'; // Red 600
      const grayBorder = '#e2e8f0'; // Slate 200
      const textDark = '#1e293b'; // Slate 800
      const textMuted = '#64748b'; // Slate 500
      const tableHeaderHeight = 20;
      const rowHeight = 18;
      const maxPageY = 760;

      // Helper: Draw Table Header
      const drawTableHeader = (y) => {
        doc.rect(40, y, 515, tableHeaderHeight).fill(primaryColor);
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('DATE', 48, y + 6, { width: 65, lineBreak: false });
        doc.text('DESCRIPTION / TITLE', 115, y + 6, { width: 175, lineBreak: false });
        doc.text('CATEGORY', 295, y + 6, { width: 90, lineBreak: false });
        doc.text('METHOD', 390, y + 6, { width: 70, lineBreak: false });
        doc.text('AMOUNT', 465, y + 6, { width: 80, align: 'right', lineBreak: false });
      };

      // --- PAGE 1: HEADER BANNER ---
      doc.rect(40, 40, 515, 85).fill(primaryColor);

      // Logo Icon box with "FT"
      doc.roundedRect(55, 55, 36, 36, 8).fill(secondaryColor);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('FT', 64, 66, { lineBreak: false });

      // Header Text
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('FinTrack', 102, 53, { lineBreak: false });
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('AI Personal Finance & Expense Intelligence', 102, 75, { lineBreak: false });

      // Period & User info
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(`${monthName} ${year}`, 360, 55, { align: 'right', width: 180, lineBreak: false });
      doc.fillColor('#94a3b8').fontSize(8.5).font('Helvetica').text(`Account: ${report.user.name}`, 360, 72, { align: 'right', width: 180, lineBreak: false });
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 360, 85, { align: 'right', width: 180, lineBreak: false });

      // --- 2. EXECUTIVE SUMMARY CARDS ---
      const cardY = 135;
      const cardW = 120;
      const cardH = 65;
      const cardGap = 11.5;

      const cards = [
        { label: 'Total Income', val: formatCurrency(report.totalIncome), color: emeraldColor, bg: '#ecfdf5', border: '#a7f3d0' },
        { label: 'Total Expense', val: formatCurrency(report.totalExpense), color: roseColor, bg: '#fff1f2', border: '#fecdd3' },
        { label: 'Net Savings', val: formatCurrency(report.savings), color: report.savings >= 0 ? emeraldColor : roseColor, bg: '#f0fdf4', border: '#bbf7d0' },
        { label: 'Budget Remaining', val: formatCurrency(report.budgetRemaining), color: report.budgetRemaining < 0 ? roseColor : secondaryColor, bg: '#eff6ff', border: '#bfdbfe' }
      ];

      cards.forEach((c, i) => {
        const x = 40 + i * (cardW + cardGap);
        doc.roundedRect(x, cardY, cardW, cardH, 6).fillAndStroke(c.bg, c.border);
        doc.fillColor(textMuted).fontSize(7.5).font('Helvetica-Bold').text(c.label.toUpperCase(), x + 8, cardY + 10, { width: cardW - 16, lineBreak: false });
        doc.fillColor(c.color).fontSize(12).font('Helvetica-Bold').text(c.val, x + 8, cardY + 28, { width: cardW - 16, lineBreak: false });
        
        const subtext = i === 2 
          ? (report.totalIncome > 0 ? `${Math.round((report.savings / report.totalIncome) * 100)}% savings rate` : '0%')
          : i === 1 && report.totalIncome > 0 ? `${Math.round((report.totalExpense / report.totalIncome) * 100)}% of income` : '';
        if (subtext) {
          doc.fillColor(textMuted).fontSize(7).font('Helvetica').text(subtext, x + 8, cardY + 48, { lineBreak: false });
        }
      });

      // --- 3. CATEGORY EXPENSE BREAKDOWN (Vector Bars) ---
      let currentY = 215;
      doc.fillColor(textDark).fontSize(11).font('Helvetica-Bold').text('Expense Distribution by Category', 40, currentY, { lineBreak: false });
      doc.rect(40, currentY + 15, 515, 1).fill(grayBorder);

      currentY += 22;

      const categories = report.categoryBreakdown || [];
      const totalExpenseVal = report.totalExpense || 1;

      if (categories.length === 0) {
        doc.fillColor(textMuted).fontSize(8.5).font('Helvetica-Oblique').text('No expense records recorded for this monthly period.', 40, currentY, { lineBreak: false });
        currentY += 16;
      } else {
        const palette = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#4b5563'];
        
        categories.slice(0, 5).forEach((cat, idx) => {
          const pct = Math.round((cat.amount / totalExpenseVal) * 100);
          const barColor = palette[idx % palette.length];
          const barMaxW = 270;
          const barW = Math.max(6, Math.min(barMaxW, (cat.amount / totalExpenseVal) * barMaxW));

          doc.fillColor(textDark).fontSize(8).font('Helvetica-Bold').text(cat.category, 40, currentY + 2, { width: 90, lineBreak: false });
          doc.roundedRect(135, currentY + 2, barMaxW, 9, 3).fill('#f1f5f9');
          doc.roundedRect(135, currentY + 2, barW, 9, 3).fill(barColor);

          doc.fillColor(textDark).fontSize(8).font('Helvetica-Bold').text(formatCurrency(cat.amount), 415, currentY + 2, { width: 85, align: 'right', lineBreak: false });
          doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(`${pct}%`, 505, currentY + 2, { width: 45, align: 'right', lineBreak: false });

          currentY += 16;
        });
      }

      // --- 4. CASH FLOW HEALTH METER ---
      currentY += 8;
      doc.roundedRect(40, currentY, 515, 30, 6).fill('#f8fafc');
      doc.rect(40, currentY, 515, 30).stroke(grayBorder);
      
      const incomeVal = Math.max(1, report.totalIncome);
      const expenseVal = report.totalExpense;
      const incomeRatio = Math.min(100, Math.round((expenseVal / incomeVal) * 100));

      doc.fillColor(textDark).fontSize(8).font('Helvetica-Bold').text('Monthly Cash Flow Health:', 52, currentY + 10, { lineBreak: false });
      doc.fillColor(incomeRatio > 90 ? roseColor : emeraldColor).font('Helvetica-Bold').text(
        incomeRatio <= 100 ? `${100 - incomeRatio}% Saved / Retained` : `Budget Deficit (Exceeded by ${incomeRatio - 100}%)`,
        195,
        currentY + 10,
        { lineBreak: false }
      );

      doc.roundedRect(365, currentY + 9, 175, 11, 4).fill('#e2e8f0');
      doc.roundedRect(365, currentY + 9, Math.min(175, (incomeRatio / 100) * 175), 11, 4).fill(incomeRatio > 90 ? roseColor : secondaryColor);

      currentY += 42;

      // --- 5. ITEMIZED STATEMENT TABLE WITH DYNAMIC MULTI-PAGE STREAMING ---
      doc.fillColor(textDark).fontSize(11).font('Helvetica-Bold').text('Itemized Transaction Statement', 40, currentY, { lineBreak: false });
      currentY += 16;

      drawTableHeader(currentY);
      currentY += tableHeaderHeight;

      const txList = report.transactions || [];
      if (!txList.length) {
        doc.rect(40, currentY, 515, 24).fill('#ffffff').stroke(grayBorder);
        doc.fillColor(textMuted).fontSize(8).font('Helvetica-Oblique').text('No transactions recorded during this period.', 50, currentY + 7, { lineBreak: false });
        currentY += 24;
      } else {
        txList.forEach((tx, idx) => {
          // Check if row exceeds printable height -> trigger new page with fresh table header!
          if (currentY + rowHeight > maxPageY) {
            doc.addPage();
            currentY = 45;
            // Draw continuing header on new page
            doc.fillColor(textDark).fontSize(10).font('Helvetica-Bold').text(`Itemized Transaction Statement (Continued - ${monthName} ${year})`, 40, currentY, { lineBreak: false });
            currentY += 18;
            drawTableHeader(currentY);
            currentY += tableHeaderHeight;
          }

          const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(40, currentY, 515, rowHeight).fill(rowBg);
          doc.rect(40, currentY, 515, rowHeight).stroke(grayBorder);

          const isIncome = tx.type === 'income';
          const dateStr = new Date(tx.transactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

          doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(dateStr, 48, currentY + 5, { width: 65, lineBreak: false });
          doc.fillColor(textDark).fontSize(8).font('Helvetica-Bold').text(tx.title.slice(0, 32), 115, currentY + 5, { width: 175, lineBreak: false });
          doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(tx.category, 295, currentY + 5, { width: 90, lineBreak: false });
          doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(tx.paymentMethod?.replace('_', ' ').toUpperCase() || 'UPI', 390, currentY + 5, { width: 70, lineBreak: false });

          const amtStr = isIncome ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`;
          doc.fillColor(isIncome ? emeraldColor : roseColor).fontSize(8).font('Helvetica-Bold').text(
            amtStr,
            465,
            currentY + 5,
            { width: 80, align: 'right', lineBreak: false }
          );

          currentY += rowHeight;
        });
      }

      // --- 6. GLOBAL FOOTER ON ALL PAGES WITH ACCURATE PAGE NUMBERING ---
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.rect(40, 800, 515, 1).fill(grayBorder);
        doc.fillColor(textMuted).fontSize(7.5).font('Helvetica').text(
          `FinTrack AI Personal Finance Statement • Strictly Confidential • Page ${i + 1} of ${pageCount}`,
          40,
          808,
          { width: 515, align: 'center', lineBreak: false }
        );
      }

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