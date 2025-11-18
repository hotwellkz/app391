const formatAmount = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? Number(amount.replace(/[^0-9]/g, '')) : amount;
  return numericAmount.toLocaleString('ru-RU');
};

export { formatAmount }; 