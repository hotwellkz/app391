import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSwipeable } from 'react-swipeable';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { PasswordPrompt } from '../components/PasswordPrompt';
import { ExpenseWaybill } from '../components/warehouse/ExpenseWaybill';
import { Transaction } from '../components/transactions/types';
import { TransactionHeader } from '../components/transactions/TransactionHeader';
import { TransactionStats } from '../components/transactions/TransactionStats';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { TransferModal } from '../components/transactions/transfer/TransferModal';
import { format, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Calendar, Filter, ArrowLeft, BarChart2, FileText, Download } from 'lucide-react';
import clsx from 'clsx';
import { deleteTransaction } from '../lib/firebase'; 
import { auth } from '../lib/firebase';
import { exportTransactionsReport } from '../utils/exportTransactionsReport'; 

interface GroupedTransactions {
  [key: string]: {
    date: Date;
    totalAmount: number;
    transactions: Transaction[];
  };
}

export const TransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [swipedTransactionId, setSwipedTransactionId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showWaybill, setShowWaybill] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'salary' | 'cashless'>('all');
  const [totalAmount, setTotalAmount] = useState(0);
  const [salaryTotal, setSalaryTotal] = useState(0);
  const [cashlessTotal, setCashlessTotal] = useState(0);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  // Состояния для фильтров
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

  useEffect(() => {
    localStorage.setItem('showTransactionStats', JSON.stringify(showStats));
  }, [showStats]);

  // Получаем список уникальных годов из транзакций
  const availableYears = React.useMemo(() => {
    const years = new Set(
      transactions
        .filter(t => t.date instanceof Timestamp)
        .map(t => t.date.toDate().getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  useEffect(() => {
    if (!categoryId) return;

    const q = query(
      collection(db, 'transactions'),
      where('categoryId', '==', categoryId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      if (transactionsData.length > 0) {
        setCategoryTitle(transactionsData[0].fromUser);
      }

      // Фильтруем транзакции по дате, если указан диапазон
      const filteredByDate = transactionsData.filter(transaction => {
        if (!startDate || !endDate) return true;
        
        const transactionDate = transaction.date.toDate();
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Устанавливаем конец дня
        
        return transactionDate >= startDateTime && transactionDate <= endDateTime;
      });

      // Считаем суммы для отфильтрованных транзакций
      const total = filteredByDate.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const salarySum = filteredByDate.reduce((sum, t) => 
        t.isSalary ? sum + Math.abs(t.amount) : sum, 0
      );
      const cashlessSum = filteredByDate.reduce((sum, t) => 
        t.isCashless ? sum + Math.abs(t.amount) : sum, 0
      );

      setTransactions(transactionsData);
      setTotalAmount(total);
      setSalaryTotal(salarySum);
      setCashlessTotal(cashlessSum);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryId, startDate, endDate]);

  useEffect(() => {
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
        if (t.date instanceof Timestamp) {
          const transactionDate = t.date.toDate();
          return transactionDate.getFullYear() === selectedYear;
        }
        return false;
      });
    }

    // Фильтрация по диапазону дат
    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        if (t.date instanceof Timestamp) {
          const transactionDate = t.date.toDate();
          const start = new Date(startDate);
          const end = new Date(endDate);
          return isWithinInterval(transactionDate, { start, end });
        }
        return false;
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, filterSalary, filterCashless, selectedYear, startDate, endDate]);

  // Обработчики свайпов
  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      const card = (eventData.event.target as HTMLElement).closest('[data-transaction-id]');
      if (card) {
        const transactionId = card.getAttribute('data-transaction-id');
        setSwipedTransactionId(transactionId);
        setSwipeDirection('left');
      }
    },
    onSwipedRight: (eventData) => {
      // Свайп вправо только сбрасывает состояние (отменяет удаление)
      setSwipedTransactionId(null);
      setSwipeDirection(null);
    },
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
  });

  const handleDelete = async (isAuthenticated: boolean) => {
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
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowPasswordPrompt(true);
  };

  const handleWaybillClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowWaybill(true);
  };

  // Группировка транзакций по дате
  const groupTransactionsByDate = (transactions: Transaction[]): GroupedTransactions => {
    return transactions.reduce((groups: GroupedTransactions, transaction) => {
      // Проверяем, что date существует и является Timestamp
      if (!transaction.date || !(transaction.date instanceof Timestamp)) {
        return groups;
      }

      const date = transaction.date.toDate();
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date,
          totalAmount: 0,
          transactions: []
        };
      }

      groups[dateKey].totalAmount += transaction.amount;
      groups[dateKey].transactions.push(transaction);

      return groups;
    }, {});
  };

  const formatDayHeader = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Сегодня';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Вчера';
    } else {
      return format(date, 'EEE, d MMMM yyyy', { locale: ru });
    }
  };

  const formatAmount = (amount: number) => {
    return Math.round(amount).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  };

  // Обработчик экспорта в Excel
  const handleExportToExcel = async () => {
    try {
      if (filteredTransactions.length === 0) {
        showErrorNotification('Нет данных для экспорта');
        return;
      }

      // Показываем уведомление о начале экспорта
      showSuccessNotification('Начинаем экспорт...');

      if (!categoryId) {
        throw new Error('ID категории не найден');
      }

      await exportTransactionsReport({
        categoryId,
        categoryTitle,
        projectTransactions: filteredTransactions,
        totals: {
          totalAmount,
          salaryTotal,
          cashlessTotal
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Поисковая строка */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-2">
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
        <div className="max-w-7xl mx-auto px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">История операций</h1>
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
        <TransactionStats
          totalAmount={totalAmount}
          salaryTotal={salaryTotal}
          cashlessTotal={cashlessTotal}
        />
      )}

      {/* Дополнительные фильтры */}
      <div className="space-y-2 mt-2">
        {/* Фильтры */}
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

            {/* Фильтр по годам */}
            <div className="bg-white rounded-lg shadow">
              <button
                onClick={() => setShowYearFilter(!showYearFilter)}
                className="w-full px-4 py-2 flex items-center justify-between text-gray-700 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{selectedYear ? `${selectedYear} год` : 'Выберите год'}</span>
                </div>
                {showYearFilter ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              {showYearFilter && (
                <div className="px-4 py-2 border-t">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedYear(null)}
                      className={clsx(
                        "px-3 py-1 rounded text-sm",
                        selectedYear === null
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      Все
                    </button>
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={clsx(
                          "px-3 py-1 rounded text-sm",
                          selectedYear === year
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Фильтр по диапазону дат */}
            <div className="bg-white rounded-lg shadow">
              <button
                onClick={() => setShowDateRangeFilter(!showDateRangeFilter)}
                className="w-full px-4 py-2 flex items-center justify-between text-gray-700 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {startDate && endDate 
                      ? `${format(new Date(startDate), 'dd.MM.yyyy')} - ${format(new Date(endDate), 'dd.MM.yyyy')}`
                      : 'Выберите период'
                    }
                  </span>
                </div>
                {showDateRangeFilter ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              {showDateRangeFilter && (
                <div className="px-4 py-2 border-t space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">От</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">До</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Сбросить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {categoryTitle}
          </div>
        </div>

      </div>

      <div className="px-4 py-2">
        {/* Список транзакций */}
        <div className="max-w-7xl mx-auto px-4 py-4" {...handlers}>
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Транзакции не найдены</p>
              </div>
            ) : (
              Object.entries(groupTransactionsByDate(filteredTransactions))
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                .map(([dateKey, group]) => (
                  <div key={dateKey} className="space-y-2">
                    {/* Заголовок дня */}
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-600">
                          {formatDayHeader(group.date)}
                        </h3>
                        <span className={clsx(
                          "text-sm font-medium",
                          group.totalAmount < 0 ? "text-red-600" : "text-emerald-600"
                        )}>
                          {group.totalAmount < 0 ? '- ' : '+ '}
                          {formatAmount(Math.abs(group.totalAmount))}
                        </span>
                      </div>
                    </div>

                    {/* Транзакции дня */}
                    <div className="space-y-2">
                      {group.transactions.map((transaction) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          onDelete={() => handleDeleteClick(transaction)}
                          onWaybill={() => handleWaybillClick(transaction)}
                          isExpanded={swipedTransactionId === transaction.id}
                          swipeDirection={swipeDirection}
                          renderAttachments={() => 
                            transaction.waybillData?.files?.length > 0 && (
                              <div className="flex items-center gap-1">
                                {transaction.waybillData.files.map((file, index) => (
                                  <a
                                    key={index}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group"
                                  >
                                    {file.type.startsWith('image/') ? (
                                      <>
                                        <div className="w-8 h-8 rounded overflow-hidden border border-gray-200">
                                          <img
                                            src={file.url}
                                            alt={file.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        {/* Увеличенное превью при наведении */}
                                        <div className="hidden group-hover:block fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                                          <div className="bg-white rounded-lg shadow-2xl p-2">
                                            <img
                                              src={file.url}
                                              alt={file.name}
                                              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded"
                                            />
                                          </div>
                                          <div className="fixed inset-0 -z-10 bg-black/50 backdrop-blur-sm"></div>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                                        <FileText className="w-5 h-5 text-gray-500" />
                                      </div>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

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
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedTransaction(null);
            setSwipedTransactionId(null);
            setSwipeDirection(null);
          }}
          sourceCategory={{
            id: selectedTransaction.categoryId,
            title: selectedTransaction.fromUser,
            balance: 0
          }}
          targetCategory={{
            id: selectedTransaction.categoryId,
            title: selectedTransaction.toUser,
            balance: 0
          }}
          initialAmount={Math.abs(selectedTransaction.amount)}
          initialDescription={selectedTransaction.description}
          initialIsSalary={selectedTransaction.isSalary}
          initialIsCashless={selectedTransaction.isCashless}
          editMode={true}
          transactionId={selectedTransaction.id}
          initialFiles={selectedTransaction.attachments || []}
        />
      )}
    </div>
  );
};