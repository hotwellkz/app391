import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface FeedTransaction {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  description: string;
  date: {
    seconds: number;
    nanoseconds: number;
  } | Timestamp | Date;
  type: 'income' | 'expense';
  categoryId: string;
  waybillId?: string;
  waybillType?: 'income' | 'expense';
  waybillNumber?: string;
  waybillData?: {
    documentNumber?: string;
    date?: any;
    supplier?: string;
    project?: string;
    note?: string;
    items?: Array<{
      product: {
        name: string;
        unit: string;
      };
      quantity: number;
      price: number;
    }>;
  };
}

interface ExportFeedParams {
  transactions: FeedTransaction[];
  fromDate?: Date | null;
  toDate?: Date | null;
  allPeriod: boolean;
  currentFilters?: {
    searchQuery?: string;
    minAmount?: string;
    maxAmount?: string;
  };
}

/**
 * Экспортирует ленту операций в Excel файл
 * @param params - Параметры экспорта
 */
export const exportFeedToExcel = async (params: ExportFeedParams): Promise<void> => {
  try {
    const { transactions, fromDate, toDate, allPeriod, currentFilters } = params;

    // Проверяем, есть ли данные для экспорта
    if (!transactions || transactions.length === 0) {
      throw new Error('Нет данных для экспорта');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Лента операций');

    let currentRow = 1;

    // ===== БЛОК 1: ЗАГОЛОВОК =====
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const titleHeaderRow = worksheet.getRow(currentRow);
    titleHeaderRow.getCell(1).value = 'ЛЕНТА ОПЕРАЦИЙ';
    titleHeaderRow.getCell(1).font = { bold: true, size: 16 };
    titleHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    titleHeaderRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    titleHeaderRow.height = 30;
    titleHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;

    // ===== БЛОК 2: ПЕРИОД =====
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const periodRow = worksheet.getRow(currentRow);
    let periodText = '';
    if (allPeriod) {
      periodText = 'Период: все операции';
    } else if (fromDate && toDate) {
      const fromStr = format(fromDate, 'dd.MM.yyyy', { locale: ru });
      const toStr = format(toDate, 'dd.MM.yyyy', { locale: ru });
      periodText = `Период: ${fromStr} – ${toStr}`;
    } else if (fromDate) {
      const fromStr = format(fromDate, 'dd.MM.yyyy', { locale: ru });
      periodText = `Период: с ${fromStr}`;
    } else {
      periodText = 'Период: не указан';
    }
    periodRow.getCell(1).value = periodText;
    periodRow.getCell(1).font = { bold: true, size: 12 };
    periodRow.height = 20;
    periodRow.alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow++;

    // Пустая строка
    currentRow++;

    // ===== БЛОК 3: СВОДКА =====
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const totalsHeaderRow = worksheet.getRow(currentRow);
    totalsHeaderRow.getCell(1).value = 'СВОДКА ПО ОПЕРАЦИЯМ';
    totalsHeaderRow.getCell(1).font = { bold: true, size: 14 };
    totalsHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '70AD47' }
    };
    totalsHeaderRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    totalsHeaderRow.height = 25;
    totalsHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;

    // Рассчитываем агрегаты
    const totalAmount = transactions.reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : 0;
      return sum + Math.abs(amount);
    }, 0);
    const incomeAmount = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const amount = typeof t.amount === 'number' ? t.amount : 0;
        return sum + Math.abs(amount);
      }, 0);
    const expenseAmount = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const amount = typeof t.amount === 'number' ? t.amount : 0;
        return sum + Math.abs(amount);
      }, 0);
    const transactionCount = transactions.length;

    const totalsData = [
      { label: 'Общая сумма операций:', value: totalAmount },
      { label: 'Количество операций:', value: transactionCount },
      { label: 'Сумма приходов:', value: incomeAmount },
      { label: 'Сумма расходов:', value: expenseAmount },
    ];

    totalsData.forEach(({ label, value }) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true };
      if (typeof value === 'number') {
        row.getCell(2).value = Math.round(value);
        row.getCell(2).numFmt = '#,##0';
      } else {
        row.getCell(2).value = value;
      }
      row.getCell(2).alignment = { horizontal: 'right' };
      currentRow++;
    });

    // Пустая строка
    currentRow++;

    // ===== БЛОК 4: ПРИМЕНЕННЫЕ ФИЛЬТРЫ (если есть) =====
    if (currentFilters && (currentFilters.searchQuery || currentFilters.minAmount || currentFilters.maxAmount)) {
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const filtersHeaderRow = worksheet.getRow(currentRow);
      filtersHeaderRow.getCell(1).value = 'ПРИМЕНЕННЫЕ ФИЛЬТРЫ';
      filtersHeaderRow.getCell(1).font = { bold: true, size: 12 };
      filtersHeaderRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC000' }
      };
      filtersHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: '000000' } };
      filtersHeaderRow.height = 20;
      filtersHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      currentRow++;

      const filtersData: Array<{ label: string; value: string }> = [];

      if (currentFilters.searchQuery) {
        filtersData.push({ label: 'Поиск:', value: currentFilters.searchQuery });
      }
      if (currentFilters.minAmount) {
        filtersData.push({ label: 'Сумма от:', value: currentFilters.minAmount });
      }
      if (currentFilters.maxAmount) {
        filtersData.push({ label: 'Сумма до:', value: currentFilters.maxAmount });
      }

      filtersData.forEach(({ label, value }) => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = label;
        row.getCell(1).font = { bold: true };
        row.getCell(2).value = value;
        currentRow++;
      });

      // Пустая строка
      currentRow++;
    }

    // ===== БЛОК 5: ТАБЛИЦА ОПЕРАЦИЙ =====
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const tableHeaderRow = worksheet.getRow(currentRow);
    tableHeaderRow.getCell(1).value = 'ИСТОРИЯ ОПЕРАЦИЙ';
    tableHeaderRow.getCell(1).font = { bold: true, size: 14 };
    tableHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '7030A0' }
    };
    tableHeaderRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    tableHeaderRow.height = 25;
    tableHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;

    // Заголовки таблицы
    const headers = [
      'Дата операции',
      'Тип',
      'Сумма',
      'Клиент',
      'Проект / Объект',
      'От',
      'Описание',
      'Примечания'
    ];

    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9E1F2' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    headerRow.height = 30;
    currentRow++;

    // Запоминаем первую строку с данными
    const firstDataRow = currentRow;

    // Данные транзакций
    transactions.forEach((transaction) => {
      try {
        const row = worksheet.getRow(currentRow);
        
        // Дата операции
        let dateStr = 'Не указано';
        try {
          if (transaction.date) {
            let dateObj: Date | null = null;
            if (transaction.date instanceof Timestamp) {
              dateObj = transaction.date.toDate();
            } else if (transaction.date instanceof Date) {
              dateObj = transaction.date;
            } else if (transaction.date && typeof transaction.date === 'object' && 'seconds' in transaction.date) {
              const seconds = (transaction.date as any).seconds;
              if (typeof seconds === 'number' && !isNaN(seconds)) {
                dateObj = new Date(seconds * 1000);
              }
            }
            if (dateObj && !isNaN(dateObj.getTime())) {
              dateStr = format(dateObj, 'dd.MM.yyyy HH:mm', { locale: ru });
            }
          }
        } catch (error) {
          console.error('Error formatting date:', error);
          dateStr = 'Не указано';
        }
        row.getCell(1).value = dateStr;
        row.getCell(1).alignment = { horizontal: 'left' };

        // Тип операции
        const typeLabel = transaction.type === 'income' ? 'Приход' : 'Расход';
        row.getCell(2).value = typeLabel;
        row.getCell(2).alignment = { horizontal: 'left' };

        // Сумма
        const amount = typeof transaction.amount === 'number' ? transaction.amount : 0;
        row.getCell(3).value = Math.round(amount);
        row.getCell(3).numFmt = '#,##0';
        row.getCell(3).alignment = { horizontal: 'right' };
        // Цвет суммы в зависимости от знака
        if (amount < 0) {
          row.getCell(3).font = { color: { argb: 'FF0000' } };
        } else {
          row.getCell(3).font = { color: { argb: '00B050' } };
        }

        // Клиент (из toUser или waybillData.project)
        const clientName = (transaction.waybillData?.project || transaction.toUser || 'Не указано').toString();
        row.getCell(4).value = clientName;
        row.getCell(4).alignment = { horizontal: 'left' };

        // Проект / Объект
        const projectName = (transaction.waybillData?.project || transaction.toUser || 'Не указано').toString();
        row.getCell(5).value = projectName;
        row.getCell(5).alignment = { horizontal: 'left' };

        // От
        const fromUser = (transaction.fromUser || 'Не указано').toString();
        row.getCell(6).value = fromUser;
        row.getCell(6).alignment = { horizontal: 'left' };

        // Описание
        const description = (transaction.description || 'Не указано').toString();
        row.getCell(7).value = description;
        row.getCell(7).alignment = { horizontal: 'left', wrapText: true };

        // Примечания (номер накладной и т.п.)
        const notes: string[] = [];
        try {
          if (transaction.waybillNumber) {
            notes.push(`Накладная №${transaction.waybillNumber}`);
          }
          if (transaction.waybillData?.note) {
            notes.push(String(transaction.waybillData.note));
          }
        } catch (error) {
          console.error('Error processing notes:', error);
        }
        row.getCell(8).value = notes.length > 0 ? notes.join('; ') : 'Нет';
        row.getCell(8).alignment = { horizontal: 'left', wrapText: true };

        // Добавляем границы для всех ячеек строки
        for (let i = 1; i <= headers.length; i++) {
          row.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }

        currentRow++;
      } catch (error) {
        console.error('Error processing transaction:', error, transaction);
        // Пропускаем проблемную транзакцию и продолжаем
        currentRow++;
      }
    });

    // Запоминаем последнюю строку с данными
    const lastDataRow = currentRow - 1;

    // Добавляем строку "Итого:" с формулой суммы
    if (transactions.length > 0) {
      const totalRow = worksheet.getRow(currentRow);
      
      // Колонка A: "Итого:"
      totalRow.getCell(1).value = 'Итого:';
      totalRow.getCell(1).font = { bold: true };
      totalRow.getCell(1).alignment = { horizontal: 'right' };
      totalRow.getCell(1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Колонка C (Сумма): формула SUM
      const sumFormula = `SUM(C${firstDataRow}:C${lastDataRow})`;
      totalRow.getCell(3).value = { formula: sumFormula };
      totalRow.getCell(3).numFmt = '#,##0';
      totalRow.getCell(3).font = { bold: true };
      totalRow.getCell(3).alignment = { horizontal: 'right' };
      totalRow.getCell(3).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Добавляем границы для остальных ячеек строки
      for (let i = 2; i <= headers.length; i++) {
        if (i !== 3) {
          totalRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
      }
    }

    }

    // Устанавливаем ширину колонок
    worksheet.columns = [
      { width: 18 }, // Дата операции
      { width: 10 }, // Тип
      { width: 12 }, // Сумма
      { width: 20 }, // Клиент
      { width: 25 }, // Проект / Объект
      { width: 20 }, // От
      { width: 40 }, // Описание
      { width: 30 }, // Примечания
    ];

    // Формируем имя файла
    let fileName = 'feed_';
    if (allPeriod) {
      fileName += 'all';
    } else if (fromDate && toDate) {
      const fromStr = format(fromDate, 'yyyy-MM-dd', { locale: ru });
      const toStr = format(toDate, 'yyyy-MM-dd', { locale: ru });
      fileName += `${fromStr}_to_${toStr}`;
    } else if (fromDate) {
      const fromStr = format(fromDate, 'yyyy-MM-dd', { locale: ru });
      fileName += `from_${fromStr}`;
    } else {
      fileName += 'export';
    }
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ru });
    fileName += `_${timestamp}.xlsx`;

    // Сохраняем файл
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Error in exportFeedToExcel:', error);
    throw error;
  }
};

