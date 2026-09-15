/**
 * Форматирует числовое значение бюджета в строковый формат: "12 345 678 руб."
 */
export const formatCurrency = (amount: number): string => {
  const formattedNumber = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formattedNumber} руб.`;
};
