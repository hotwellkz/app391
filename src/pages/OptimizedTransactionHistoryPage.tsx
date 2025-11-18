import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSwipeable } from 'react-swipeable';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { PasswordPrompt } from '../components/PasswordPrompt';
import { ExpenseWaybill } from '../components/warehouse/ExpenseWaybill';
import { Transaction } from '../components/transactions/types';
import { TransactionHeader } from '../components/transactions/TransactionHeader';
import { TransactionStats } from '../components/transactions/TransactionStats';
import { TransferModal } from '../components/transactions/transfer/TransferModal';
import { ChevronDown, ChevronUp, Calendar, Filter, ArrowLeft, BarChart2, Download } from 'lucide-react';
import clsx from 'clsx';
import { deleteTransaction } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { useTransactionsPaginated } from '../hooks/useTransactionsPaginated';
import OptimizedTransactionList from '../components/transactions/VirtualizedTransactionList';
import { exportTransactionsReport } from '../utils/exportTransactionsReport';

// Мемоизированный компонент фильтров
const TransactionFilters = memo(({
  showAllFilters,
  setShowAllFilters,
  filterSalary,
  setFilterSalary,
  filterCashless,
  setFilterCashless,
  selectedYear,
  setSelectedYear,
  availableYears,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  showYearFilter,
  setShowYearFilter,
  showDateRangeFilter,
  setShowDateRangeFilter
}: any) => (
  <div className="space-y-2 mt-2">
    {showAllFilters && (
      <>
        {/* Чекбоксы ЗП и Безнал */}
        <div className="bg-white rounded-lg shadow mb-2">
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="salaryFilter"
                  checked={filterSalary}
                  onChange={(e) => setFilterSalary(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="salaryFilter" className="text-sm text-gray-600">
                  Зарплата
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cashlessFilter"
                  checked={filterCashless}
                  onChange={(e) => setFilterCashless(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="cashlessFilter" className="text-sm text-gray-600">
                  Безнал
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Остальные фильтры аналогично оригиналу... */}
      </>
    )}
  </div>
));

TransactionFilters.displayName = 'TransactionFilters';

export const OptimizedTransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: categoryId } = useParams();
  
  // Состояния UI
  const [categoryTitle, setCategoryTitle] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [swipedTransactionId, setSwipedTransactionId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showWaybill, setShowWaybill] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Состояния фильтров
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showDateRangeFilter, setShowDateRangeFilter] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterSalary, setFilterSalary] = useState(false);
  const [filterCashless, setFilterCashless] = useState(false);
  const [showStats, setShowStats] = useState(() => {
    const saved = localStorage.getItem('showTransactionStats');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Состояние для отслеживания ошибок загрузки
  const [error, setError] = useState<string | null>(null);

  // Используем оптимизированный хук для данных
  const {
    transactions,
    loading,
    hasMore,
    loadMore,
    totalAmount,
    salaryTotal,
    cashlessTotal
  } = useTransactionsPaginated({
    categoryId: categoryId!,
    pageSize: 50,
    enabled: !!categoryId
  });

  // Мемоизированная фильтрация транзакций
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Фильтрация по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.fromUser.toLowerCase().includes(query) ||
        t.toUser.toLowerCase().includes(query) ||
        Math.abs(t.amount).toString().includes(query)
      );
    }

    // Фильтрация по ЗП и Безналу
    if (filterSalary) {
      filtered = filtered.filter(t => t.isSalary);
    }
    if (filterCashless) {
      filtered = filtered.filter(t => t.isCashless);
    }

    // Фильтрация по году
    if (selectedYear !== null) {
      filtered = filtered.filter(t => {
        if (t.date && t.date.toDate) {
          const transactionDate = t.date.toDate();
          return transactionDate.getFullYear() === selectedYear;
        }
        return false;
      });
    }

    // Фильтрация по диапазону дат
    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        if (t.date && t.date.toDate) {
          const transactionDate = t.date.toDate();
          const start = new Date(startDate);
          const end = new Date(endDate);
          return transactionDate >= start && transactionDate <= end;
        }
        return false;
      });
    }

    return filtered;
  }, [transactions, searchQuery, filterSalary, filterCashless, selectedYear, startDate, endDate]);

  // Мемоизированный список доступных годов
  const availableYears = useMemo(() => {
    const years = new Set(
      transactions
        .filter(t => t.date && t.date.toDate)
        .map(t => t.date.toDate().getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Загрузка названия категории
  useEffect(() => {
    if (!categoryId) return;

    const loadCategoryTitle = async () => {
      try {
        const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
        if (categoryDoc.exists()) {
          setCategoryTitle(categoryDoc.data().title);
          setError(null);
        } else {
          setError('Категория не найдена');
        }
      } catch (error) {
        console.error('Error loading category:', error);
        setError('Ошибка загрузки категории');
      }
    };

    loadCategoryTitle();
  }, [categoryId]);

  // Сохранение настроек статистики
  useEffect(() => {
    localStorage.setItem('showTransactionStats', JSON.stringify(showStats));
  }, [showStats]);

  // Мемоизированные обработчики событий
  const handlers = useSwipeable({
    onSwipedLeft: useCallback((eventData: any) => {
      const card = (eventData.event.target as HTMLElement).closest('[data-transaction-id]');
      if (card) {
        const transactionId = card.getAttribute('data-transaction-id');
        setSwipedTransactionId(transactionId);
        setSwipeDirection('left');
      }
    }, []),
    onSwipedRight: useCallback(() => {
      setSwipedTransactionId(null);
      setSwipeDirection(null);
    }, []),
    trackMouse: true,
  });

  const handleDelete = useCallback(async (isAuthenticated: boolean) => {
    if (!isAuthenticated || !selectedTransaction) {
      setShowPasswordPrompt(false);
      setSelectedTransaction(null);
      setSwipedTransactionId(null);
      setSwipeDirection(null);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Необходимо войти в систему');
      }

      await deleteTransaction(selectedTransaction.id, currentUser.uid);
      showSuccessNotification('Операция успешно удалена');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showErrorNotification(error instanceof Error ? error.message : 'Ошибка при удалении операции');
    } finally {
      setShowPasswordPrompt(false);
      setSelectedTransaction(null);
      setSwipedTransactionId(null);
      setSwipeDirection(null);
    }
  }, [selectedTransaction]);

  const handleDeleteClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowPasswordPrompt(true);
  }, []);

  const handleWaybillClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowWaybill(true);
  }, []);

  // Вычисляем агрегаты для отфильтрованных транзакций
  const filteredTotals = useMemo(() => {
    const total = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const salary = filteredTransactions.reduce((sum, t) => 
      t.isSalary ? sum + Math.abs(t.amount) : sum, 0
    );
    const cashless = filteredTransactions.reduce((sum, t) => 
      t.isCashless ? sum + Math.abs(t.amount) : sum, 0
    );
    return { total, salary, cashless };
  }, [filteredTransactions]);

  // Обработчик экспорта в Excel
  const handleExportToExcel = useCallback(async () => {
    try {
      if (filteredTransactions.length === 0) {
        showErrorNotification('Нет данных для экспорта');
        return;
      }

      showSuccessNotification('Начинаем экспорт...');

      if (!categoryId) {
        throw new Error('ID категории не найден');
      }

      await exportTransactionsReport({
        categoryId,
        categoryTitle,
        projectTransactions: filteredTransactions,
        totals: {
          totalAmount: filteredTotals.total,
          salaryTotal: filteredTotals.salary,
          cashlessTotal: filteredTotals.cashless
        },
        filters: {
          searchQuery,
          filterSalary,
          filterCashless,
          selectedYear,
          startDate,
          endDate
        }
      });

      showSuccessNotification('Отчёт успешно экспортирован');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showErrorNotification(error instanceof Error ? error.message : 'Ошибка при экспорте отчёта');
    }
  }, [filteredTransactions, categoryId, categoryTitle, filteredTotals, searchQuery, filterSalary, filterCashless, selectedYear, startDate, endDate]);

  // Отладка
  useEffect(() => {
    console.log('OptimizedTransactionHistoryPage mounted with categoryId:', categoryId);
  }, [categoryId]);

  // Отображение ошибки
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/transactions')}
            className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
          >
            Вернуться к транзакциям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Поисковая строка */}
      <div className="bg-white">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-[60px] lg:pr-[40px] py-2">
          <div className="relative pl-12 md:pl-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по описанию..."
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Заголовок и кнопки */}
        <div className="max-w-[1200px] mx-auto px-4 lg:px-[60px] lg:pr-[40px] py-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">История операций</h1>
              {categoryTitle && (
                <span className="text-sm text-gray-500">- {categoryTitle}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportToExcel}
                disabled={filteredTransactions.length === 0}
                className={clsx(
                  "px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm",
                  filteredTransactions.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                )}
                title={filteredTransactions.length === 0 ? "Нет данных для экспорта" : "Скачать отчёт в Excel"}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Скачать отчёт</span>
              </button>
              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className={clsx(
                  "p-2 rounded-lg transition-colors duration-200",
                  showAllFilters ? "bg-emerald-50 text-emerald-600" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className={clsx(
                  "p-2 rounded-lg transition-colors duration-200",
                  showStats ? "bg-emerald-50 text-emerald-600" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <BarChart2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      {showStats && (
        <div className="max-w-[1200px] mx-auto px-4 lg:px-[60px] lg:pr-[40px]">
          <TransactionStats
            totalAmount={totalAmount}
            salaryTotal={salaryTotal}
            cashlessTotal={cashlessTotal}
          />
        </div>
      )}

      {/* Фильтры */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-[60px] lg:pr-[40px]">
        <TransactionFilters
          showAllFilters={showAllFilters}
          setShowAllFilters={setShowAllFilters}
          filterSalary={filterSalary}
          setFilterSalary={setFilterSalary}
          filterCashless={filterCashless}
          setFilterCashless={setFilterCashless}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          availableYears={availableYears}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          showYearFilter={showYearFilter}
          setShowYearFilter={setShowYearFilter}
          showDateRangeFilter={showDateRangeFilter}
          setShowDateRangeFilter={setShowDateRangeFilter}
        />
      </div>

      {/* Оптимизированный список транзакций */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-[60px] lg:pr-[40px]">
        <div {...handlers}>
          <OptimizedTransactionList
            transactions={filteredTransactions}
            hasMore={hasMore}
            isLoading={loading}
            onLoadMore={loadMore}
            swipedTransactionId={swipedTransactionId}
            swipeDirection={swipeDirection}
            onDeleteClick={handleDeleteClick}
            onWaybillClick={handleWaybillClick}
          />
        </div>
      </div>

      {/* Модальные окна */}
      {showPasswordPrompt && (
        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={() => {
            setShowPasswordPrompt(false);
            setSelectedTransaction(null);
          }}
          onSuccess={() => handleDelete(true)}
        />
      )}

      {showWaybill && selectedTransaction?.waybillData && (
        <ExpenseWaybill
          isOpen={showWaybill}
          onClose={() => {
            setShowWaybill(false);
            setSelectedTransaction(null);
          }}
          data={selectedTransaction.waybillData}
        />
      )}

      {showTransferModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Редактирование транзакции</h3>
            <p className="text-gray-600 mb-4">Функция редактирования будет доступна в следующей версии</p>
            <button
              onClick={() => {
                setShowTransferModal(false);
                setSelectedTransaction(null);
                setSwipedTransactionId(null);
                setSwipeDirection(null);
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 