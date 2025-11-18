const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const tens = ['', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
const thousands = ['', 'тысяча', 'тысячи', 'тысяч'];
const millions = ['', 'миллион', 'миллиона', 'миллионов'];

function getPluralForm(number: number, forms: string[]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return forms[
    (number % 100 > 4 && number % 100 < 20) ? 2 : cases[Math.min(number % 10, 5)]
  ];
}

function convertGroup(number: number, isThousands: boolean = false): string {
  if (number === 0) return '';

  const parts: string[] = [];
  const hundredsDigit = Math.floor(number / 100);
  const tensDigit = Math.floor((number % 100) / 10);
  const unitsDigit = number % 10;

  if (hundredsDigit > 0) {
    parts.push(hundreds[hundredsDigit]);
  }

  if (tensDigit === 1) {
    parts.push(units[unitsDigit] + 'надцать');
  } else {
    if (tensDigit > 0) {
      parts.push(tens[tensDigit]);
    }
    if (unitsDigit > 0) {
      parts.push(units[unitsDigit]);
    }
  }

  if (isThousands && unitsDigit === 1 && tensDigit !== 1) {
    parts[parts.length - 1] = 'одна';
  }

  return parts.join(' ');
}

export function numberToWords(number: number): string {
  if (number === 0) return 'ноль';

  const parts: string[] = [];
  const millionsPart = Math.floor(number / 1000000);
  const thousandsPart = Math.floor((number % 1000000) / 1000);
  const unitsPart = number % 1000;

  if (millionsPart > 0) {
    const millionsText = convertGroup(millionsPart);
    parts.push(millionsText + ' ' + getPluralForm(millionsPart, millions));
  }

  if (thousandsPart > 0) {
    const thousandsText = convertGroup(thousandsPart, true);
    parts.push(thousandsText + ' ' + getPluralForm(thousandsPart, thousands));
  }

  if (unitsPart > 0) {
    parts.push(convertGroup(unitsPart));
  }

  return parts.join(' ') + ' тенге';
}