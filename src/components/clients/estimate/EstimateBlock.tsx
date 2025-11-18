import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EstimateHeader } from './EstimateHeader';
import { EstimateInputs } from './EstimateInputs';
import { EstimateTables } from './EstimateTables';
import { useEstimateData } from '../../../hooks/useEstimateData';

interface EstimateBlockProps {
  isEditing: boolean;
  clientId: string;
  floors: string;
  onFloorsChange: (floors: string) => void;
}

export const EstimateBlock: React.FC<EstimateBlockProps> = ({ 
  isEditing, 
  clientId,
  floors,
  onFloorsChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    projectNumber,
    /* floors, */
    firstFloorHeight,
    secondFloorHeight,
    isProjectNumberChecked,
    isFloorsChecked,
    isFirstFloorHeightChecked,
    isSecondFloorHeightChecked,
    foundationValues,
    lumberValues,
    roofValues,
    handleProjectNumberChange,
    handleFloorsChange: handleFloorsChangeInternal,
    handleFirstFloorHeightChange,
    handleSecondFloorHeightChange,
    handleProjectNumberCheckChange,
    handleFloorsCheckChange,
    handleFirstFloorHeightCheckChange,
    handleSecondFloorHeightCheckChange,
    handleFoundationChange,
    handleFoundationCheckChange,
    handleLumberChange,
    handleLumberCheckChange,
    handleRoofChange,
    handleRoofCheckChange
  } = useEstimateData(clientId, isEditing);

  // floors теперь приходит через пропсы, а не локально из useEstimateData
  // Обновляем только EstimateData и родителя
  const handleFloorsChange = (value: string) => {
    handleFloorsChangeInternal(value);
    onFloorsChange(value);
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-gray-700 hover:text-gray-900 mb-4"
      >
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 mr-1" />
        ) : (
          <ChevronDown className="w-5 h-5 mr-1" />
        )}
        Блок расчета сметы
      </button>

      {isExpanded && (
        <div className="space-y-4">
          <EstimateHeader />
          
          <EstimateInputs
            projectNumber={projectNumber}
            floors={floors}
            firstFloorHeight={firstFloorHeight}
            secondFloorHeight={secondFloorHeight}
            isProjectNumberChecked={isProjectNumberChecked}
            isFloorsChecked={isFloorsChecked}
            isFirstFloorHeightChecked={isFirstFloorHeightChecked}
            isSecondFloorHeightChecked={isSecondFloorHeightChecked}
            onProjectNumberChange={handleProjectNumberChange}
            onFloorsChange={handleFloorsChange}
            onFirstFloorHeightChange={handleFirstFloorHeightChange}
            onSecondFloorHeightChange={handleSecondFloorHeightChange}
            onProjectNumberCheckChange={handleProjectNumberCheckChange}
            onFloorsCheckChange={handleFloorsCheckChange}
            onFirstFloorHeightCheckChange={handleFirstFloorHeightCheckChange}
            onSecondFloorHeightCheckChange={handleSecondFloorHeightCheckChange}
            isEditing={isEditing}
          />

          <EstimateTables
            foundationValues={foundationValues}
            lumberValues={lumberValues}
            roofValues={roofValues}
            onFoundationChange={handleFoundationChange}
            onFoundationCheckChange={handleFoundationCheckChange}
            onLumberChange={handleLumberChange}
            onLumberCheckChange={handleLumberCheckChange}
            onRoofChange={handleRoofChange}
            onRoofCheckChange={handleRoofCheckChange}
            isEditing={isEditing}
            clientId={clientId}
            projectNumber={projectNumber}
          />
        </div>
      )}
    </div>
  );
};