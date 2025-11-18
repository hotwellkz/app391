import { ContractTemplate, ContractData } from '../types/contract';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType,
  VerticalAlign,
  UnderlineType,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { numberToWords } from '../utils/numberToWords';
import { getAuth } from 'firebase/auth';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

interface ExcelRow {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  E?: string;
  F?: string;
}

interface EstimateItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

interface Estimates {
  materials: EstimateItem[];
  works: EstimateItem[];
  totalAmount: number;
}

interface Fill {
  type?: string;
  pattern?: string;
  fgColor?: {
    argb: string;
  };
}

interface Row {
  values: (string | number | null)[];
  getCell(col: number): {
    fill?: Fill;
    value?: string | number | null;
  };
}

type CellValue = string | number | boolean | Date | null;
type CellValues = CellValue[] | { [key: string]: CellValue };

interface ITableCell {
  children: Paragraph[];
  verticalAlign?: "center" | "top" | "bottom";
  borders?: {
    top?: { style: typeof BorderStyle.SINGLE; size: number };
    bottom?: { style: typeof BorderStyle.SINGLE; size: number };
    left?: { style: typeof BorderStyle.SINGLE; size: number };
    right?: { style: typeof BorderStyle.SINGLE; size: number };
  };
  width?: {
    size: number;
    type: typeof WidthType.AUTO;
  };
}

async function getClientEstimates(clientId: string) {
  console.log('Starting getClientEstimates for clientId:', clientId);
  
  const estimates = {
    materials: [] as Array<{
      name: string;
      quantity: number;
      unit: string;
      price: number;
    }>,
    works: [] as Array<{
      name: string;
      quantity: number;
      unit: string;
      price: number;
    }>,
    totalAmount: 0
  };

  try {
    // Получаем базовые параметры из коллекции estimates
    console.log('Fetching base estimate data...');
    const baseEstimateDoc = await getDoc(doc(db, 'estimates', clientId));
    if (!baseEstimateDoc.exists()) {
      console.log('Base estimate data not found for clientId:', clientId);
      return estimates;
    }

    const baseData = baseEstimateDoc.data();
    console.log('Base estimate data:', baseData);

    const foundationValues = baseData.foundationValues || {};
    const lumberValues = baseData.lumberValues || {};
    const roofValues = baseData.roofValues || {};

    // Проверяем наличие сохраненных смет
    const collections = [
      'foundationEstimates',
      'sipWallsEstimates',
      'floorEstimates',
      'roofEstimates',
      'partitionEstimates',
      'consumablesEstimates',
      'additionalWorksEstimates'
    ];

    let hasSavedEstimates = false;

    for (const collectionName of collections) {
      const docRef = doc(db, collectionName, clientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        hasSavedEstimates = true;
        break;
      }
    }

    if (!hasSavedEstimates) {
      console.log('No saved estimates found for clientId:', clientId);
      return estimates;
    }

    // Получаем данные сметы фундамента
    console.log('Fetching foundation estimate...');
    const foundationDoc = await getDoc(doc(db, 'foundationEstimates', clientId));
    if (foundationDoc.exists()) {
      const data = foundationDoc.data();
      console.log('Foundation data:', data);
      if (data.items && Array.isArray(data.items)) {
        console.log('Foundation items:', data.items);
        estimates.materials.push(...data.items.map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || '',
          price: Number(item.price) || 0
        })));
      }
      if (data.foundationWorkCost) {
        console.log('Foundation work cost:', data.foundationWorkCost);
        estimates.works.push({
          name: 'Работы по фундаменту',
          quantity: 1,
          unit: 'комплекс',
          price: Number(data.foundationWorkCost) || 0
        });
      }
    } else {
      console.log('Foundation estimate not found for clientId:', clientId);
    }

    // Получаем данные сметы стен
    console.log('Fetching SIP walls estimate...');
    const sipWallsDoc = await getDoc(doc(db, 'sipWallsEstimates', clientId));
    if (sipWallsDoc.exists()) {
      const data = sipWallsDoc.data();
      console.log('SIP walls data:', data);
      if (data.items && Array.isArray(data.items)) {
        console.log('SIP walls items:', data.items);
        estimates.materials.push(...data.items.map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || '',
          price: Number(item.price) || 0
        })));
      }
      if (data.installationCost) {
        console.log('SIP walls installation cost:', data.installationCost);
        estimates.works.push({
          name: 'Монтаж стен из СИП',
          quantity: 1,
          unit: 'комплекс',
          price: Number(data.installationCost) || 0
        });
      }
    } else {
      console.log('SIP walls estimate not found for clientId:', clientId);
    }

    // Получаем данные сметы перекрытия
    console.log('Fetching floor estimate...');
    const floorDoc = await getDoc(doc(db, 'floorEstimates', clientId));
    if (floorDoc.exists()) {
      const data = floorDoc.data();
      console.log('Floor data:', data);
      if (data.items && Array.isArray(data.items)) {
        console.log('Floor items:', data.items);
        estimates.materials.push(...data.items.map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || '',
          price: Number(item.price) || 0
        })));
      }
      if (data.installationCost) {
        console.log('Floor installation cost:', data.installationCost);
        estimates.works.push({
          name: 'Монтаж перекрытия',
          quantity: 1,
          unit: 'комплекс',
          price: Number(data.installationCost) || 0
        });
      }
    } else {
      console.log('Floor estimate not found for clientId:', clientId);
    }

    // Получаем данные сметы кровли
    console.log('Fetching roof estimate...');
    const roofDoc = await getDoc(doc(db, 'roofEstimates', clientId));
    if (roofDoc.exists()) {
      const data = roofDoc.data();
      console.log('Roof data:', data);
      if (data.items && Array.isArray(data.items)) {
        console.log('Roof items:', data.items);
        estimates.materials.push(...data.items.map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || '',
          price: Number(item.price) || 0
        })));
      }
      if (data.roofWorkCost) {
        console.log('Roof work cost:', data.roofWorkCost);
        estimates.works.push({
          name: 'Монтаж кровли',
          quantity: 1,
          unit: 'комплекс',
          price: Number(data.roofWorkCost) || 0
        });
      }
    } else {
      console.log('Roof estimate not found for clientId:', clientId);
    }

    // Получаем данные сметы перегородок
    console.log('Fetching partition estimate...');
    const partitionDoc = await getDoc(doc(db, 'partitionEstimates', clientId));
    if (partitionDoc.exists()) {
      const data = partitionDoc.data();
      console.log('Partition data:', data);
      if (data.items && Array.isArray(data.items)) {
        console.log('Partition items:', data.items);
        estimates.materials.push(...data.items.map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || '',
          price: Number(item.price) || 0
        })));
      }
      if (data.installationCost) {
        console.log('Partition installation cost:', data.installationCost);
        estimates.works.push({
          name: 'Монтаж перегородок',
          quantity: 1,
          unit: 'комплекс',
          price: Number(data.installationCost) || 0
        });
      }
    } else {
      console.log('Partition estimate not found for clientId:', clientId);
    }

    // Получаем данные сметы расходников
    console.log('Fetching consumables estimate...');
    const consumablesDoc = await getDoc(doc(db, 'consumablesEstimates', clientId));
    if (consumablesDoc.exists()) {
      const data = consumablesDoc.data();
      console.log('Consumables data:', data);
      if (data.items && Array.isArray(data.items)) {
        console.log('Consumables items:', data.items);
        estimates.materials.push(...data.items.map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || '',
          price: Number(item.price) || 0
        })));
      }
    } else {
      console.log('Consumables estimate not found for clientId:', clientId);
    }

    // Получаем данные сметы дополнительных работ
    console.log('Fetching additional works estimate...');
    const additionalWorksDoc = await getDoc(doc(db, 'additionalWorksEstimates', clientId));
    if (additionalWorksDoc.exists()) {
      const data = additionalWorksDoc.data();
      console.log('Additional works data:', data);
      if (data.items && Array.isArray(data.items)) {
        console.log('Additional works items:', data.items);
        estimates.materials.push(...data.items.map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || '',
          price: Number(item.price) || 0
        })));
      }
    } else {
      console.log('Additional works estimate not found for clientId:', clientId);
    }

    // Рассчитываем общую сумму
    estimates.totalAmount = estimates.materials.reduce((sum, item) => sum + (item.quantity * item.price), 0) +
                          estimates.works.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    console.log('Final estimates:', estimates);
    return estimates;
  } catch (error) {
    console.error('Error getting client estimates:', error);
    return estimates;
  }
}

// Функция для создания Excel файла в памяти
async function generateExcelInMemory(estimates: Estimates): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const totalSheet = workbook.addWorksheet('Общая смета');
  
  // Устанавливаем ширину колонок
  totalSheet.columns = [
    { width: 60 }, // Наименование
    { width: 10 }, // Ед.изм
    { width: 10 }, // Кол-во
    { width: 15 }, // Цена
    { width: 15 }  // Сумма
  ];

  // Добавляем заголовок
  totalSheet.mergeCells('A1:E1');
  const titleRow = totalSheet.getRow(1);
  titleRow.getCell(1).value = 'Общая смета';
  titleRow.font = { bold: true, size: 14 };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 30;

  // Добавляем заголовки колонок
  const headerRow = totalSheet.addRow(['Наименование', 'Ед.изм', 'Кол-во', 'Цена', 'Сумма']);
  headerRow.font = { bold: true, size: 11 };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  });

  // Добавляем данные из всех смет
  const sections = [
    { name: 'Фундамент', data: estimates.materials.filter(m => 
      m.name.toLowerCase().includes('фундамент') || 
      m.name.toLowerCase().includes('бетон') ||
      m.name.toLowerCase().includes('арматура')
    )},
    { name: 'Стены', data: estimates.materials.filter(m => 
      m.name.toLowerCase().includes('сип') || 
      m.name.toLowerCase().includes('стен')
    )},
    { name: 'Перекрытие', data: estimates.materials.filter(m => 
      m.name.toLowerCase().includes('перекрыт') || 
      m.name.toLowerCase().includes('пол')
    )},
    { name: 'Крыша', data: estimates.materials.filter(m => 
      m.name.toLowerCase().includes('крыш') || 
      m.name.toLowerCase().includes('кровл')
    )},
    { name: 'Перегородки', data: estimates.materials.filter(m => 
      m.name.toLowerCase().includes('перегородк') || 
      m.name.toLowerCase().includes('гипсокартон')
    )},
    { name: 'Расходники', data: estimates.materials.filter(m => 
      !m.name.toLowerCase().includes('фундамент') && 
      !m.name.toLowerCase().includes('бетон') &&
      !m.name.toLowerCase().includes('арматура') &&
      !m.name.toLowerCase().includes('сип') &&
      !m.name.toLowerCase().includes('стен') &&
      !m.name.toLowerCase().includes('перекрыт') &&
      !m.name.toLowerCase().includes('пол') &&
      !m.name.toLowerCase().includes('крыш') &&
      !m.name.toLowerCase().includes('кровл') &&
      !m.name.toLowerCase().includes('перегородк') &&
      !m.name.toLowerCase().includes('гипсокартон')
    )}
  ];

  sections.forEach(section => {
    if (section.data && section.data.length > 0) {
      // Добавляем название раздела
      const sectionRow = totalSheet.addRow([section.name]);
      totalSheet.mergeCells(`A${sectionRow.number}:E${sectionRow.number}`);
      sectionRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '808080' }
      };
      sectionRow.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
      sectionRow.height = 25;

      // Добавляем данные раздела
      section.data.forEach(item => {
        if (item.quantity > 0) {
          const total = Math.ceil(item.quantity * item.price);
          const row = totalSheet.addRow([
            item.name,
            item.unit,
            item.quantity,
            item.price,
            total
          ]);
          
          // Выравнивание
          row.getCell(2).alignment = { horizontal: 'center' };
          row.getCell(3).alignment = { horizontal: 'right' };
          row.getCell(4).alignment = { horizontal: 'right' };
          row.getCell(5).alignment = { horizontal: 'right' };
          
          // Форматирование чисел
          row.getCell(3).numFmt = '#,##0';
          row.getCell(4).numFmt = '#,##0';
          row.getCell(5).numFmt = '#,##0';
        }
      });
    }
  });

  // Добавляем работы
  if (estimates.works && estimates.works.length > 0) {
    const worksRow = totalSheet.addRow(['Работы']);
    totalSheet.mergeCells(`A${worksRow.number}:E${worksRow.number}`);
    worksRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '808080' }
    };
    worksRow.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    worksRow.height = 25;

    estimates.works.forEach(work => {
      if (work.quantity > 0) {
        const total = Math.ceil(work.quantity * work.price);
        const row = totalSheet.addRow([
          work.name,
          work.unit,
          work.quantity,
          work.price,
          total
        ]);
        
        row.getCell(2).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { horizontal: 'right' };
        row.getCell(4).alignment = { horizontal: 'right' };
        row.getCell(5).alignment = { horizontal: 'right' };
        
        row.getCell(3).numFmt = '#,##0';
        row.getCell(4).numFmt = '#,##0';
        row.getCell(5).numFmt = '#,##0';
      }
    });
  }

  // Добавляем итоговую строку
  const totalRow = totalSheet.addRow(['ИТОГО:', '', '', '', estimates.totalAmount]);
  totalRow.font = { bold: true };
  totalRow.getCell(5).numFmt = '#,##0';
  totalRow.getCell(5).alignment = { horizontal: 'right' };

  // Добавляем границы для всех ячеек
  totalSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Возвращаем буфер с данными Excel
  return await workbook.xlsx.writeBuffer();
}

// Функция для преобразования Excel в HTML таблицу
async function excelToHtmlTable(excelBuffer: ArrayBuffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(excelBuffer);
  
  const worksheet = workbook.getWorksheet('Общая смета');
  if (!worksheet) {
    throw new Error('Worksheet "Общая смета" not found');
  }

  let table = '<table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">';
  
  const sectionHeaders = ['Фундамент', 'Стены', 'Перекрытие', 'Крыша', 'Перегородки', 'Расходники', 'Работы'];
  
  worksheet.eachRow((row: ExcelJS.Row, rowNumber) => {
    const rowData = row.values as (string | number | null | undefined)[];
    const isHeader = rowNumber === 1;
    const isSubHeader = rowNumber === 2;
    const isSectionHeader = rowData && rowData[1] && typeof rowData[1] === 'string' && 
                          sectionHeaders.includes(rowData[1]);
    
    if (isHeader && rowData && rowData[1]) {
      table += `
        <tr style="background-color: #4a90e2; color: white; text-align: center;">
          <td colspan="5" style="padding: 8px; font-weight: bold;">${String(rowData[1])}</td>
        </tr>`;
    } else if (isSubHeader) {
      table += `
        <tr style="background-color: #f8f9fa;">
          <th style="width: 50%; padding: 8px;">Наименование</th>
          <th style="width: 10%; padding: 8px;">Ед.изм</th>
          <th style="width: 10%; padding: 8px;">Кол-во</th>
          <th style="width: 15%; padding: 8px;">Цена</th>
          <th style="width: 15%; padding: 8px;">Сумма</th>
        </tr>`;
    } else if (isSectionHeader) {
      table += `
        <tr style="background-color: #808080; color: white;">
          <td colspan="5" style="padding: 8px; font-weight: bold;">${String(rowData[1])}</td>
        </tr>`;
    } else if (rowData) {
      table += '<tr>';
      for (let i = 1; i <= 5; i++) {
        const value = rowData[i];
        const isNumber = typeof value === 'number';
        const alignment = i === 1 ? 'left' : i === 2 ? 'center' : 'right';
        const formattedValue = isNumber ? value.toLocaleString('ru-RU') : (value || '');
        
        table += `<td style="padding: 8px; text-align: ${alignment};">${formattedValue}</td>`;
      }
      table += '</tr>';
    }
  });
  
  table += '</table>';
  return table;
}

function generateEstimateTable(estimates: Estimates): string {
  console.log('Generating estimate table with data:', estimates);
  
  let table = `
    <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
      <tr style="background-color: #4472C4; color: white; text-align: center;">
        <td colspan="5" style="padding: 8px; font-weight: bold; font-size: 14px;">Общая смета</td>
      </tr>
      <tr style="background-color: #4472C4; color: white;">
        <th style="width: 50%; padding: 8px; text-align: left;">Наименование</th>
        <th style="width: 10%; padding: 8px; text-align: center;">Ед.изм</th>
        <th style="width: 10%; padding: 8px; text-align: right;">Кол-во</th>
        <th style="width: 15%; padding: 8px; text-align: right;">Цена</th>
        <th style="width: 15%; padding: 8px; text-align: right;">Сумма</th>
      </tr>`;

  // Группируем материалы по категориям
  const categories = {
    'Фундамент': estimates.materials.filter(item => item.name.toLowerCase().includes('фундамент')),
    'Стены': estimates.materials.filter(item => item.name.toLowerCase().includes('сип панели')),
    'Перекрытие': estimates.materials.filter(item => item.name.toLowerCase().includes('перекрытие')),
    'Крыша': estimates.materials.filter(item => item.name.toLowerCase().includes('крыша')),
    'Перегородки': estimates.materials.filter(item => item.name.toLowerCase().includes('перегородки')),
    'Расходники': estimates.materials.filter(item => item.name.toLowerCase().includes('расходники'))
  };

  // Добавляем материалы по категориям
  Object.entries(categories).forEach(([category, items]) => {
    if (items.length > 0) {
      table += `
        <tr style="background-color: #808080; color: white; font-weight: bold;">
          <td colspan="5" style="padding: 8px;">${category}</td>
        </tr>`;

      items.forEach(item => {
        if (item.quantity > 0) {
          const total = Math.ceil(item.quantity * item.price);
          table += `
            <tr>
              <td style="padding: 8px;">${item.name}</td>
              <td style="padding: 8px; text-align: center;">${item.unit}</td>
              <td style="padding: 8px; text-align: right;">${item.quantity}</td>
              <td style="padding: 8px; text-align: right;">${item.price.toLocaleString()}</td>
              <td style="padding: 8px; text-align: right;">${total.toLocaleString()}</td>
            </tr>`;
        }
      });
    }
  });

  // Добавляем работы
  if (estimates.works.length > 0) {
    table += `
      <tr style="background-color: #808080; color: white; font-weight: bold;">
        <td colspan="5" style="padding: 8px;">Работы</td>
      </tr>`;

    estimates.works.forEach(work => {
      if (work.quantity > 0) {
        const total = Math.ceil(work.quantity * work.price);
        table += `
          <tr>
            <td style="padding: 8px;">${work.name}</td>
            <td style="padding: 8px; text-align: center;">${work.unit}</td>
            <td style="padding: 8px; text-align: right;">${work.quantity}</td>
            <td style="padding: 8px; text-align: right;">${work.price.toLocaleString()}</td>
            <td style="padding: 8px; text-align: right;">${total.toLocaleString()}</td>
          </tr>`;
      }
    });
  }

  // Добавляем итоговую строку
  table += `
      <tr style="background-color: #f8f9fa; font-weight: bold;">
        <td colspan="4" style="padding: 8px; text-align: right;">ИТОГО:</td>
        <td style="padding: 8px; text-align: right;">${estimates.totalAmount.toLocaleString()}</td>
      </tr>
    </table>`;

  console.log('Generated table HTML:', table);
  return table;
}

export const contractTemplateService = {
  // Получение всех шаблонов
  async getTemplates(): Promise<ContractTemplate[]> {
    const templatesRef = collection(db, 'contractTemplates');
    const templatesSnapshot = await getDocs(templatesRef);
    return templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ContractTemplate[];
  },

  // Получение шаблона по ID
  async getTemplateById(id: string): Promise<ContractTemplate | null> {
    const templateRef = doc(db, 'contractTemplates', id);
    const templateDoc = await getDoc(templateRef);
    if (!templateDoc.exists()) return null;
    return {
      id: templateDoc.id,
      ...templateDoc.data()
    } as ContractTemplate;
  },

  // Автоматическое определение плейсхолдеров в шаблоне
  detectPlaceholders: (content: string): string[] => {
    const placeholderRegex = /{([^}]+)}/g;
    const placeholders: string[] = [];
    let match;

    while ((match = placeholderRegex.exec(content)) !== null) {
      placeholders.push(match[1]);
    }

    return [...new Set(placeholders)]; // Удаляем дубликаты
  },

  // Валидация шаблона
  validateTemplate: (content: string): string[] => {
    const errors: string[] = [];
    const requiredPlaceholders = [
      'clientNumber',
      'firstName',
      'lastName',
      'phone',
      'email',
      'iin',
      'constructionAddress',
      'constructionDays',
      'totalAmount',
      'totalAmountWords',
      'deposit',
      'depositWords',
      'firstPayment',
      'secondPayment',
      'thirdPayment',
      'fourthPayment',
      'additionalWorks'
    ];

    requiredPlaceholders.forEach(placeholder => {
      if (!content.includes(`{${placeholder}}`)) {
        errors.push(`Отсутствует обязательный плейсхолдер: {${placeholder}}`);
      }
    });

    return errors;
  },

  // Создание нового шаблона
  async createTemplate(template: Omit<ContractTemplate, 'id'>): Promise<ContractTemplate> {
    const templatesRef = collection(db, 'contractTemplates');
    const docRef = await addDoc(templatesRef, {
      ...template,
      lastModified: new Date().toISOString()
    });
    return {
      id: docRef.id,
      ...template,
      lastModified: new Date().toISOString()
    };
  },

  // Обновление шаблона
  async updateTemplate(id: string, template: Partial<ContractTemplate>): Promise<void> {
    const templateRef = doc(db, 'contractTemplates', id);
    await updateDoc(templateRef, {
      ...template,
      lastModified: new Date().toISOString()
    });
  },

  // Удаление шаблона
  async deleteTemplate(id: string): Promise<void> {
    const templateRef = doc(db, 'contractTemplates', id);
    await deleteDoc(templateRef);
  },

  // Замена плейсхолдеров в тексте
  replacePlaceholders: (text: string, data: ContractData): string => {
    let result = text;

    // Заменяем все плейсхолдеры
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, String(value));
      }
    });

    return result;
  },

  // Генерация таблицы сметы
  generateEstimateTable: (estimateData?: any): string => {
    if (!estimateData) return '';

    let table = '<table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">';
    
    // Заголовок таблицы
    table += `
      <tr style="background-color: #4a90e2; color: white; text-align: center;">
        <td colspan="5" style="padding: 8px; font-weight: bold;">Общая смета</td>
      </tr>
      <tr style="background-color: #f8f9fa;">
        <th style="width: 50%; padding: 8px;">Наименование</th>
        <th style="width: 10%; padding: 8px;">Ед.изм</th>
        <th style="width: 10%; padding: 8px;">Кол-во</th>
        <th style="width: 15%; padding: 8px;">Цена</th>
        <th style="width: 15%; padding: 8px;">Сумма</th>
      </tr>`;

    // Функция для добавления секции
    const addSection = (title: string, items: any[]) => {
      if (items.length === 0) return '';
      
      let section = `
        <tr style="background-color: #808080; color: white;">
          <td colspan="5" style="padding: 8px; font-weight: bold;">${title}</td>
        </tr>`;
      
      items.forEach(item => {
        if (item.quantity > 0) { // Показываем только позиции с количеством > 0
          const total = Math.ceil(item.quantity * item.price);
          section += `
            <tr>
              <td style="padding: 8px;">${item.name || ''}</td>
              <td style="padding: 8px; text-align: center;">${item.unit || ''}</td>
              <td style="padding: 8px; text-align: right;">${item.quantity.toLocaleString('ru-RU')}</td>
              <td style="padding: 8px; text-align: right;">${item.price.toLocaleString('ru-RU')}</td>
              <td style="padding: 8px; text-align: right;">${total.toLocaleString('ru-RU')}</td>
            </tr>`;
        }
      });
      
      return section;
    };

    // Группируем материалы по разделам
    const sections = {
      foundation: estimateData.materials.filter((m: any) => 
        m.name.toLowerCase().includes('фундамент') || 
        m.name.toLowerCase().includes('бетон') ||
        m.name.toLowerCase().includes('арматура')
      ),
      walls: estimateData.materials.filter((m: any) => 
        m.name.toLowerCase().includes('сип') || 
        m.name.toLowerCase().includes('стен')
      ),
      floor: estimateData.materials.filter((m: any) => 
        m.name.toLowerCase().includes('перекрыт') || 
        m.name.toLowerCase().includes('пол')
      ),
      roof: estimateData.materials.filter((m: any) => 
        m.name.toLowerCase().includes('крыш') || 
        m.name.toLowerCase().includes('кровл')
      ),
      partitions: estimateData.materials.filter((m: any) => 
        m.name.toLowerCase().includes('перегородк') || 
        m.name.toLowerCase().includes('гипсокартон')
      ),
      other: estimateData.materials.filter((m: any) => 
        !m.name.toLowerCase().includes('фундамент') && 
        !m.name.toLowerCase().includes('бетон') &&
        !m.name.toLowerCase().includes('арматура') &&
        !m.name.toLowerCase().includes('сип') &&
        !m.name.toLowerCase().includes('стен') &&
        !m.name.toLowerCase().includes('перекрыт') &&
        !m.name.toLowerCase().includes('пол') &&
        !m.name.toLowerCase().includes('крыш') &&
        !m.name.toLowerCase().includes('кровл') &&
        !m.name.toLowerCase().includes('перегородк') &&
        !m.name.toLowerCase().includes('гипсокартон')
      )
    };

    // Добавляем разделы в таблицу
    if (sections.foundation.length > 0) table += addSection('Фундамент', sections.foundation);
    if (sections.walls.length > 0) table += addSection('Стены', sections.walls);
    if (sections.floor.length > 0) table += addSection('Перекрытие', sections.floor);
    if (sections.roof.length > 0) table += addSection('Крыша', sections.roof);
    if (sections.partitions.length > 0) table += addSection('Перегородки', sections.partitions);
    if (sections.other.length > 0) table += addSection('Расходники', sections.other);

    // Добавляем работы
    if (estimateData.works.length > 0) {
      table += addSection('Работы', estimateData.works);
    }

    // Добавляем итоговую строку
    const totalAmount = estimateData.totalAmount || 0;
    table += `
      <tr style="background-color: #f8f9fa; font-weight: bold;">
        <td colspan="4" style="padding: 8px; text-align: right;">ИТОГО:</td>
        <td style="padding: 8px; text-align: right;">${totalAmount.toLocaleString('ru-RU')}</td>
      </tr>`;

    table += '</table>';
    return table;
  },

  // Создание договора
  async createContract(template: ContractTemplate, data: any, additionalWorksText: string) {
    console.log('Creating contract with data:', data);
    
    try {
      // Получаем данные смет клиента
      const estimates = await getClientEstimates(data.clientId);
      console.log('Retrieved estimates:', estimates);

      // Проверяем, что данные сметы не пустые
      if (!estimates || (!estimates.materials.length && !estimates.works.length)) {
        console.error('No estimate data found for client:', data.clientId);
        throw new Error('Не удалось получить данные сметы для клиента. Пожалуйста, убедитесь, что все сметы сохранены.');
      }

      // Получаем содержимое шаблона
      let content = template.content;
      console.log('Template content:', content);

      // Заменяем плейсхолдеры данными клиента
      Object.entries(data).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{${key}}`, 'g'), value as string);
      });

      // Генерируем таблицу сметы
      const estimateTable = generateEstimateTable(estimates);
      console.log('Generated estimate table:', estimateTable);

      // Заменяем плейсхолдер таблицы сметы
      content = content.replace(/{estimateTable}/g, estimateTable);

      // Заменяем плейсхолдер дополнительных работ
      content = content.replace(/{additionalWorks}/g, additionalWorksText || '');

      console.log('Final content:', content);

      // Создаем временный элемент для конвертации HTML в текст с сохранением структуры
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // Функция для создания параграфа с учетом стилей
      const createStyledParagraph = (element: Node, defaultText: string = ''): Paragraph => {
        let text = '';
        let style: CSSStyleDeclaration | null = null;

        if (element.nodeType === Node.TEXT_NODE) {
          text = element.textContent?.trim() || defaultText;
        } else if (element instanceof HTMLElement) {
          text = element.textContent?.trim() || defaultText;
          style = window.getComputedStyle(element);
        }

        return new Paragraph({
          children: [
            new TextRun({
              text,
              ...(style ? {
                bold: style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600,
                italics: style.fontStyle === 'italic',
                underline: style.textDecoration.includes('underline') ? {
                  type: UnderlineType.SINGLE
                } : undefined,
                size: (() => {
                  const fontSize = style.fontSize.replace('px', '');
                  const size = parseInt(fontSize);
                  return isNaN(size) ? 24 : size * 2;
                })(),
                color: style.color !== 'rgb(0, 0, 0)' ? style.color : undefined
              } : {})
            })
          ],
          alignment: style?.textAlign as any || 'left',
          spacing: {
            before: style ? parseInt(style.marginTop) || 0 : 0,
            after: style ? parseInt(style.marginBottom) || 0 : 0
          }
        });
      };

      // Функция для создания таблицы
      const createTable = (element: HTMLTableElement): Table => {
        const rows = Array.from(element.rows).map(row => {
          const cells = Array.from(row.cells).map(cell => {
            const style = window.getComputedStyle(cell);
            const verticalAlignMap: { [key: string]: "center" | "top" | "bottom" } = {
              'middle': 'center',
              'top': 'top',
              'bottom': 'bottom'
            };
            
            const cellOptions: ITableCell = {
              children: [createStyledParagraph(cell)],
              verticalAlign: verticalAlignMap[style.verticalAlign] || 'center',
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 }
              },
              width: {
                size: parseInt(style.width) || 100,
                type: WidthType.AUTO
              }
            };
            
            return new TableCell(cellOptions);
          });
          
          return new TableRow({
            children: cells
          });
        });

        return new Table({
          rows: rows
        });
      };

      // Рекурсивная функция для обработки HTML элементов
      const processElement = (element: Node): (Paragraph | Table)[] => {
        // Проверяем, является ли элемент таблицей
        if (element instanceof HTMLTableElement) {
          try {
            return [createTable(element as HTMLTableElement)];
          } catch (error) {
            console.error('Error creating table:', error);
            // В случае ошибки создания таблицы, возвращаем её содержимое как текст
            return [createStyledParagraph(element)];
          }
        }

        // Обработка текстового узла
        if (element.nodeType === Node.TEXT_NODE && element.textContent?.trim()) {
          return [createStyledParagraph(element)];
        }

        // Обработка HTML элементов
        if (element instanceof HTMLElement) {
          const elements: (Paragraph | Table)[] = [];
          try {
            element.childNodes.forEach((child) => {
              elements.push(...processElement(child));
            });
          } catch (error) {
            console.error('Error processing element:', error);
            // В случае ошибки обработки элемента, возвращаем его содержимое как текст
            if (element.textContent?.trim()) {
              elements.push(createStyledParagraph(element));
            }
          }
          return elements;
        }

        return [];
      };

      // Преобразуем HTML в элементы Word
      const docElements = processElement(tempDiv);

      // Создаем документ Word
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440, // 1 дюйм = 1440 твипов
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          },
          children: docElements
        }],
        styles: {
          paragraphStyles: [
            {
              id: 'Normal',
              name: 'Normal',
              run: {
                size: 24, // 12pt * 2
                font: 'Times New Roman'
              },
              paragraph: {
                spacing: {
                  line: 360, // 1.5 интервал
                  before: 0,
                  after: 0
                }
              }
            }
          ]
        }
      });

      // Сохраняем документ как Blob напрямую
      const blob = await Packer.toBlob(doc);
      console.log('Generated document blob size:', blob.size);

      // Сохраняем файл
      saveAs(blob, `Договор_${data.lastName}_${data.firstName}.docx`);
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  },

  // Парсинг данных из Excel файла сметы
  parseEstimateFile: (file: File): Promise<ContractData['estimateData']> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error('Не удалось прочитать файл');
          }

          // Здесь будет логика парсинга Excel файла
          // Пока возвращаем тестовые данные
          resolve({
            totalAmount: 1000000,
            materials: [
              {
                name: 'Кирпич',
                quantity: 1000,
                unit: 'шт',
                price: 50
              }
            ],
            works: [
              {
                name: 'Кладка кирпича',
                quantity: 100,
                unit: 'м²',
                price: 1000
              }
            ]
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  // Предпросмотр шаблона с тестовыми данными
  previewTemplate: async (template: ContractTemplate): Promise<void> => {
    try {
      const testData: ContractData = {
        clientNumber: 'TEST-001',
        firstName: 'Иван',
        lastName: 'Иванов',
        middleName: 'Иванович',
        iin: '123456789012',
        phone: '+7 (777) 123-45-67',
        email: 'test@example.com',
        constructionAddress: 'г. Алматы, ул. Тестовая, 1',
        livingAddress: 'г. Алматы, ул. Проживания, 2',
        objectName: 'Тестовый объект',
        constructionDays: 30,
        totalAmount: 1000000,
        totalAmountWords: 'один миллион тенге',
        deposit: 75000,
        depositWords: 'семьдесят пять тысяч тенге',
        firstPayment: 300000,
        firstPaymentWords: 'триста тысяч тенге',
        secondPayment: 300000,
        secondPaymentWords: 'триста тысяч тенге',
        thirdPayment: 200000,
        thirdPaymentWords: 'двести тысяч тенге',
        fourthPayment: 200000,
        fourthPaymentWords: 'двести тысяч тенге',
        additionalWorks: 'Дополнительные работы не предусмотрены',
        currentDate: new Date().toLocaleDateString('ru-RU')
      };

      await contractTemplateService.createContract(template, testData, 'Дополнительные работы не предусмотрены');
    } catch (error) {
      console.error('Ошибка при предпросмотре шаблона:', error);
      throw error;
    }
  }
}; 