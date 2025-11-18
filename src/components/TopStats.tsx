import React, { useState } from 'react';
import { collection, getDocs, writeBatch, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { ScrollText, Warehouse, ArrowLeftRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { ContextMenu } from './ContextMenu'; 
import { showErrorNotification } from '../utils/notifications';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { EditStatsModal } from './modals/EditStatsModal';

interface TopStatsProps {
  stats: Array<{ label: string; value: string; }>;
  onNavigate: (page: string) => void;
}

const formatValue = (value: string): string => {
  const cleanValue = value.replace(/[\s\.,₸]/g, '');
  const numValue = parseFloat(cleanValue);
  
  if (isNaN(numValue)) return '0 ₸';
  
  let formattedValue;
  if (numValue >= 1000000) {
    formattedValue = (Math.floor(numValue / 100000) / 10).toFixed(1) + 'M';
  } else if (numValue >= 1000) {
    formattedValue = Math.floor(numValue / 1000) + 'k';
  } else {
    formattedValue = numValue.toString();
  }
  
  return formattedValue + ' ₸';
};

export const TopStats: React.FC<TopStatsProps> = ({ stats, onNavigate }) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { isAdmin } = useIsAdmin();

  const handleContextMenu = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedStat(label);
    setShowContextMenu(true);
  };

  const handleEdit = () => {
    if (!isAdmin) {
      showErrorNotification('У вас нет прав для редактирования');
      return;
    }
    setShowContextMenu(false);
    setShowEditModal(true);
  };

  const handleResetBalance = async () => {
    if (!isAdmin) {
      showErrorNotification('У вас нет прав для сброса баланса');
      return;
    }
    
    if (window.confirm('Вы уверены, что хотите очистить историю транзакций?')) {
      await resetBalances();
    }
  };

  const resetBalances = async () => {
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      categoriesSnapshot.docs.forEach((docRef) => {
        batch.update(doc(db, 'categories', docRef.id), {
          amount: '0 ₸'
        });
      });

      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      const deletePromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      const statsRef = doc(db, 'stats', 'dashboard');
      await setDoc(statsRef, {
        totalIncome: 0,
        updatedAt: new Date()
      }, { merge: true });

      await batch.commit();
      setShowContextMenu(false);
      
      showErrorNotification('История транзакций успешно очищена');
    } catch (error) {
      console.error('Error resetting data:', error);
      showErrorNotification('Ошибка при обнулении данных');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <div className="flex justify-center items-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div></div>;
  }

  const getCurrentStats = () => {
    const balance = stats.find(stat => stat.label === 'Баланс')?.value || '0 ₸';
    const expenses = stats.find(stat => stat.label === 'Расходы')?.value || '0 ₸';
    return { balance, expenses };
  };

  return (
    <>
      <div className="flex items-center justify-between py-2 px-4 relative lg:px-8 min-h-[64px] gap-4">
        <div className="lg:hidden w-10 flex-shrink-0" /> {/* Spacer for burger menu */}
        <div className="flex items-center justify-center space-x-4 sm:space-x-8 flex-1 lg:justify-start lg:flex-none">
          {stats.slice(0, 2).map((stat, index) => (
            <div 
              key={index} 
              className="cursor-default"
              onContextMenu={(e) => handleContextMenu(e, stat.label)} 
            >
              <div className="text-[11px] sm:text-sm text-gray-500 font-normal text-center">{stat.label}</div>
              <div className="text-xs sm:text-base font-medium text-gray-900 whitespace-nowrap text-center">
                {formatValue(stat.value)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <button
            onClick={() => onNavigate('feed')}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            title="Лента"
          >
            <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onNavigate('warehouse')}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            title="Склад"
          >
            <Warehouse className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onNavigate('transactions')}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            title="Транзакции"
          >
            <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {showContextMenu && (
        <ContextMenu
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onEdit={handleEdit}
          onDelete={handleResetBalance}
          onViewHistory={() => {
            setShowContextMenu(false);
            onNavigate('transactions');
          }}
          title={selectedStat || ''}
          editLabel="Редактировать"
        />
      )}

      <EditStatsModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentStats={getCurrentStats()}
        onUpdate={() => {
          // Обновление будет происходить через родительский компонент
          // так как статистика обновляется через useStats хук
        }}
      />
    </>
  );
};