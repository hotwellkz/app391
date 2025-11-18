export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
};

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount)) + ' ₸';
};

export const formatPercent = (value: number): string => {
  return Math.round(value).toString() + '%';
};
