import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Material {
  id: string;
  name: string;
  unit: string;
  price: number;
  section: string;
}

const initialMaterials: Omit<Material, 'id'>[] = [
  // Электрика
  { name: 'Лампы', unit: 'шт', price: 3500, section: 'electrical' },
  { name: 'Лампочка наружн', unit: 'шт', price: 10000, section: 'electrical' },
  { name: 'Лампы над кроватью', unit: 'шт', price: 7000, section: 'electrical' },
  { name: 'Люстра', unit: 'шт', price: 15000, section: 'electrical' },
  { name: 'Бра', unit: 'шт', price: 7000, section: 'electrical' },
  { name: 'Точечный светильник', unit: 'шт', price: 1500, section: 'electrical' },
  { name: 'Розетка', unit: 'шт', price: 800, section: 'electrical' },
  { name: 'Выключатель', unit: 'шт', price: 800, section: 'electrical' },
  { name: 'Вентилятор в санузел', unit: 'шт', price: 4500, section: 'electrical' },
  { name: 'Звонок', unit: 'шт', price: 2500, section: 'electrical' },

  // Двери
  { name: 'Дверь входная', unit: 'шт', price: 95000, section: 'doors' },
  { name: 'Дверь межкомнатная', unit: 'шт', price: 45000, section: 'doors' },
  { name: 'Дверь купе', unit: 'шт', price: 45000, section: 'doors' },

  // Стены
  { name: 'Обои', unit: 'рул', price: 4500, section: 'walls' },
  { name: 'Кафель', unit: 'м2', price: 5000, section: 'walls' },
  { name: 'Декор панель', unit: 'шт', price: 4500, section: 'walls' },
  { name: 'Уголок', unit: 'шт', price: 150, section: 'walls' },
  { name: 'Крестики', unit: 'уп', price: 150, section: 'walls' },
  { name: 'Клей для кафеля', unit: 'меш', price: 2500, section: 'walls' },
  { name: 'Клей для обоев', unit: 'уп', price: 1200, section: 'walls' },
  { name: 'Затирка', unit: 'уп', price: 1500, section: 'walls' },

  // Пол
  { name: 'Ламинат', unit: 'м2', price: 4500, section: 'floor' },
  { name: 'Кафель', unit: 'м2', price: 5000, section: 'floor' },
  { name: 'Подложка', unit: 'м2', price: 200, section: 'floor' },
  { name: 'Порог', unit: 'шт', price: 2500, section: 'floor' },
  { name: 'Плинтус', unit: 'шт', price: 2500, section: 'floor' },
  { name: 'Уголок', unit: 'шт', price: 150, section: 'floor' },
  { name: 'Крестики', unit: 'уп', price: 150, section: 'floor' },
  { name: 'Клей для кафеля', unit: 'меш', price: 2500, section: 'floor' },
  { name: 'Затирка', unit: 'уп', price: 1500, section: 'floor' },

  // Фасад
  { name: 'Кафель', unit: 'м2', price: 5000, section: 'facade' },
  { name: 'Уголок', unit: 'шт', price: 150, section: 'facade' },
  { name: 'Крестики', unit: 'уп', price: 150, section: 'facade' },
  { name: 'Клей для кафеля', unit: 'меш', price: 2500, section: 'facade' },
  { name: 'Затирка', unit: 'уп', price: 1500, section: 'facade' },

  // Сантехника
  { name: 'Резинка 50 для душ каб', unit: 'шт', price: 350, section: 'plumbing' },
  { name: 'Ножка для раковины', unit: 'шт', price: 4000, section: 'plumbing' },
  { name: 'Умывальник', unit: 'шт', price: 5600, section: 'plumbing' },
  { name: 'Унитаз', unit: 'шт', price: 31700, section: 'plumbing' },
  { name: 'Инсталляция', unit: 'шт', price: 65000, section: 'plumbing' },
  { name: 'Ванна', unit: 'шт', price: 45000, section: 'plumbing' },
  { name: 'Душевая кабина', unit: 'шт', price: 140000, section: 'plumbing' },
  { name: 'Смеситель для умывальника', unit: 'шт', price: 12000, section: 'plumbing' },
  { name: 'Смеситель для ванны', unit: 'шт', price: 20000, section: 'plumbing' },
  { name: 'Душевая стойка', unit: 'шт', price: 45000, section: 'plumbing' },
  { name: 'Полотенцесушитель', unit: 'шт', price: 15000, section: 'plumbing' },
  { name: 'Гигиенический душ', unit: 'шт', price: 8000, section: 'plumbing' },
  { name: 'Держатель для туалетной бумаги', unit: 'шт', price: 3000, section: 'plumbing' },
  { name: 'Держатель для полотенец', unit: 'шт', price: 3000, section: 'plumbing' },
  { name: 'Зеркало', unit: 'шт', price: 15000, section: 'plumbing' }
];

export const FinishingMaterialsManager: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const materialsRef = collection(db, 'finishingMaterials');
      const snapshot = await getDocs(materialsRef);
      const loadedMaterials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];

      if (loadedMaterials.length === 0) {
        await initializeMaterials();
      } else {
        setMaterials(loadedMaterials);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading materials:', error);
      setIsLoading(false);
    }
  };

  const initializeMaterials = async () => {
    try {
      const materialsRef = collection(db, 'finishingMaterials');
      
      // Сначала удалим все существующие материалы
      const snapshot = await getDocs(materialsRef);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Затем добавим новые материалы
      const addPromises = initialMaterials.map(material => 
        setDoc(doc(materialsRef), material)
      );
      await Promise.all(addPromises);

      // Загрузим обновленные материалы
      const newSnapshot = await getDocs(materialsRef);
      const loadedMaterials = newSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];

      setMaterials(loadedMaterials);
    } catch (error) {
      console.error('Error initializing materials:', error);
    }
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      price: newPrice
    };
    setMaterials(updatedMaterials);
  };

  const saveMaterials = async () => {
    setIsSaving(true);
    try {
      const materialsRef = collection(db, 'finishingMaterials');
      
      // Сохраняем каждый материал отдельно
      const savePromises = materials.map(material => 
        setDoc(doc(materialsRef, material.id), {
          name: material.name,
          unit: material.unit,
          price: material.price,
          section: material.section
        })
      );

      await Promise.all(savePromises);
      alert('Цены успешно сохранены');
    } catch (error) {
      console.error('Error saving materials:', error);
      alert('Ошибка при сохранении цен');
    }
    setIsSaving(false);
  };

  const groupedMaterials = materials.reduce((groups, material) => {
    const section = material.section;
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(material);
    return groups;
  }, {} as Record<string, Material[]>);

  const sectionNames: Record<string, string> = {
    electrical: 'Электрика',
    doors: 'Двери',
    walls: 'Стены',
    floor: 'Пол',
    facade: 'Фасад',
    plumbing: 'Сантехника'
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Управление ценами материалов чистовой отделки</h1>
      
      {Object.entries(groupedMaterials).map(([section, sectionMaterials]) => (
        <div key={section} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{sectionNames[section]}</h2>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Название</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Ед. изм.</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Цена</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sectionMaterials.map((material, index) => (
                  <tr key={material.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{material.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{material.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <input
                        type="number"
                        value={material.price}
                        onChange={(e) => handlePriceChange(
                          materials.findIndex(m => m.id === material.id),
                          Number(e.target.value)
                        )}
                        className="w-24 px-2 py-1 border rounded-md"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="mt-6">
        <button
          onClick={saveMaterials}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
};
