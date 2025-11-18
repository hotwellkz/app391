import React, { useState, useEffect } from 'react';
import { collection, doc, updateDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

interface FinishingEstimateProps {
  isEditing: boolean;
  clientId: string;
}

interface ElectricalItem {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  isCompleted: boolean;
}

interface FinishingEstimateData {
  [key: string]: {
    items: ElectricalItem[];
    total: number;
  };
}

const initialElectricalItems: ElectricalItem[] = [
  { name: 'Лампы', unit: 'шт', quantity: 0, price: 3500, total: 0, isCompleted: false },
  { name: 'Лампочка наружн', unit: 'шт', quantity: 0, price: 10000, total: 0, isCompleted: false },
  { name: 'Лампы над кроватью', unit: 'шт', quantity: 0, price: 7000, total: 0, isCompleted: false },
  { name: 'Розетки внутр Лизарт', unit: 'шт', quantity: 0, price: 1300, total: 0, isCompleted: false },
  { name: 'Розетки наруж', unit: 'шт', quantity: 0, price: 1000, total: 0, isCompleted: false },
  { name: 'Включатели', unit: 'шт', quantity: 0, price: 1000, total: 0, isCompleted: false },
  { name: 'Подразетники', unit: 'шт', quantity: 0, price: 100, total: 0, isCompleted: false },
  { name: 'Развет коробка под гипсокартон большая (350мм на 350мм)', unit: 'шт', quantity: 0, price: 600, total: 0, isCompleted: false },
  { name: 'Изолента', unit: 'шт', quantity: 0, price: 300, total: 0, isCompleted: false }
];

const initialDoorsItems: ElectricalItem[] = [
  { name: 'Дверь межкомнатная 700мм проем + касяк + обналичка + ручка + петли + монтаж', unit: 'шт', quantity: 0, price: 65000, total: 0, isCompleted: false },
  { name: 'Дверь межкомнатная 900мм проем + касяк + обналичка + ручка + петли + монтаж', unit: 'шт', quantity: 0, price: 65000, total: 0, isCompleted: false },
  { name: 'Дверь входная металлическая 1000мм проем + установка', unit: 'шт', quantity: 0, price: 113000, total: 0, isCompleted: false },
  { name: 'Окно пластиковое размер 625x625 сан узел цвет антрацит одна сторона', unit: 'шт', quantity: 0, price: 0, total: 0, isCompleted: false },
  { name: 'Окно пластиковое размер 1,25x625 цвет антрацит одна сторона', unit: 'шт', quantity: 0, price: 0, total: 0, isCompleted: false },
  { name: 'Окно пластиковое ветражное 1,25x1650 цвет антрацит одна сторона', unit: 'шт', quantity: 0, price: 0, total: 0, isCompleted: false }
];

const initialWallsItems: ElectricalItem[] = [
  { name: 'Краска + колировка для покраски обналички и террасы цвет белый', unit: 'литр', quantity: 0, price: 6600, total: 0, isCompleted: false },
  { name: 'Краска + колировка для покраски дома снаружи цвет голубой (60м2)', unit: 'литр', quantity: 0, price: 0, total: 0, isCompleted: false },
  { name: 'Лаки яхтный для сан узла', unit: 'литр', quantity: 0, price: 0, total: 0, isCompleted: false },
  { name: 'Имитация бруса', unit: 'м2', quantity: 0, price: 0, total: 0, isCompleted: false },
  { name: 'Стеновая внутр', unit: 'м2', quantity: 0, price: 2800, total: 0, isCompleted: false },
  { name: 'Потолочная вагонка (внутрянка)', unit: 'м2', quantity: 0, price: 2800, total: 0, isCompleted: false },
  { name: 'Плинтус 13*35*3000', unit: 'шт', quantity: 0, price: 690, total: 0, isCompleted: false },
  { name: 'Наружный угол', unit: 'метр', quantity: 0, price: 635, total: 0, isCompleted: false },
  { name: 'Пневмогвозди', unit: 'пач', quantity: 0, price: 1000, total: 0, isCompleted: false }
];

const initialFloorItems: ElectricalItem[] = [
  { name: 'Линолеум надо 2,5м на 1,1м', unit: 'м2', quantity: 0, price: 3000, total: 0, isCompleted: false },
  { name: 'Стыковочн планка 1м (Где двери на полу)', unit: 'шт', quantity: 0, price: 2000, total: 0, isCompleted: false },
  { name: 'Стыковочн планка 2,5м (Где двери на полу)', unit: 'шт', quantity: 0, price: 4000, total: 0, isCompleted: false },
  { name: 'Ламинат 23м2 с запасом 25м2', unit: 'м2', quantity: 0, price: 3500, total: 0, isCompleted: false }
];

const initialFacadeItems: ElectricalItem[] = [
  { name: 'Профлист (наружные стены)', unit: 'м2', quantity: 0, price: 0, total: 0, isCompleted: false },
  { name: 'Наружные углы 12м', unit: 'метр', quantity: 0, price: 481, total: 0, isCompleted: false }
];

const initialPlumbingItems: ElectricalItem[] = [
  { name: 'Резинка 50 для душ каб', unit: 'шт', quantity: 0, price: 350, total: 0, isCompleted: false },
  { name: 'Ножка для раковины', unit: 'шт', quantity: 0, price: 4000, total: 0, isCompleted: false },
  { name: 'Умывальник', unit: 'шт', quantity: 0, price: 5600, total: 0, isCompleted: false },
  { name: 'Унитаз', unit: 'шт', quantity: 0, price: 31700, total: 0, isCompleted: false },
  { name: 'Душевой поддон', unit: 'шт', quantity: 0, price: 61250, total: 0, isCompleted: false },
  { name: 'Кран умывальник', unit: 'шт', quantity: 0, price: 13600, total: 0, isCompleted: false },
  { name: 'Планка для смеситель внутрення резьба 20мм пластик', unit: 'шт', quantity: 0, price: 700, total: 0, isCompleted: false },
  { name: 'Муфта комбенированная наружная с резьбой 20мм', unit: 'шт', quantity: 0, price: 300, total: 0, isCompleted: false },
  { name: 'Кран пластиковый на трубу 20', unit: 'шт', quantity: 0, price: 700, total: 0, isCompleted: false },
  { name: 'Гофра для унитаза раздвижная', unit: 'шт', quantity: 0, price: 2000, total: 0, isCompleted: false },
  { name: 'Шланг водяной для унитаза 0,8метра и бойлера', unit: 'шт', quantity: 0, price: 1000, total: 0, isCompleted: false },
  { name: 'Нитка для труб на резьбу', unit: 'шт', quantity: 0, price: 2500, total: 0, isCompleted: false },
  { name: 'Селикон Титан для унитаза приклеивать', unit: 'тюбик', quantity: 0, price: 1800, total: 0, isCompleted: false },
  { name: 'Шланги водяные для умывальн', unit: 'шт', quantity: 0, price: 1000, total: 0, isCompleted: false },
  { name: 'Краны пластиковый 20 для унитаза, раковины, ванны и для кухни', unit: 'шт', quantity: 0, price: 800, total: 0, isCompleted: false },
  { name: 'Сифон Раковина', unit: 'шт', quantity: 0, price: 1500, total: 0, isCompleted: false },
  { name: 'Сифон Душевая', unit: 'шт', quantity: 0, price: 1500, total: 0, isCompleted: false },
  { name: 'Муфта канали раковина', unit: 'шт', quantity: 0, price: 500, total: 0, isCompleted: false },
  { name: 'Муфта канили ванны', unit: 'шт', quantity: 0, price: 500, total: 0, isCompleted: false },
  { name: 'Бойлер', unit: 'шт', quantity: 0, price: 0, total: 0, isCompleted: false }
];

const initialAdditionalItems: ElectricalItem[] = [
  { name: 'Общая стоимось всех работ (Зарплата строителям)', unit: '', quantity: 0, price: 0, total: 0, isCompleted: false }
];

export const FinishingEstimate: React.FC<FinishingEstimateProps> = ({ isEditing, clientId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDoorsAddForm, setShowDoorsAddForm] = useState(false);
  const [showWallsAddForm, setShowWallsAddForm] = useState(false);
  const [showFloorAddForm, setShowFloorAddForm] = useState(false);
  const [showFacadeAddForm, setShowFacadeAddForm] = useState(false);
  const [showPlumbingAddForm, setShowPlumbingAddForm] = useState(false);
  const [showAdditionalAddForm, setShowAdditionalAddForm] = useState(false);
  const [estimateData, setEstimateData] = useState<FinishingEstimateData>({
    electrical: {
      items: initialElectricalItems,
      total: initialElectricalItems.reduce((sum, item) => sum + item.total, 0)
    },
    doors: {
      items: initialDoorsItems,
      total: initialDoorsItems.reduce((sum, item) => sum + item.total, 0)
    },
    walls: {
      items: initialWallsItems,
      total: initialWallsItems.reduce((sum, item) => sum + item.total, 0)
    },
    floor: {
      items: initialFloorItems,
      total: initialFloorItems.reduce((sum, item) => sum + item.total, 0)
    },
    facade: {
      items: initialFacadeItems,
      total: initialFacadeItems.reduce((sum, item) => sum + item.total, 0)
    },
    plumbing: {
      items: initialPlumbingItems,
      total: initialPlumbingItems.reduce((sum, item) => sum + item.total, 0)
    },
    additional: {
      items: initialAdditionalItems,
      total: initialAdditionalItems.reduce((sum, item) => sum + item.total, 0)
    }
  });
  const [localEstimateData, setLocalEstimateData] = useState<FinishingEstimateData | null>(null);
  const [newItem, setNewItem] = useState<Partial<ElectricalItem>>({
    name: '',
    unit: 'шт',
    quantity: 0,
    price: 0,
    total: 0,
    isCompleted: false
  });
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'finishingEstimates', clientId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as FinishingEstimateData;
        setEstimateData(data);
        setLocalEstimateData(data);
      } else {
        // Если документ не существует, создаем его с начальными данными
        const initialData = {
          electrical: {
            items: initialElectricalItems,
            total: initialElectricalItems.reduce((sum, item) => sum + item.total, 0)
          },
          doors: {
            items: initialDoorsItems,
            total: initialDoorsItems.reduce((sum, item) => sum + item.total, 0)
          },
          walls: {
            items: initialWallsItems,
            total: initialWallsItems.reduce((sum, item) => sum + item.total, 0)
          },
          floor: {
            items: initialFloorItems,
            total: initialFloorItems.reduce((sum, item) => sum + item.total, 0)
          },
          facade: {
            items: initialFacadeItems,
            total: initialFacadeItems.reduce((sum, item) => sum + item.total, 0)
          },
          plumbing: {
            items: initialPlumbingItems,
            total: initialPlumbingItems.reduce((sum, item) => sum + item.total, 0)
          },
          additional: {
            items: initialAdditionalItems,
            total: initialAdditionalItems.reduce((sum, item) => sum + item.total, 0)
          }
        };
        setDoc(doc(db, 'finishingEstimates', clientId), initialData);
        setEstimateData(initialData);
        setLocalEstimateData(initialData);
      }
    });

    return () => unsubscribe();
  }, [clientId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'finishingMaterials'), (snapshot) => {
      const prices: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const material = doc.data();
        prices[material.name] = material.price;
      });
      setMaterialPrices(prices);

      // Обновляем цены в смете если есть изменения
      if (localEstimateData) {
        const updatedData = { ...localEstimateData };
        let hasChanges = false;

        Object.keys(updatedData).forEach(section => {
          updatedData[section].items = updatedData[section].items.map(item => {
            if (prices[item.name] && prices[item.name] !== item.price) {
              hasChanges = true;
              return {
                ...item,
                price: prices[item.name],
                total: item.quantity * prices[item.name]
              };
            }
            return item;
          });

          // Пересчитываем общую сумму секции
          updatedData[section].total = updatedData[section].items.reduce(
            (sum, item) => sum + item.total,
            0
          );
        });

        if (hasChanges) {
          setLocalEstimateData(updatedData);
          setEstimateData(updatedData);
          
          // Сохраняем обновленные данные в Firebase
          updateDoc(doc(db, 'finishingEstimates', clientId), updatedData)
            .catch(error => {
              console.error('Error updating estimate with new prices:', error);
            });
        }
      }
    });

    return () => unsubscribe();
  }, [clientId, localEstimateData]);

  useEffect(() => {
    const loadMaterialPrices = async () => {
      try {
        const materialsRef = collection(db, 'finishingMaterials');
        const snapshot = await getDocs(materialsRef);
        const materials = snapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = doc.data();
          return acc;
        }, {} as Record<string, any>);

        // Обновляем цены в estimateData
        setEstimateData(prev => {
          const sections = ['electrical', 'doors', 'walls', 'floor', 'facade', 'plumbing', 'additional'] as const;
          const updated = { ...prev };

          sections.forEach(section => {
            updated[section].items = updated[section].items.map((item: ElectricalItem) => {
              const material = materials[item.name];
              if (material) {
                return {
                  ...item,
                  price: material.price,
                  total: item.quantity * material.price
                };
              }
              return item;
            });
            updated[section].total = updated[section].items.reduce((sum: number, item: ElectricalItem) => sum + item.total, 0);
          });

          return updated;
        });
      } catch (error) {
        console.error('Error loading material prices:', error);
      }
    };

    loadMaterialPrices();
  }, []);

  const handleQuantityChange = (section: string, index: number, value: number) => {
    if (!isEditing || !localEstimateData) return;

    setLocalEstimateData(prevData => {
      if (!prevData) return prevData;

      const newItems = [...prevData[section].items];
      newItems[index] = {
        ...newItems[index],
        quantity: value,
        total: value * newItems[index].price
      };

      const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

      const updatedData = {
        ...prevData,
        [section]: {
          items: newItems,
          total: newTotal
        }
      };

      // Автоматически сохраняем изменения
      updateDoc(doc(db, 'finishingEstimates', clientId), updatedData)
        .then(() => {
          setEstimateData(updatedData);
        })
        .catch(error => {
          console.error('Error saving estimate:', error);
        });

      return updatedData;
    });
  };

  const handleCompletedChange = (section: string, index: number, value: boolean) => {
    if (!isEditing || !localEstimateData) return;

    setLocalEstimateData(prevData => {
      if (!prevData) return prevData;

      const newItems = [...prevData[section].items];
      newItems[index] = {
        ...newItems[index],
        isCompleted: value
      };

      const updatedData = {
        ...prevData,
        [section]: {
          ...prevData[section],
          items: newItems
        }
      };

      // Автоматически сохраняем изменения
      updateDoc(doc(db, 'finishingEstimates', clientId), updatedData)
        .then(() => {
          setEstimateData(updatedData);
        })
        .catch(error => {
          console.error('Error saving estimate:', error);
        });

      return updatedData;
    });
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.unit) return;

    const item: ElectricalItem = {
      name: newItem.name,
      unit: newItem.unit,
      quantity: newItem.quantity || 0,
      price: newItem.price || 0,
      total: (newItem.quantity || 0) * (newItem.price || 0),
      isCompleted: false
    };

    const newItems = [...estimateData.electrical.items, item];
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      electrical: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      electrical: {
        items: newItems,
        total: newTotal
      }
    });

    setNewItem({
      name: '',
      unit: 'шт',
      quantity: 0,
      price: 0,
      total: 0,
      isCompleted: false
    });
    setShowAddForm(false);
  };

  const handleDeleteItem = (index: number) => {
    if (!isEditing) return;

    const newItems = estimateData.electrical.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      electrical: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      electrical: {
        items: newItems,
        total: newTotal
      }
    });
  };

  const handleAddDoorsItem = () => {
    if (!newItem.name || !newItem.unit) return;

    const item: ElectricalItem = {
      name: newItem.name,
      unit: newItem.unit,
      quantity: newItem.quantity || 0,
      price: newItem.price || 0,
      total: (newItem.quantity || 0) * (newItem.price || 0),
      isCompleted: false
    };

    const newItems = [...estimateData.doors.items, item];
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      doors: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      doors: {
        items: newItems,
        total: newTotal
      }
    });

    setNewItem({
      name: '',
      unit: 'шт',
      quantity: 0,
      price: 0,
      total: 0,
      isCompleted: false
    });
    setShowDoorsAddForm(false);
  };

  const handleDeleteDoorsItem = (index: number) => {
    if (!isEditing) return;

    const newItems = estimateData.doors.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      doors: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      doors: {
        items: newItems,
        total: newTotal
      }
    });
  };

  const handleAddWallsItem = () => {
    if (!newItem.name || !newItem.unit) return;

    const item: ElectricalItem = {
      name: newItem.name,
      unit: newItem.unit,
      quantity: newItem.quantity || 0,
      price: newItem.price || 0,
      total: (newItem.quantity || 0) * (newItem.price || 0),
      isCompleted: false
    };

    const newItems = [...estimateData.walls.items, item];
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      walls: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      walls: {
        items: newItems,
        total: newTotal
      }
    });

    setNewItem({
      name: '',
      unit: 'шт',
      quantity: 0,
      price: 0,
      total: 0,
      isCompleted: false
    });
    setShowWallsAddForm(false);
  };

  const handleDeleteWallsItem = (index: number) => {
    if (!isEditing) return;

    const newItems = estimateData.walls.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      walls: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      walls: {
        items: newItems,
        total: newTotal
      }
    });
  };

  const handleAddFloorItem = () => {
    if (!newItem.name || !newItem.unit) return;

    const item: ElectricalItem = {
      name: newItem.name,
      unit: newItem.unit,
      quantity: newItem.quantity || 0,
      price: newItem.price || 0,
      total: (newItem.quantity || 0) * (newItem.price || 0),
      isCompleted: false
    };

    const newItems = [...estimateData.floor.items, item];
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      floor: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      floor: {
        items: newItems,
        total: newTotal
      }
    });

    setNewItem({
      name: '',
      unit: 'шт',
      quantity: 0,
      price: 0,
      total: 0,
      isCompleted: false
    });
    setShowFloorAddForm(false);
  };

  const handleDeleteFloorItem = (index: number) => {
    if (!isEditing) return;

    const newItems = estimateData.floor.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      floor: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      floor: {
        items: newItems,
        total: newTotal
      }
    });
  };

  const handleAddFacadeItem = () => {
    if (!newItem.name || !newItem.unit) return;

    const item: ElectricalItem = {
      name: newItem.name,
      unit: newItem.unit,
      quantity: newItem.quantity || 0,
      price: newItem.price || 0,
      total: (newItem.quantity || 0) * (newItem.price || 0),
      isCompleted: false
    };

    const newItems = [...estimateData.facade.items, item];
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      facade: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      facade: {
        items: newItems,
        total: newTotal
      }
    });

    setNewItem({
      name: '',
      unit: 'шт',
      quantity: 0,
      price: 0,
      total: 0,
      isCompleted: false
    });
    setShowFacadeAddForm(false);
  };

  const handleDeleteFacadeItem = (index: number) => {
    if (!isEditing) return;

    const newItems = estimateData.facade.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      facade: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      facade: {
        items: newItems,
        total: newTotal
      }
    });
  };

  const handleAddPlumbingItem = () => {
    if (!newItem.name || !newItem.unit) return;

    const item: ElectricalItem = {
      name: newItem.name,
      unit: newItem.unit,
      quantity: newItem.quantity || 0,
      price: newItem.price || 0,
      total: (newItem.quantity || 0) * (newItem.price || 0),
      isCompleted: false
    };

    const newItems = [...estimateData.plumbing.items, item];
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      plumbing: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      plumbing: {
        items: newItems,
        total: newTotal
      }
    });

    setNewItem({
      name: '',
      unit: 'шт',
      quantity: 0,
      price: 0,
      total: 0,
      isCompleted: false
    });
    setShowPlumbingAddForm(false);
  };

  const handleDeletePlumbingItem = (index: number) => {
    if (!isEditing) return;

    const newItems = estimateData.plumbing.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      plumbing: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      plumbing: {
        items: newItems,
        total: newTotal
      }
    });
  };

  const handleAddAdditionalItem = () => {
    if (!newItem.name || !newItem.unit) return;

    const item: ElectricalItem = {
      name: newItem.name,
      unit: newItem.unit,
      quantity: newItem.quantity || 0,
      price: newItem.price || 0,
      total: (newItem.quantity || 0) * (newItem.price || 0),
      isCompleted: false
    };

    const newItems = [...estimateData.additional.items, item];
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      additional: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      additional: {
        items: newItems,
        total: newTotal
      }
    });

    setNewItem({
      name: '',
      unit: 'шт',
      quantity: 0,
      price: 0,
      total: 0,
      isCompleted: false
    });
    setShowAdditionalAddForm(false);
  };

  const handleDeleteAdditionalItem = (index: number) => {
    if (!isEditing) return;

    const newItems = estimateData.additional.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

    setEstimateData({
      ...estimateData,
      additional: {
        items: newItems,
        total: newTotal
      }
    });

    updateDoc(doc(db, 'finishingEstimates', clientId), {
      additional: {
        items: newItems,
        total: newTotal
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Свернуть' : 'Развернуть'} чистовую смету
          </button>
        </div>
        {isEditing && (
          <Link
            to="/finishing-materials"
            className="text-gray-600 hover:text-gray-800 transition-colors"
            title="Управление ценами материалов"
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}
      </div>
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">Электрика</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Наименование материала, описание работ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ед.изм.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена за ед.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Стоимость, тг
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Готово
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimateData.electrical.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isCompleted ? 'bg-green-50' : ''}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 flex items-center">
                        {item.name}
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={localEstimateData?.electrical.items[index].quantity ?? item.quantity}
                            onChange={(e) => handleQuantityChange('electrical', index, Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded-md"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.total.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleCompletedChange('electrical', index, e.target.checked)}
                          disabled={!isEditing}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                  {showAddForm && isEditing && (
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название"
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="Ед.изм."
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-24 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {((newItem.quantity || 0) * (newItem.price || 0)).toLocaleString()} ₸
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={handleAddItem}
                          disabled={!newItem.name || !newItem.unit}
                          className="px-4 py-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Добавить
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      Итого, стоимость материалов
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {estimateData.electrical.total.toLocaleString()} ₸
                    </td>
                  </tr>
                </tbody>
              </table>
              {isEditing && !showAddForm && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <span className="text-xl mr-1">+</span> Добавить позицию
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">Двери и окна</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Наименование материала, описание работ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ед.изм.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена за ед.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Стоимость, тг
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Готово
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimateData.doors.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isCompleted ? 'bg-green-50' : ''}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 flex items-center">
                        {item.name}
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteDoorsItem(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={localEstimateData?.doors.items[index].quantity ?? item.quantity}
                            onChange={(e) => handleQuantityChange('doors', index, Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded-md"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.total.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleCompletedChange('doors', index, e.target.checked)}
                          disabled={!isEditing}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                  {showDoorsAddForm && isEditing && (
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название"
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="Ед.изм."
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-24 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {((newItem.quantity || 0) * (newItem.price || 0)).toLocaleString()} ₸
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={handleAddDoorsItem}
                          disabled={!newItem.name || !newItem.unit}
                          className="px-4 py-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Добавить
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      Итого, стоимость материалов
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {estimateData.doors.total.toLocaleString()} ₸
                    </td>
                  </tr>
                </tbody>
              </table>
              {isEditing && !showDoorsAddForm && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => setShowDoorsAddForm(true)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <span className="text-xl mr-1">+</span> Добавить позицию
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">Стены и потолок</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Наименование материала, описание работ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ед.изм.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена за ед.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Стоимость, тг
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Готово
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimateData.walls.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isCompleted ? 'bg-green-50' : ''}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 flex items-center">
                        {item.name}
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteWallsItem(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={localEstimateData?.walls.items[index].quantity ?? item.quantity}
                            onChange={(e) => handleQuantityChange('walls', index, Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded-md"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.total.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleCompletedChange('walls', index, e.target.checked)}
                          disabled={!isEditing}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                  {showWallsAddForm && isEditing && (
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название"
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="Ед.изм."
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-24 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {((newItem.quantity || 0) * (newItem.price || 0)).toLocaleString()} ₸
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={handleAddWallsItem}
                          disabled={!newItem.name || !newItem.unit}
                          className="px-4 py-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Добавить
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      Итого, стоимость материалов
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {estimateData.walls.total.toLocaleString()} ₸
                    </td>
                  </tr>
                </tbody>
              </table>
              {isEditing && !showWallsAddForm && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => setShowWallsAddForm(true)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <span className="text-xl mr-1">+</span> Добавить позицию
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">Пол</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Наименование материала, описание работ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ед.изм.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена за ед.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Стоимость, тг
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Готово
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimateData.floor.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isCompleted ? 'bg-green-50' : ''}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 flex items-center">
                        {item.name}
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteFloorItem(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={localEstimateData?.floor.items[index].quantity ?? item.quantity}
                            onChange={(e) => handleQuantityChange('floor', index, Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded-md"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.total.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleCompletedChange('floor', index, e.target.checked)}
                          disabled={!isEditing}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                  {showFloorAddForm && isEditing && (
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название"
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="Ед.изм."
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-24 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {((newItem.quantity || 0) * (newItem.price || 0)).toLocaleString()} ₸
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={handleAddFloorItem}
                          disabled={!newItem.name || !newItem.unit}
                          className="px-4 py-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Добавить
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      Итого, стоимость материалов
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {estimateData.floor.total.toLocaleString()} ₸
                    </td>
                  </tr>
                </tbody>
              </table>
              {isEditing && !showFloorAddForm && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => setShowFloorAddForm(true)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <span className="text-xl mr-1">+</span> Добавить позицию
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">Фасад отделка на весь дом 280м2 по фасаду</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Наименование материала, описание работ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ед.изм.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена за ед.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Стоимость, тг
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Готово
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimateData.facade.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isCompleted ? 'bg-green-50' : ''}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 flex items-center">
                        {item.name}
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteFacadeItem(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={localEstimateData?.facade.items[index].quantity ?? item.quantity}
                            onChange={(e) => handleQuantityChange('facade', index, Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded-md"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.total.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleCompletedChange('facade', index, e.target.checked)}
                          disabled={!isEditing}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                  {showFacadeAddForm && isEditing && (
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название"
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="Ед.изм."
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-24 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {((newItem.quantity || 0) * (newItem.price || 0)).toLocaleString()} ₸
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={handleAddFacadeItem}
                          disabled={!newItem.name || !newItem.unit}
                          className="px-4 py-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Добавить
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      Итого, стоимость материалов
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {estimateData.facade.total.toLocaleString()} ₸
                    </td>
                  </tr>
                </tbody>
              </table>
              {isEditing && !showFacadeAddForm && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => setShowFacadeAddForm(true)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <span className="text-xl mr-1">+</span> Добавить позицию
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">Сан Техника</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Наименование материала, описание работ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ед.изм.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена за ед.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Стоимость, тг
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Готово
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimateData.plumbing.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isCompleted ? 'bg-green-50' : ''}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 flex items-center">
                        {item.name}
                        {isEditing && (
                          <button
                            onClick={() => handleDeletePlumbingItem(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={localEstimateData?.plumbing.items[index].quantity ?? item.quantity}
                            onChange={(e) => handleQuantityChange('plumbing', index, Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded-md"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.total.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleCompletedChange('plumbing', index, e.target.checked)}
                          disabled={!isEditing}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                  {showPlumbingAddForm && isEditing && (
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название"
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="Ед.изм."
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-24 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {((newItem.quantity || 0) * (newItem.price || 0)).toLocaleString()} ₸
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={handleAddPlumbingItem}
                          disabled={!newItem.name || !newItem.unit}
                          className="px-4 py-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Добавить
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      Итого, стоимость материалов
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {estimateData.plumbing.total.toLocaleString()} ₸
                    </td>
                  </tr>
                </tbody>
              </table>
              {isEditing && !showPlumbingAddForm && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => setShowPlumbingAddForm(true)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <span className="text-xl mr-1">+</span> Добавить позицию
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">Доп Работы</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Наименование материала, описание работ
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ед.изм.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена за ед.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Стоимость, тг
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Готово
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimateData.additional.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isCompleted ? 'bg-green-50' : ''}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 flex items-center">
                        {item.name}
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteAdditionalItem(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={localEstimateData?.additional.items[index].quantity ?? item.quantity}
                            onChange={(e) => handleQuantityChange('additional', index, Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded-md"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.total.toLocaleString()} ₸</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleCompletedChange('additional', index, e.target.checked)}
                          disabled={!isEditing}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                  {showAdditionalAddForm && isEditing && (
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название"
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="Ед.изм."
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-24 px-2 py-1 border rounded-md"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {((newItem.quantity || 0) * (newItem.price || 0)).toLocaleString()} ₸
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={handleAddAdditionalItem}
                          disabled={!newItem.name || !newItem.unit}
                          className="px-4 py-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Добавить
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      Итого, стоимость материалов
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {estimateData.additional.total.toLocaleString()} ₸
                    </td>
                  </tr>
                </tbody>
              </table>
              {isEditing && !showAdditionalAddForm && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => setShowAdditionalAddForm(true)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <span className="text-xl mr-1">+</span> Добавить позицию
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Добавляем общий итог */}
          <div className="bg-blue-50 rounded-lg shadow overflow-hidden mt-4">
            <div className="px-4 py-3 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">ИТОГО ОБЩАЯ</h3>
                <span className="text-lg font-bold text-blue-700">
                  {(
                    estimateData.electrical.total +
                    estimateData.doors.total +
                    estimateData.walls.total +
                    estimateData.floor.total +
                    estimateData.facade.total +
                    estimateData.plumbing.total +
                    estimateData.additional.total
                  ).toLocaleString()} ₸
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
