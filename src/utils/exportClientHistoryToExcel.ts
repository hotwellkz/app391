import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Transaction } from '../components/transactions/types';
import { Client } from '../types/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

interface ExportClientHistoryParams {
  client: Client | null;
  clientName?: string; // Название клиента/категории, если нет объекта Client
  transactions: Transaction[];
  totals?: {
    totalAmount?: number;
    salaryTotal?: number;
    cashlessTotal?: number;
    balance?: number;
  };
  filters?: {
    searchQuery?: string;
    filterSalary?: boolean;
    filterCashless?: boolean;
    selectedYear?: number | null;
    startDate?: string;
    endDate?: string;
  };
}

interface BuildHistorySheetParams {
  workbook: ExcelJS.Workbook;
  sheetName: string;
  client: Client | null;
  clientName?: string;
  projectName?: string; // Название проекта (для листа проекта)
  transactions: Transaction[];
  totals?: {
    totalAmount?: number;
    salaryTotal?: number;
    cashlessTotal?: number;
    balance?: number;
  };
  filters?: {
    searchQuery?: string;
    filterSalary?: boolean;
    filterCashless?: boolean;
    selectedYear?: number | null;
    startDate?: string;
    endDate?: string;
  };
}

/**
 * Общая функция для построения листа Excel с историей операций
 * @param params - Параметры для построения листа
 */
const buildHistorySheet = (params: BuildHistorySheetParams): ExcelJS.Worksheet => {
  const { workbook, sheetName, client, clientName, projectName, transactions, totals, filters } = params;

  const worksheet = workbook.addWorksheet(sheetName);
  let currentRow = 1;

  // ===== БЛОК 1: ИНФОРМАЦИЯ О КЛИЕНТЕ =====
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const clientHeaderRow = worksheet.getRow(currentRow);
  clientHeaderRow.getCell(1).value = 'ИНФОРМАЦИЯ О КЛИЕНТЕ';
  clientHeaderRow.getCell(1).font = { bold: true, size: 14 };
  clientHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' }
  };
  clientHeaderRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  clientHeaderRow.height = 25;
  clientHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  // Данные клиента
  if (client) {
    const clientData = [
      { label: 'Клиент:', value: client.name || `${client.firstName || ''} ${client.lastName || ''} ${client.middleName || ''}`.trim() || 'Не указано' },
      { label: 'ФИО:', value: `${client.firstName || ''} ${client.lastName || ''} ${client.middleName || ''}`.trim() || 'Не указано' },
      { label: 'Объект:', value: client.objectName || 'Не указано' },
      { label: 'Телефон:', value: client.phone || 'Не указано' },
      { label: 'Email:', value: client.email || 'Не указано' },
      { label: 'ИИН:', value: client.iin || 'Не указано' },
      { label: 'Адрес строительства:', value: client.constructionAddress || client.address || 'Не указано' },
      { label: 'Адрес проживания:', value: client.livingAddress || 'Не указано' },
    ];

    clientData.forEach(({ label, value }) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true };
      row.getCell(2).value = value;
      row.getCell(2).alignment = { horizontal: 'left' };
      currentRow++;
    });
  } else if (clientName) {
    // Если нет объекта Client, используем только название
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = 'Клиент:';
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = clientName;
    currentRow++;
  }

  // Добавляем информацию о проекте, если это лист проекта
  if (projectName) {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = 'Проект:';
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = projectName;
    currentRow++;
  }

  // Пустая строка
  currentRow++;

  // ===== БЛОК 2: АГРЕГАТЫ (если есть) =====
  if (totals && (totals.totalAmount !== undefined || totals.salaryTotal !== undefined || totals.cashlessTotal !== undefined)) {
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

    const totalsData: Array<{ label: string; value: number | undefined }> = [];
    
    if (totals.totalAmount !== undefined) {
      totalsData.push({ label: 'Общая сумма операций:', value: totals.totalAmount });
    }
    if (totals.salaryTotal !== undefined) {
      totalsData.push({ label: 'Сумма по зарплате:', value: totals.salaryTotal });
    }
    if (totals.cashlessTotal !== undefined) {
      totalsData.push({ label: 'Сумма по безналу:', value: totals.cashlessTotal });
    }
    if (totals.balance !== undefined) {
      totalsData.push({ label: 'Баланс:', value: totals.balance });
    }

    totalsData.forEach(({ label, value }) => {
      if (value !== undefined) {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = label;
        row.getCell(1).font = { bold: true };
        row.getCell(2).value = Math.round(value);
        row.getCell(2).numFmt = '#,##0';
        row.getCell(2).alignment = { horizontal: 'right' };
        currentRow++;
      }
    });

    // Пустая строка
    currentRow++;
  }

  // ===== БЛОК 3: ИНФОРМАЦИЯ О ФИЛЬТРАХ (если применены) =====
  if (filters && (
    filters.searchQuery || 
    filters.filterSalary || 
    filters.filterCashless || 
    filters.selectedYear || 
    filters.startDate || 
    filters.endDate
  )) {
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

    if (filters.searchQuery) {
      filtersData.push({ label: 'Поиск:', value: filters.searchQuery });
    }
    if (filters.filterSalary) {
      filtersData.push({ label: 'Тип:', value: 'Зарплата' });
    }
    if (filters.filterCashless) {
      filtersData.push({ label: 'Тип:', value: filters.filterSalary ? 'Зарплата, Безнал' : 'Безнал' });
    }
    if (filters.selectedYear) {
      filtersData.push({ label: 'Год:', value: filters.selectedYear.toString() });
    }
    if (filters.startDate && filters.endDate) {
      const startDate = format(new Date(filters.startDate), 'dd.MM.yyyy', { locale: ru });
      const endDate = format(new Date(filters.endDate), 'dd.MM.yyyy', { locale: ru });
      filtersData.push({ label: 'Период:', value: `${startDate} - ${endDate}` });
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

  // ===== БЛОК 4: ТАБЛИЦА ОПЕРАЦИЙ =====
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
    'Сумма',
    'Тип операции',
    'От',
    'К',
    'Описание',
    'Проект/Объект',
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

  // Запоминаем первую строку с данными (сразу после заголовков)
  const firstDataRow = currentRow;

  // Данные транзакций
  transactions.forEach((transaction) => {
    const row = worksheet.getRow(currentRow);
    
    // Дата операции
    let dateStr = 'Не указано';
    if (transaction.date) {
      if (transaction.date instanceof Timestamp) {
        dateStr = format(transaction.date.toDate(), 'dd.MM.yyyy HH:mm', { locale: ru });
      } else if (transaction.date instanceof Date) {
        dateStr = format(transaction.date, 'dd.MM.yyyy HH:mm', { locale: ru });
      }
    }
    row.getCell(1).value = dateStr;
    row.getCell(1).alignment = { horizontal: 'left' };

    // Сумма
    row.getCell(2).value = Math.round(transaction.amount);
    row.getCell(2).numFmt = '#,##0';
    row.getCell(2).alignment = { horizontal: 'right' };
    // Цвет суммы в зависимости от знака
    if (transaction.amount < 0) {
      row.getCell(2).font = { color: { argb: 'FF0000' } };
    } else {
      row.getCell(2).font = { color: { argb: '00B050' } };
    }

    // Тип операции
    const typeLabels: string[] = [];
    if (transaction.isSalary) typeLabels.push('Зарплата');
    if (transaction.isCashless) typeLabels.push('Безнал');
    if (transaction.type === 'income') typeLabels.push('Приход');
    if (transaction.type === 'expense') typeLabels.push('Расход');
    row.getCell(3).value = typeLabels.join(', ') || transaction.type || 'Не указано';
    row.getCell(3).alignment = { horizontal: 'left' };

    // От
    row.getCell(4).value = transaction.fromUser || 'Не указано';
    row.getCell(4).alignment = { horizontal: 'left' };

    // К
    row.getCell(5).value = transaction.toUser || 'Не указано';
    row.getCell(5).alignment = { horizontal: 'left' };

    // Описание
    row.getCell(6).value = transaction.description || 'Не указано';
    row.getCell(6).alignment = { horizontal: 'left', wrapText: true };

    // Проект/Объект (из waybillData или toUser)
    const projectNameValue = transaction.waybillData?.project || transaction.toUser || 'Не указано';
    row.getCell(7).value = projectNameValue;
    row.getCell(7).alignment = { horizontal: 'left' };

    // Примечания (номер накладной и т.п.)
    const notes: string[] = [];
    if (transaction.waybillNumber) {
      notes.push(`Накладная №${transaction.waybillNumber}`);
    }
    if (transaction.waybillData?.note) {
      notes.push(transaction.waybillData.note);
    }
    row.getCell(8).value = notes.join('; ') || 'Нет';
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
  });

  // Запоминаем последнюю строку с данными (последняя строка транзакции)
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

    // Колонка B: формула SUM
    const sumFormula = `SUM(B${firstDataRow}:B${lastDataRow})`;
    totalRow.getCell(2).value = { formula: sumFormula };
    totalRow.getCell(2).numFmt = '#,##0';
    totalRow.getCell(2).font = { bold: true };
    totalRow.getCell(2).alignment = { horizontal: 'right' };
    totalRow.getCell(2).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Добавляем границы для остальных ячеек строки (для визуальной целостности)
    for (let i = 3; i <= headers.length; i++) {
      totalRow.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }

  // Устанавливаем ширину колонок
  worksheet.columns = [
    { width: 18 }, // Дата операции
    { width: 12 }, // Сумма
    { width: 15 }, // Тип операции
    { width: 20 }, // От
    { width: 20 }, // К
    { width: 40 }, // Описание
    { width: 25 }, // Проект/Объект
    { width: 30 }, // Примечания
  ];

  return worksheet;
};

/**
 * Экспортирует историю операций клиента в Excel файл
 * @param params - Параметры экспорта
 */
export const exportClientHistoryToExcel = async (params: ExportClientHistoryParams): Promise<void> => {
  const { client, clientName, transactions, totals, filters } = params;

  // Проверяем, есть ли данные для экспорта
  if (transactions.length === 0) {
    throw new Error('Нет данных для экспорта');
  }

  const workbook = new ExcelJS.Workbook();
  
  // Используем общую функцию для построения листа
  buildHistorySheet({
    workbook,
    sheetName: 'История операций',
    client,
    clientName,
    transactions,
    totals,
    filters
  });

  // Формируем имя файла
  const clientNameForFile = client?.name || clientName || 'Клиент';
  const sanitizedClientName = clientNameForFile.replace(/[<>:"/\\|?*]/g, '_');
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ru });
  const fileName = `history_${sanitizedClientName}_${timestamp}.xlsx`;

  // Сохраняем файл
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, fileName);
};

interface ExportProjectHistoryParams {
  categoryId: string; // ID категории проекта
  projectName: string; // Название проекта
  projectTransactions: Transaction[]; // Отфильтрованные транзакции проекта
  projectTotals?: {
    totalAmount?: number;
    salaryTotal?: number;
    cashlessTotal?: number;
  };
  filters?: {
    searchQuery?: string;
    filterSalary?: boolean;
    filterCashless?: boolean;
    selectedYear?: number | null;
    startDate?: string;
    endDate?: string;
  };
  clientOverride?: Client | null;
  clientCategoryIdOverride?: string | null;
}

/**
 * Экспортирует историю операций проекта в Excel файл с двумя листами:
 * 1. История проекта (с фильтрами)
 * 2. История клиента (все операции клиента)
 * @param params - Параметры экспорта
 */
export const exportProjectHistoryToExcel = async (params: ExportProjectHistoryParams): Promise<void> => {
  const {
    categoryId,
    projectName,
    projectTransactions,
    projectTotals,
    filters,
    clientOverride = null,
    clientCategoryIdOverride = null
  } = params;

  // Проверяем, есть ли данные для экспорта
  if (projectTransactions.length === 0) {
    throw new Error('Нет данных для экспорта');
  }

  const workbook = new ExcelJS.Workbook();

  // ===== ЛИСТ 1: ИСТОРИЯ ПРОЕКТА =====
  // Получаем информацию о категории проекта
  const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
  if (!categoryDoc.exists()) {
    throw new Error('Категория проекта не найдена');
  }

  const categoryData = categoryDoc.data();
  const projectObjectName = categoryData.title; // Название объекта (objectName клиента)

  // Ищем клиента по objectName
  let client: Client | null = clientOverride;
  if (!client) {
    try {
      const clientsQuery = query(
        collection(db, 'clients'),
        where('objectName', '==', projectObjectName)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      
      if (!clientsSnapshot.empty) {
        const clientDoc = clientsSnapshot.docs[0];
        client = { id: clientDoc.id, ...clientDoc.data() } as Client;
      }
    } catch (error) {
      console.error('Error loading client:', error);
      // Продолжаем без данных клиента
    }
  }

  // Создаем лист истории проекта
  buildHistorySheet({
    workbook,
    sheetName: 'История проекта',
    client,
    clientName: client ? undefined : projectObjectName,
    projectName: projectName,
    transactions: projectTransactions,
    totals: projectTotals,
    filters
  });

  // ===== ЛИСТ 2: ИСТОРИЯ КЛИЕНТА =====
  if (client) {
    // Загружаем все транзакции клиента (по всем проектам)
    // Ищем категорию клиента (row === 1)
    let clientCategoryId: string | null = clientCategoryIdOverride ?? null;
    if (!clientCategoryId) {
      try {
        // Пробуем найти по имени клиента
        const clientNameQuery = query(
          collection(db, 'categories'),
          where('title', '==', `${client.lastName} ${client.firstName}`),
          where('row', '==', 1)
        );
        let categorySnapshot = await getDocs(clientNameQuery);
        
        // Если не нашли по имени, ищем по названию объекта
        if (categorySnapshot.empty && client.objectName) {
          const objectNameQuery = query(
            collection(db, 'categories'),
            where('title', '==', client.objectName),
            where('row', '==', 1)
          );
          categorySnapshot = await getDocs(objectNameQuery);
        }

        if (!categorySnapshot.empty) {
          clientCategoryId = categorySnapshot.docs[0].id;
        }
      } catch (error) {
        console.error('Error finding client category:', error);
      }
    }

    if (clientCategoryId) {
      // Загружаем все транзакции клиента
      const clientTransactionsQuery = query(
        collection(db, 'transactions'),
        where('categoryId', '==', clientCategoryId),
        orderBy('date', 'desc')
      );
      const clientTransactionsSnapshot = await getDocs(clientTransactionsQuery);
      const clientTransactions = clientTransactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      // Рассчитываем агрегаты для клиента
      const clientTotal = clientTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const clientSalaryTotal = clientTransactions.reduce((sum, t) => 
        t.isSalary ? sum + Math.abs(t.amount) : sum, 0
      );
      const clientCashlessTotal = clientTransactions.reduce((sum, t) => 
        t.isCashless ? sum + Math.abs(t.amount) : sum, 0
      );

      // Создаем лист истории клиента (без фильтров)
      buildHistorySheet({
        workbook,
        sheetName: 'История клиента',
        client,
        transactions: clientTransactions,
        totals: {
          totalAmount: clientTotal,
          salaryTotal: clientSalaryTotal,
          cashlessTotal: clientCashlessTotal
        }
        // Не передаем filters - выгружаем все операции клиента
      });
    }
  }

  // Формируем имя файла
  const sanitizedProjectName = projectName.replace(/[<>:"/\\|?*]/g, '_');
  const clientNameForFile = client?.name || client?.objectName || '';
  const sanitizedClientName = clientNameForFile.replace(/[<>:"/\\|?*]/g, '_');
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ru });
  const fileName = sanitizedClientName 
    ? `history_project_${sanitizedProjectName}_${sanitizedClientName}_${timestamp}.xlsx`
    : `history_project_${sanitizedProjectName}_${timestamp}.xlsx`;

  // Сохраняем файл
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, fileName);
};

