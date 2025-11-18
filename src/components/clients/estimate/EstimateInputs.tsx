import React from 'react';

interface EstimateInputsProps {
  projectNumber: string;
  floors: string;
  firstFloorHeight: string;
  secondFloorHeight: string;
  isProjectNumberChecked: boolean;
  isFloorsChecked: boolean;
  isFirstFloorHeightChecked: boolean;
  isSecondFloorHeightChecked: boolean;
  onProjectNumberChange: (value: string) => void;
  onFloorsChange: (value: string) => void;
  onFirstFloorHeightChange: (value: string) => void;
  onSecondFloorHeightChange: (value: string) => void;
  onProjectNumberCheckChange: (checked: boolean) => void;
  onFloorsCheckChange: (checked: boolean) => void;
  onFirstFloorHeightCheckChange: (checked: boolean) => void;
  onSecondFloorHeightCheckChange: (checked: boolean) => void;
  isEditing: boolean;
}

export const EstimateInputs: React.FC<EstimateInputsProps> = ({
  projectNumber,
  floors,
  firstFloorHeight,
  secondFloorHeight,
  isProjectNumberChecked,
  isFloorsChecked,
  isFirstFloorHeightChecked,
  isSecondFloorHeightChecked,
  onProjectNumberChange,
  onFloorsChange,
  onFirstFloorHeightChange,
  onSecondFloorHeightChange,
  onProjectNumberCheckChange,
  onFloorsCheckChange,
  onFirstFloorHeightCheckChange,
  onSecondFloorHeightCheckChange,
  isEditing
}) => {
  const parseHeight = (height: string): number => {
    return parseFloat(height.replace(',', '.').replace(/[^\d.]/g, '')) || 2.5;
  };

  const formatHeight = (value: number): string => {
    return value.toString().replace('.', ',') + ' м.';
  };

  const handleHeightChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    const numValue = parseFloat(value) || 2.5;
    onChange(formatHeight(numValue));
  };

  const gridCols = floors === "1" ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4`}>
      <div className={`flex items-center px-2 py-1 rounded ${isProjectNumberChecked ? 'bg-green-100' : 'bg-gray-100'}`}>
        <div className="flex-1 flex items-center">
          <span>Площадь дома м2</span>
          <input
            type="text"
            value={projectNumber}
            onChange={(e) => onProjectNumberChange(e.target.value)}
            className="w-16 ml-2 px-2 py-1 border rounded text-[10px] sm:text-base"
            disabled={!isEditing}
          />
        </div>
        <input
          type="checkbox"
          checked={isProjectNumberChecked}
          onChange={(e) => onProjectNumberCheckChange(e.target.checked)}
          className="w-4 h-4 ml-2 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          disabled={!isEditing}
        />
      </div>

      <div className={`flex items-center px-2 py-1 rounded ${isFloorsChecked ? 'bg-green-100' : 'bg-gray-100'}`}>
        <div className="flex-1 flex items-center">
          <span>Кол-во эт.</span>
          <select
            value={floors}
            onChange={(e) => onFloorsChange(e.target.value)}
            className="w-20 ml-2 px-2 py-1 border rounded text-[10px] sm:text-base"
            disabled={!isEditing}
          >
            <option value="1">1 эт</option>
            <option value="2">2 эт</option>
            <option value="3">3 эт</option>
            <option value="4">4 эт</option>
          </select>
        </div>
        <input
          type="checkbox"
          checked={isFloorsChecked}
          onChange={(e) => onFloorsCheckChange(e.target.checked)}
          className="w-4 h-4 ml-2 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          disabled={!isEditing}
        />
      </div>

      <div className={`flex items-center px-2 py-1 rounded ${isFirstFloorHeightChecked ? 'bg-green-100' : 'bg-gray-100'}`}>
        <div className="flex-1 flex items-center">
          <span>1-ый эт.</span>
          <input
            type="number"
            value={parseHeight(firstFloorHeight)}
            onChange={(e) => handleHeightChange(e.target.value, onFirstFloorHeightChange)}
            className="w-24 ml-2 px-2 py-1 border rounded text-[10px] sm:text-base"
            disabled={!isEditing}
            step="0.1"
            min="2.0"
            max="4.0"
          />
        </div>
        <input
          type="checkbox"
          checked={isFirstFloorHeightChecked}
          onChange={(e) => onFirstFloorHeightCheckChange(e.target.checked)}
          className="w-4 h-4 ml-2 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          disabled={!isEditing}
        />
      </div>

      {floors !== "1" && (
        <div className={`flex items-center px-2 py-1 rounded ${isSecondFloorHeightChecked ? 'bg-green-100' : 'bg-gray-100'}`}>
          <div className="flex-1 flex items-center">
            <span>2-ой эт.</span>
            <input
              type="number"
              value={parseHeight(secondFloorHeight)}
              onChange={(e) => handleHeightChange(e.target.value, onSecondFloorHeightChange)}
              className="w-24 ml-2 px-2 py-1 border rounded text-[10px] sm:text-base"
              disabled={!isEditing}
              step="0.1"
              min="2.0"
              max="4.0"
            />
          </div>
          <input
            type="checkbox"
            checked={isSecondFloorHeightChecked}
            onChange={(e) => onSecondFloorHeightCheckChange(e.target.checked)}
            className="w-4 h-4 ml-2 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            disabled={!isEditing}
          />
        </div>
      )}
    </div>
  );
};