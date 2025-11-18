import React from 'react';
import { 
  Building2, 
  Calculator, 
  Car, 
  Globe, 
  Hammer, 
  Home, 
  Package, 
  User, 
  Wallet,
  Users,
  CircleUser,
  Building,
  Factory,
  Truck,
  ShoppingBag,
  Wrench,
  HardDrive,
  BadgeDollarSign,
  Briefcase,
  CreditCard,
  DollarSign,
  FileText,
  HardHat,
  Key,
  LandPlot,
  LayoutGrid,
  Map,
  Store,
  Settings,
  Construction,
  Box,
  Boxes,
  Warehouse,
  ShoppingCart
} from 'lucide-react';

interface IconOption {
  name: string;
  component: React.ElementType;
  categories: number[];
}

const icons: IconOption[] = [
  // Иконки для клиентов (категория 1)
  { name: 'User', component: User, categories: [1] },
  { name: 'CircleUser', component: CircleUser, categories: [1] },
  { name: 'Users', component: Users, categories: [1] },
  { name: 'Car', component: Car, categories: [1] },
  { name: 'Briefcase', component: Briefcase, categories: [1] },
  { name: 'CreditCard', component: CreditCard, categories: [1] },
  { name: 'BadgeDollarSign', component: BadgeDollarSign, categories: [1] },
  { name: 'DollarSign', component: DollarSign, categories: [1] },

  // Иконки для сотрудников (категория 2)
  { name: 'User', component: User, categories: [2] },
  { name: 'Users', component: Users, categories: [2] },
  { name: 'HardHat', component: HardHat, categories: [2] },
  { name: 'Settings', component: Settings, categories: [2] },
  { name: 'Wrench', component: Wrench, categories: [2] },
  { name: 'HardDrive', component: HardDrive, categories: [2] },
  { name: 'FileText', component: FileText, categories: [2] },
  { name: 'Calculator', component: Calculator, categories: [2] },

  // Иконки для проектов (категория 3)
  { name: 'Building', component: Building, categories: [3] },
  { name: 'Building2', component: Building2, categories: [3] },
  { name: 'Factory', component: Factory, categories: [3] },
  { name: 'Home', component: Home, categories: [3] },
  { name: 'Construction', component: Construction, categories: [3] },
  { name: 'Map', component: Map, categories: [3] },
  { name: 'Globe', component: Globe, categories: [3] },
  { name: 'LayoutGrid', component: LayoutGrid, categories: [3] },

  // Иконки для склада (категория 4)
  { name: 'Package', component: Package, categories: [4] },
  { name: 'Store', component: Store, categories: [4] },
  { name: 'Truck', component: Truck, categories: [4] },
  { name: 'ShoppingCart', component: ShoppingCart, categories: [4] },
  { name: 'Box', component: Box, categories: [4] },
  { name: 'Boxes', component: Boxes, categories: [4] },
  { name: 'Warehouse', component: Warehouse, categories: [4] },
  { name: 'Wallet', component: Wallet, categories: [4] }
];

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  categoryRow: number;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  onSelectIcon,
  categoryRow
}) => {
  // Фильтруем иконки для конкретной категории
  const availableIcons = icons.filter(icon => icon.categories.includes(categoryRow));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Иконка
      </label>
      <div className="grid grid-cols-4 gap-2">
        {availableIcons.map(({ name, component: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelectIcon(name)}
            className={`p-2 rounded-md flex items-center justify-center ${
              selectedIcon === name
                ? 'bg-blue-100 ring-2 ring-blue-500'
                : 'hover:bg-gray-100'
            }`}
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
};