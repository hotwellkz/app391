import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction } from '../components/transactions/types';
import { Client } from '../types/client';
import { exportProjectHistoryToExcel } from './exportClientHistoryToExcel';

export interface ExportReportFilters {
  searchQuery?: string;
  filterSalary?: boolean;
  filterCashless?: boolean;
  selectedYear?: number | null;
  startDate?: string;
  endDate?: string;
}

export interface ExportReportTotals {
  totalAmount: number;
  salaryTotal: number;
  cashlessTotal: number;
}

export interface ExportTransactionsReportOptions {
  categoryId: string;
  categoryTitle?: string;
  projectTransactions?: Transaction[];
  totals?: ExportReportTotals;
  filters?: ExportReportFilters;
  client?: Client | null;
}

const categoriesCollection = collection(db, 'categories');

const fetchCategoryTransactions = async (categoryId: string): Promise<Transaction[]> => {
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('categoryId', '==', categoryId),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(transactionsQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Transaction[];
};

const calculateTotals = (transactions: Transaction[]): ExportReportTotals => {
  const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const salaryTotal = transactions.reduce(
    (sum, t) => (t.isSalary ? sum + Math.abs(t.amount) : sum),
    0
  );
  const cashlessTotal = transactions.reduce(
    (sum, t) => (t.isCashless ? sum + Math.abs(t.amount) : sum),
    0
  );

  return { totalAmount, salaryTotal, cashlessTotal };
};

const buildSearchTargets = (client: Client | null, fallbackTitle?: string) => {
  const targets = new Set<string>();

  if (client?.objectName) {
    targets.add(client.objectName);
  }

  const fullName = `${client?.lastName || ''} ${client?.firstName || ''}`.trim();
  if (fullName) {
    targets.add(fullName);
  }

  if (fallbackTitle) {
    targets.add(fallbackTitle);
  }

  return Array.from(targets).filter(Boolean);
};

const findCategoryIdByRow = async (
  titles: string[],
  row: number
): Promise<string | null> => {
  for (const title of titles) {
    const titleQuery = query(
      categoriesCollection,
      where('title', '==', title),
      where('row', '==', row)
    );

    const snapshot = await getDocs(titleQuery);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
  }

  return null;
};

const findProjectCategoryId = async (
  client: Client | null,
  fallbackTitle?: string
): Promise<string | null> => {
  const targets = buildSearchTargets(client, fallbackTitle);
  return findCategoryIdByRow(targets, 3);
};

const findClientCategoryId = async (
  client: Client | null,
  fallbackTitle?: string
): Promise<string | null> => {
  const targets = buildSearchTargets(client, fallbackTitle);
  return findCategoryIdByRow(targets, 1);
};

const fetchClientByCategoryData = async (categoryData: { title?: string; objectName?: string }): Promise<Client | null> => {
  const clientsRef = collection(db, 'clients');

  if (categoryData.objectName) {
    const clientByObjectQuery = query(
      clientsRef,
      where('objectName', '==', categoryData.objectName)
    );
    const snapshot = await getDocs(clientByObjectQuery);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Client;
    }
  }

  if (categoryData.title) {
    const title = categoryData.title.trim();

    const byObjectNameQuery = query(
      clientsRef,
      where('objectName', '==', title)
    );
    const byObjectSnapshot = await getDocs(byObjectNameQuery);
    if (!byObjectSnapshot.empty) {
      const docSnap = byObjectSnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Client;
    }

    const parts = title.split(' ');
    if (parts.length >= 1) {
      const lastName = parts[0];
      const firstName = parts[1] || '';

      const byLastNameQuery = query(
        clientsRef,
        where('lastName', '==', lastName)
      );
      const lastNameSnapshot = await getDocs(byLastNameQuery);
      if (!lastNameSnapshot.empty) {
        const client = lastNameSnapshot
          .docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Client))
          .find(c =>
            firstName
              ? (c.firstName || '').toLowerCase() === firstName.toLowerCase()
              : true
          );
        if (client) {
          return client;
        }
      }
    }
  }

  return null;
};

export const exportTransactionsReport = async ({
  categoryId,
  categoryTitle,
  projectTransactions,
  totals,
  filters,
  client
}: ExportTransactionsReportOptions): Promise<void> => {
  const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
  if (!categoryDoc.exists()) {
    throw new Error('Категория не найдена');
  }

  const categoryData = categoryDoc.data() as { title?: string; row?: number };
  const resolvedClient = client ?? await fetchClientByCategoryData(categoryData);

  const projectCategoryId =
    categoryData.row === 3
      ? categoryId
      : await findProjectCategoryId(resolvedClient, categoryData.title);

  const clientCategoryId =
    categoryData.row === 1
      ? categoryId
      : await findClientCategoryId(resolvedClient, categoryData.title);

  if (!projectCategoryId) {
    throw new Error('Не удалось определить проект для формирования отчёта');
  }

  if (!clientCategoryId) {
    throw new Error('Не удалось определить клиента для формирования отчёта');
  }

  const resolvedProjectTransactions =
    projectTransactions && projectTransactions.length > 0
      ? projectTransactions
      : await fetchCategoryTransactions(projectCategoryId);

  if (resolvedProjectTransactions.length === 0) {
    throw new Error('Нет данных для экспорта истории проекта');
  }

  const resolvedTotals = totals ?? calculateTotals(resolvedProjectTransactions);
  const resolvedTitle = categoryTitle || categoryData.title || 'Отчёт';

  await exportProjectHistoryToExcel({
    categoryId: projectCategoryId,
    projectName: resolvedTitle,
    projectTransactions: resolvedProjectTransactions,
    projectTotals: resolvedTotals,
    filters,
    clientOverride: resolvedClient,
    clientCategoryIdOverride: clientCategoryId
  });
};


