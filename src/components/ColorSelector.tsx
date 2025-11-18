import React from 'react';

const colors = [
  { name: 'bg-emerald-500', label: 'Зеленый' },
  { name: 'bg-amber-400', label: 'Желтый' },
  { name: 'bg-blue-500', label: 'Синий' },
  { name: 'bg-red-500', label: 'Красный' },
  { name: 'bg-purple-500', label: 'Фиолетовый' },
  { name: 'bg-pink-500', label: 'Розовый' },
];

interface ColorSelectorProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  selectedColor,
  onSelectColor,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Цвет
      </label>
      <div className="grid grid-cols-3 gap-2">
        {colors.map(({ name, label }) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelectColor(name)}
            className={`h-8 rounded-md ${name} ${
              selectedColor === name
                ? 'ring-2 ring-offset-2 ring-blue-500'
                : ''
            }`}
            title={label}
          />
        ))}
      </div>
    </div>
  );
};