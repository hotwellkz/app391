import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, deleteDoc, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/warehouse';
import { format, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSwipeable } from 'react-swipeable';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { useIsAdmin } from '../../hooks/useIsAdmin';

interface Movement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  price: number;
  totalPrice: number;
  date: any;
  description: string;
  previousQuantity: number;
  newQuantity: number;
  previousAveragePrice: number;
  newAveragePrice: number;
  supplier?: string;
}

interface ProductHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductHistory: React.FC<ProductHistoryProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [swipedMovementId, setSwipedMovementId] = useState<string | null>(null);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (swipedMovementId) {
        const target = e.target as HTMLElement;
        const swipedElement = document.querySelector(`[data-movement-id="${swipedMovementId}"]`);
        if (swipedElement && !swipedElement.contains(target)) {
          setSwipedMovementId(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [swipedMovementId]);

  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      const element = eventData.event.target as HTMLElement;
      const movementElement = element.closest('[data-movement-id]');
      if (movementElement) {
        const movementId = movementElement.getAttribute('data-movement-id');
        if (movementId) {
          setSwipedMovementId(movementId === swipedMovementId ? null : movementId);
        }
      }
    },
    onSwipedRight: (eventData) => {
      const element = eventData.event.target as HTMLElement;
      const movementElement = element.closest('[data-movement-id]');
      if (movementElement) {
        const movementId = movementElement.getAttribute('data-movement-id');
        if (movementId) {
          setSwipedMovementId(null);
        }
      }
    },
    trackMouse: true,
    delta: 10
  });

  useEffect(() => {
    const q = query(
      collection(db, 'productMovements'),
      where('productId', '==', product.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const movementsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date
        })) as Movement[];
        
        // Calculate running totals
        // ВАЖНО: Средняя цена рассчитывается только по приходным операциям
        // При расходах средняя цена не меняется, только уменьшается количество
        let runningQuantity = 0;
        let totalPurchaseValue = 0; // Суммарная стоимость всех приходов
        
        movementsData.forEach(movement => {
          if (movement.type === 'in') {
            // При приходе: увеличиваем количество и добавляем стоимость прихода
            runningQuantity += movement.quantity;
            totalPurchaseValue += movement.quantity * movement.price;
          } else {
            // При расходе: только уменьшаем количество
            // Стоимость приходов не меняется, средняя цена остается прежней
            runningQuantity -= movement.quantity;
            // НЕ вычитаем из totalPurchaseValue, так как средняя цена не меняется
          }
        });
        
        setTotalQuantity(runningQuantity);
        // Общая стоимость = остаток * средняя цена (рассчитанная только по приходам)
        setTotalValue(totalPurchaseValue);
        
        // Сортируем локально, так как составной индекс может быть недоступен
        movementsData.sort((a, b) => {
          const dateA = a.date?.seconds || 0;
          const dateB = b.date?.seconds || 0;
          return dateB - dateA;
        });
        
        setMovements(movementsData);
      } catch (error) {
        console.error('Error processing movements:', error);
        setMovements([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error in movements subscription:', error);
      setMovements([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [product.id]);

  if (!isOpen) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    if (!isValid(date)) return '';
    try {
      return format(date, 'd MMMM yyyy, HH:mm', { locale: ru });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const formatAmount = (amount: number) => {
    if (typeof amount !== 'number') return '0 ₸';
    return Math.round(amount).toLocaleString('ru-RU') + ' ₸';
  };

  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('ru-RU');
  };

  const handleDelete = async (isAuthenticated: boolean) => {
    if (!isAuthenticated || !selectedMovement) {
      setSelectedMovement(null);
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Получаем текущие данные товара
      const productRef = doc(db, 'products', product.id);
      const productDoc = await getDoc(productRef);
      if (!productDoc.exists()) {
        throw new Error('Товар не найден');
      }
      
      const currentData = productDoc.data();
      const manualPriceEnabled = currentData.manualPriceEnabled === true;
      
      // Обновляем количество товара
      const newQuantity = selectedMovement.type === 'in' 
        ? selectedMovement.previousQuantity // Возвращаем предыдущее количество при удалении прихода
        : selectedMovement.previousQuantity; // Возвращаем предыдущее количество при удалении расхода

      let updateData: any = {
        quantity: newQuantity,
        updatedAt: serverTimestamp()
      };

      if (selectedMovement.type === 'in' && !manualPriceEnabled) {
        // При удалении прихода нужно пересчитать среднюю цену
        // Вычитаем стоимость удаляемого прихода из общей стоимости
        const currentTotalPurchasePrice = currentData.totalPurchasePrice || 0;
        const removedPurchaseValue = selectedMovement.quantity * selectedMovement.price;
        const newTotalPurchasePrice = currentTotalPurchasePrice - removedPurchaseValue;
        const newAveragePrice = newQuantity > 0 ? newTotalPurchasePrice / newQuantity : 0;

        updateData.totalPurchasePrice = newTotalPurchasePrice;
        updateData.averagePurchasePrice = newAveragePrice;
      } else if (selectedMovement.type === 'out') {
        // При удалении расхода средняя цена НЕ меняется
        // Обновляем только общую стоимость для отображения
        const currentAveragePrice = currentData.averagePurchasePrice || 0;
        const effectivePrice = manualPriceEnabled 
          ? (currentData.manualAveragePrice || currentAveragePrice)
          : currentAveragePrice;
        
        updateData.averagePurchasePrice = currentAveragePrice;
        updateData.totalPurchasePrice = newQuantity * effectivePrice;
        
        if (manualPriceEnabled && currentData.manualAveragePrice !== undefined) {
          updateData.manualAveragePrice = currentData.manualAveragePrice;
        }
      } else {
        // Ручной режим - просто обновляем общую стоимость
        const effectivePrice = currentData.manualAveragePrice || currentData.averagePurchasePrice || 0;
        updateData.totalPurchasePrice = newQuantity * effectivePrice;
        if (currentData.manualAveragePrice !== undefined) {
          updateData.manualAveragePrice = currentData.manualAveragePrice;
        }
      }

      batch.update(productRef, updateData);

      // Удаляем запись о движении
      const movementRef = doc(db, 'productMovements', selectedMovement.id);
      batch.delete(movementRef);

      await batch.commit();
      showSuccessNotification('Операция успешно удалена');
    } catch (error) {
      console.error('Error deleting movement:', error);
      showErrorNotification('Ошибка при удалении операции');
    } finally {
      setSelectedMovement(null);
      setSwipedMovementId(null);
    }
  };

  const handleDeleteClick = (movement: Movement) => {
    setSelectedMovement(movement);
  };

  const handleDeleteHistory = async () => {
    if (!isAdmin) {
      showErrorNotification('Только администраторы могут удалять историю');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить всю историю этого продукта? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeletingHistory(true);

    try {
      const q = query(
        collection(db, 'productMovements'),
        where('productId', '==', product.id)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      showSuccessNotification('История продукта успешно удалена');
      setMovements([]);
    } catch (error) {
      console.error('Error deleting product history:', error);
      showErrorNotification('Ошибка при удалении истории');
    } finally {
      setIsDeletingHistory(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 ml-2">
              <p className="text-xs sm:text-sm text-gray-500">История операций</p>
            </div>
            <div className="hidden sm:block ml-auto text-right">
              <p className="text-xs sm:text-sm text-gray-600">Текущий остаток: {totalQuantity}</p>
              <p className="text-xs sm:text-sm text-emerald-600">
                Средняя цена: {totalQuantity > 0 ? Math.round(totalValue / totalQuantity) : 0} ₸
              </p>
              <p className="text-xs text-gray-500">
                (рассчитана только по приходам)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleDeleteHistory}
                disabled={isDeletingHistory}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Удалить всю историю"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose}>
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 85px)' }}>
          <div className="mb-6">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500">Текущий остаток</p>
                <p className="text-base sm:text-lg font-medium text-gray-900">{product.quantity}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500">Средняя цена</p>
                <p className="text-base sm:text-lg font-medium text-gray-900">
                  {(() => {
                    const effectivePrice = product.manualPriceEnabled && product.manualAveragePrice !== null
                      ? product.manualAveragePrice
                      : product.averagePurchasePrice;
                    return formatAmount(effectivePrice || 0);
                  })()}
                </p>
                {product.manualPriceEnabled && (
                  <p className="text-xs text-gray-400 mt-1">(ручная)</p>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500">Общая стоимость</p>
                <p className="text-base sm:text-lg font-medium text-gray-900">
                  {(() => {
                    const effectivePrice = product.manualPriceEnabled && product.manualAveragePrice !== null
                      ? product.manualAveragePrice
                      : product.averagePurchasePrice;
                    return formatAmount((product.quantity || 0) * (effectivePrice || 0));
                  })()}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              История операций пуста
            </div>
          ) : (
            <div className="space-y-4" {...handlers}>
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  data-movement-id={movement.id}
                  className="relative overflow-hidden"
                >
                  <div
                    className={`absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center transition-opacity duration-200 ${
                      swipedMovementId === movement.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <button
                      onClick={() => handleDeleteClick(movement)}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div
                    className={`bg-white border rounded-lg p-4 hover:shadow-sm transition-all transform ${
                      swipedMovementId === movement.id ? '-translate-x-16' : 'translate-x-0'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-2 lg:gap-4">
                      <div className="w-full lg:w-auto">
                        <p className="text-sm sm:text-base font-medium text-gray-900">
                          {movement.type === 'in' ? 'Приход' : 'Расход'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {movement.description}
                        </p>
                        {movement.supplier && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Поставщик: {movement.supplier}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(movement.date)}
                        </p>
                      </div>
                      <div className="w-full lg:w-auto text-right flex-shrink-0 bg-gray-50 p-3 rounded-lg">
                        <p className={`text-sm sm:text-base font-medium ${
                          movement.type === 'in' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {movement.type === 'in' ? '+' : '-'} {movement.quantity}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatAmount(movement.price)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Итого: {formatAmount(movement.totalPrice)}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">Остаток:</p>
                          <p className="text-xs sm:text-sm font-medium">
                            {movement.previousQuantity} → {movement.newQuantity}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Средняя цена:</p>
                          <p className="text-xs sm:text-sm font-medium">
                            {formatAmount(movement.previousAveragePrice)} → {formatAmount(movement.newAveragePrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};