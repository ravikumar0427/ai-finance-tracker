import Papa from 'papaparse';

export const exportTransactionsToCSV = (transactions = [], filename = 'transactions.csv') => {
  if (!transactions.length) {
    throw new Error('No transactions available to export');
  }

  const data = transactions.map((t) => ({
    Date: t.transactionDate ? new Date(t.transactionDate).toISOString().slice(0, 10) : '',
    Type: t.type,
    Title: t.title,
    Amount: t.amount,
    Category: t.category,
    PaymentMethod: t.paymentMethod || 'upi',
    Description: t.description || ''
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseTransactionsCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const parsed = results.data.map((row, index) => {
            const type = (row.Type || row.type || 'expense').toString().toLowerCase().trim();
            const title = (row.Title || row.title || row.Description || row.description || `Transaction #${index + 1}`).toString().trim();
            const amount = Math.abs(Number(row.Amount || row.amount || 0));
            const category = (row.Category || row.category || 'Other').toString().trim();
            const paymentMethod = (row.PaymentMethod || row.paymentMethod || row['Payment Method'] || 'upi').toString().toLowerCase().trim();
            const description = (row.Description || row.description || '').toString().trim();
            const rawDate = row.Date || row.date || row.TransactionDate || row.transactionDate;
            const transactionDate = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

            if (!amount || isNaN(amount) || amount <= 0) {
              throw new Error(`Row ${index + 1}: Invalid or zero amount`);
            }

            return {
              type: ['income', 'expense'].includes(type) ? type : 'expense',
              title,
              amount,
              category,
              paymentMethod: ['cash', 'card', 'upi', 'bank_transfer', 'other'].includes(paymentMethod) ? paymentMethod : 'upi',
              description,
              transactionDate
            };
          });

          if (!parsed.length) {
            return reject(new Error('CSV file is empty or could not be parsed'));
          }

          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => reject(error)
    });
  });
};
