import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  FloorEstimateData, 
  FoundationEstimateData, 
  PartitionEstimateData, 
  RoofEstimateData, 
  SipWallsEstimateData,
  ConsumablesEstimateData,
  EstimateItem 
} from '../types/estimate';

interface AllEstimates {
  floor?: FloorEstimateData;
  foundation?: FoundationEstimateData;
  sipWalls?: SipWallsEstimateData;
  roof?: RoofEstimateData;
  partition?: PartitionEstimateData;
  consumables?: ConsumablesEstimateData;
}

// Функция для применения шрифта Oswald ко всем ячейкам листа
const applyOswaldFont = (worksheet: ExcelJS.Worksheet) => {
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.font = {
        ...cell.font,
        name: 'Oswald',
        family: 4
      };
    });
  });
};

// Функция для создания вкладки "Для закупа"
const createPurchaseList = (estimates: AllEstimates, workbook: ExcelJS.Workbook) => {
  const worksheet = workbook.addWorksheet('Для закупа');
  
  // Устанавливаем заголовки
  worksheet.columns = [
    { header: '№', key: 'number', width: 5 },
    { header: 'Наименование', key: 'name', width: 40 },
    { header: 'Ед. изм.', key: 'unit', width: 7 },
    { header: 'Кол-во', key: 'quantity', width: 7 },
    { header: 'Цена', key: 'price', width: 10 },
    { header: 'Сумма', key: 'total', width: 12 }
  ];

  // Собираем все позиции в один массив с сохранением информации о категории
  const allItems: (EstimateItem & { category: string; order: number })[] = [];
  
  // Функция для добавления позиций из сметы
  const addItems = (items?: EstimateItem[], category: string, order: number) => {
    if (items) {
      // Фильтруем позиции с нулевым количеством
      const nonZeroItems = items.filter(item => item.quantity > 0);
      allItems.push(...nonZeroItems.map(item => ({ ...item, category, order })));
    }
  };

  // Добавляем позиции из всех смет с указанием категории и порядка
  if (estimates.foundation) {
    addItems(estimates.foundation.items, 'Фундамент', 1);
  }
  if (estimates.sipWalls) {
    addItems(estimates.sipWalls.items, 'СИП-панели', 2);
  }
  if (estimates.roof) {
    addItems(estimates.roof.items, 'Кровля', 3);
  }
  if (estimates.partition) {
    addItems(estimates.partition.items, 'Перегородки', 4);
  }
  if (estimates.floor) {
    addItems(estimates.floor.items, 'Пол', 5);
  }
  if (estimates.consumables) {
    addItems(estimates.consumables.items, 'Расходники', 6);
  }

  // Объединяем одинаковые позиции с сохранением категории
  const mergedItems = allItems.reduce((acc: (EstimateItem & { category: string; order: number })[], item) => {
    // Дополнительная проверка на количество > 0
    if (item.quantity <= 0) {
      return acc;
    }

    const existingItem = acc.find(i => 
      i.name.toLowerCase().trim() === item.name.toLowerCase().trim() && 
      i.unit.toLowerCase().trim() === item.unit.toLowerCase().trim()
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
      existingItem.quantity = Math.ceil(existingItem.quantity);
      existingItem.total = Math.ceil(existingItem.quantity * existingItem.price);
    } else {
      acc.push({ 
        ...item, 
        quantity: Math.ceil(item.quantity),
        total: Math.ceil(item.quantity * item.price)
      });
    }

    return acc;
  }, []);

  // Дополнительная фильтрация после объединения
  const filteredItems = mergedItems.filter(item => item.quantity > 0);

  // Сортируем сначала по порядку категорий, затем по наименованию внутри категории
  filteredItems.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.name.localeCompare(b.name);
  });

  // Добавляем данные
  filteredItems.forEach((item, index) => {
    const row = worksheet.addRow({
      number: index + 1,
      name: item.name,
      unit: item.unit,
      quantity: Math.ceil(item.quantity),
      price: Math.ceil(item.price),
      total: Math.ceil(item.total)
    });

    // Центрируем значение в колонке "Ед. изм."
    const unitCell = row.getCell('unit');
    unitCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Центрируем заголовок "Ед. изм."
  const headerRow = worksheet.getRow(1);
  const unitHeaderCell = headerRow.getCell('unit');
  unitHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Добавляем итоговую строку
  const totalRow = worksheet.addRow({
    name: 'ИТОГО:',
    total: Math.ceil(filteredItems.reduce((sum, item) => sum + item.total, 0)) // Округляем общую сумму
  });
  totalRow.font = { bold: true };

  // Стилизация
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      if (cell.value && typeof cell.value === 'number') {
        cell.numFmt = '#,##0'; // Изменяем формат на целые числа без десятичных
      }
    });
  });

  // Применяем шрифт Oswald
  applyOswaldFont(worksheet);
};

export const exportToExcel = async (estimates: AllEstimates, objectName: string) => {
  const workbook = new ExcelJS.Workbook();

  // Создаем основную смету как раньше
  const totalSheet = workbook.addWorksheet('Общая смета');
  
  // Устанавливаем ширину колонок
  totalSheet.columns = [
    { width: 60 }, // Наименование
    { width: 10 }, // Ед.изм
    { width: 10 }  // Кол-во
  ];

  // Добавляем заголовок
  totalSheet.mergeCells('A1:C1');
  const titleRow = totalSheet.getRow(1);
  titleRow.getCell(1).value = 'Общая смета';
  titleRow.font = { bold: true, size: 14, name: 'Oswald' };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 30;

  // Добавляем заголовки колонок
  const headerRow = totalSheet.addRow(['Наименование', 'Ед.изм', 'Кол-во']);
  headerRow.font = { bold: true, size: 11, name: 'Oswald' };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' }, name: 'Oswald' };
  });

  // Добавляем пустую строку после заголовков
  totalSheet.addRow([]);

  // Добавляем данные из всех смет
  const sections = [
    { name: 'Фундамент', data: estimates.foundation?.items },
    { name: 'Стены', data: estimates.sipWalls?.items },
    { name: 'Перекрытие', data: estimates.floor?.items },
    { name: 'Крыша', data: estimates.roof?.items },
    { name: 'Перегородки', data: estimates.partition?.items },
    { name: 'Расходники', data: estimates.consumables?.items }
  ];

  sections.forEach((section, index) => {
    if (section.data && section.data.length > 0) {
      // Добавляем пустую строку перед разделом (кроме первого)
      if (index > 0) {
        totalSheet.addRow([]);
      }

      // Добавляем название раздела
      const sectionRow = totalSheet.addRow([section.name]);
      totalSheet.mergeCells(`A${sectionRow.number}:C${sectionRow.number}`);
      
      // Стилизуем название раздела
      sectionRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '808080' }
      };
      sectionRow.font = { bold: true, size: 12, color: { argb: 'FFFFFF' }, name: 'Oswald' };
      sectionRow.height = 25;

      // Добавляем пустую строку после названия
      totalSheet.addRow([]);

      // Добавляем данные раздела
      const nonZeroItems = section.data.filter(item => item.quantity > 0);
      
      // Если после фильтрации есть позиции, добавляем их
      if (nonZeroItems.length > 0) {
        nonZeroItems.forEach(item => {
          const row = totalSheet.addRow([item.name, item.unit, item.quantity]);
          
          // Стилизуем ячейки
          row.font = { name: 'Oswald', size: 11 };
          row.alignment = { vertical: 'middle' };
          
          // Центрируем единицу измерения
          row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
          
          // Форматируем количество
          row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
          row.getCell(3).numFmt = '#,##0.00';
        });
      } else {
        // Если все позиции в разделе нулевые, удаляем последние две строки (название раздела и пустую строку)
        totalSheet.spliceRows(totalSheet.rowCount - 1, 2);
      }
    }
  });

  // Добавляем границы для всех заполненных ячеек
  totalSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Применяем шрифт Oswald к основной смете
  applyOswaldFont(totalSheet);

  // Добавляем новую вкладку для закупа
  createPurchaseList(estimates, workbook);

  // Формируем имя файла из названия объекта
  const fileName = objectName ? 
    `Смета - ${objectName}.xlsx` : 
    'Смета.xlsx';

  // Сохраняем файл
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  saveAs(blob, fileName);
};
