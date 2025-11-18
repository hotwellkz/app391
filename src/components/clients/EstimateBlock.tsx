import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EstimateTable } from './EstimateTable';
import { EstimateData } from '../../types/estimate';

interface EstimateBlockProps {
  isEditing: boolean;
  clientId: string;
  floors: string;
  onFloorsChange: (floors: string) => void;
}

export const EstimateBlock: React.FC<EstimateBlockProps> = ({ isEditing, clientId, floors, onFloorsChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [projectNumber, setProjectNumber] = useState('0');
  const [firstFloorHeight, setFirstFloorHeight] = useState('2,5 м.');
  const [secondFloorHeight, setSecondFloorHeight] = useState('2,5 м.');

  const [foundationValues, setFoundationValues] = useState({
    perimeter: { value: 0, isChecked: false },
    pilesCount: { value: 0, isChecked: false },
    backfillArea: { value: 0, isChecked: false },
    pipeLength: { value: 0, isChecked: false },
    sikersCamaz: { value: 0, isChecked: false },
    sikersNowo: { value: 0, isChecked: false },
    pgsCamaz: { value: 0, isChecked: false },
    pgsNowo: { value: 0, isChecked: false },
    tpPadding: { value: 0, isChecked: false },
    heatedFloor: { value: 0, isChecked: false },
    concreteTape: { value: 0, isChecked: false },
    concreteStairs: { value: 0, isChecked: false },
    sip25Area: { value: 0, isChecked: false },
    sip28Area: { value: 0, isChecked: false },
    bikrost: { value: 0, isChecked: false }
  });

  const [lumberValues, setLumberValues] = useState({
    walls40x14: { value: 0, isChecked: false },
    roof40x14: { value: 0, isChecked: false },
    attic40x14: { value: 0, isChecked: false },
    floor40x19: { value: 0, isChecked: false },
    beam40x19: { value: 0, isChecked: false },
    lathing20x9: { value: 0, isChecked: false },
    floorArea: { value: 0, isChecked: false },
    atticArea: { value: 0, isChecked: false },
    frontonArea: { value: 0, isChecked: false },
    gklWallsArea: { value: 0, isChecked: false },
    gklWallsLength: { value: 0, isChecked: false },
    firstFloorWallsLength: { value: 0, isChecked: false },
    secondFloorWallsLength: { value: 0, isChecked: false },
    partitionProfile: { value: 0, isChecked: false }
  });

  const [roofValues, setRoofValues] = useState({
    metalTileArea: { value: 0, isChecked: false },
    ridgeLength: { value: 0, isChecked: false },
    endowLength: { value: 0, isChecked: false },
    conicPlug: { value: 0, isChecked: false },
    tee: { value: 0, isChecked: false },
    wallPlank: { value: 0, isChecked: false },
    vaporBarrier: { value: 0, isChecked: false },
    steamBarrier2: { value: 0, isChecked: false },
    barrelRidge: { value: 0, isChecked: false },
    externalEndow: { value: 0, isChecked: false },
    internalEndow: { value: 0, isChecked: false },
    builderSalary: { value: 0, isChecked: false },
    contractPrice: { value: 0, isChecked: false }
  });

  useEffect(() => {
    const loadEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'estimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          const data = estimateDoc.data() as EstimateData;
          setProjectNumber(data.projectNumber || '0');
          setFirstFloorHeight(data.firstFloorHeight || '2,5 м.');
          setSecondFloorHeight(data.secondFloorHeight || '2,5 м.');
          
          if (data.foundationValues) {
            setFoundationValues(prev => ({
              ...prev,
              ...data.foundationValues
            }));
          }
          
          if (data.lumberValues) {
            setLumberValues(prev => ({
              ...prev,
              ...data.lumberValues
            }));
          }
          
          if (data.roofValues) {
            setRoofValues(prev => ({
              ...prev,
              ...data.roofValues
            }));
          }
        }
      } catch (error) {
        console.error('Error loading estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'estimates', clientId);
        await setDoc(estimateRef, {
          projectNumber,
          firstFloorHeight,
          secondFloorHeight,
          foundationValues,
          lumberValues,
          roofValues
        } as EstimateData);
      } catch (error) {
        console.error('Error saving estimate data:', error);
      }
    };

    const debounceTimer = setTimeout(saveEstimateData, 500);
    return () => clearTimeout(debounceTimer);
  }, [
    clientId,
    isEditing,
    projectNumber,
    firstFloorHeight,
    secondFloorHeight,
    foundationValues,
    lumberValues,
    roofValues
  ]);

  const handleFoundationChange = (key: keyof typeof foundationValues) => (value: number) => {
    setFoundationValues(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  const handleFoundationCheckChange = (key: keyof typeof foundationValues) => (checked: boolean) => {
    setFoundationValues(prev => ({
      ...prev,
      [key]: { ...prev[key], isChecked: checked }
    }));
  };

  const handleLumberChange = (key: keyof typeof lumberValues) => (value: number) => {
    setLumberValues(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  const handleLumberCheckChange = (key: keyof typeof lumberValues) => (checked: boolean) => {
    setLumberValues(prev => ({
      ...prev,
      [key]: { ...prev[key], isChecked: checked }
    }));
  };

  const handleRoofChange = (key: keyof typeof roofValues) => (value: number) => {
    setRoofValues(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  const handleRoofCheckChange = (key: keyof typeof roofValues) => (checked: boolean) => {
    setRoofValues(prev => ({
      ...prev,
      [key]: { ...prev[key], isChecked: checked }
    }));
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
          <div className="bg-black text-white p-2 text-center">
            Для расчета сметы ввести значения
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <span>Проект А-</span>
              <input
                type="text"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                className="w-16 ml-2 px-2 py-1 border rounded"
                disabled={!isEditing}
              />
            </div>
            <div>
              <span>1-ый эт.</span>
              <input
                type="text"
                value={firstFloorHeight}
                onChange={(e) => setFirstFloorHeight(e.target.value)}
                className="w-24 ml-2 px-2 py-1 border rounded"
                disabled={!isEditing}
              />
            </div>
            <div>
              <span>Кол-во эт.</span>
              <select
                value={floors}
                onChange={(e) => onFloorsChange(e.target.value)}
                className="w-24 ml-2 px-2 py-1 border rounded"
                disabled={!isEditing}
              >
                <option value="1">1 эт</option>
                <option value="2 эт">2 эт</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <EstimateTable
              title="Фундамент"
              rows={[
                { label: 'Периметр фундам', value: foundationValues.perimeter.value, isChecked: foundationValues.perimeter.isChecked, onChange: handleFoundationChange('perimeter'), onCheckChange: handleFoundationCheckChange('perimeter') },
                { label: 'Кол-во свай', value: foundationValues.pilesCount.value, isChecked: foundationValues.pilesCount.isChecked, onChange: handleFoundationChange('pilesCount'), onCheckChange: handleFoundationCheckChange('pilesCount') },
                { label: 'м2 засыпки', value: foundationValues.backfillArea.value, isChecked: foundationValues.backfillArea.isChecked, onChange: handleFoundationChange('backfillArea'), onCheckChange: handleFoundationCheckChange('backfillArea') },
                { label: 'Труба 80x80 в метр', value: foundationValues.pipeLength.value, isChecked: foundationValues.pipeLength.isChecked, onChange: handleFoundationChange('pipeLength'), onCheckChange: handleFoundationCheckChange('pipeLength') },
                { label: 'СИП стены', value: '', isHeader: true },
                { label: 'общая м2 СИП 2,5м', value: foundationValues.sip25Area.value, isChecked: foundationValues.sip25Area.isChecked, onChange: handleFoundationChange('sip25Area'), onCheckChange: handleFoundationCheckChange('sip25Area') },
                { label: 'общая м2 СИП 2,8м', value: foundationValues.sip28Area.value, isChecked: foundationValues.sip28Area.isChecked, onChange: handleFoundationChange('sip28Area'), onCheckChange: handleFoundationCheckChange('sip28Area') }
              ]}
              isEditing={isEditing}
            />

            <EstimateTable
              title="Пиломатериал"
              rows={[
                { label: '40x14 стены в метрах', value: lumberValues.walls40x14.value, isChecked: lumberValues.walls40x14.isChecked, unit: 'м.', onChange: handleLumberChange('walls40x14'), onCheckChange: handleLumberCheckChange('walls40x14') },
                { label: '40x14 Крыша в метрах', value: lumberValues.roof40x14.value, isChecked: lumberValues.roof40x14.isChecked, unit: 'м.', onChange: handleLumberChange('roof40x14'), onCheckChange: handleLumberCheckChange('roof40x14') },
                { label: '40x14 Черд перекр в метрах', value: lumberValues.attic40x14.value, isChecked: lumberValues.attic40x14.isChecked, unit: 'м.', onChange: handleLumberChange('attic40x14'), onCheckChange: handleLumberCheckChange('attic40x14') },
                { label: '40x19 перекрытие в метрах', value: lumberValues.floor40x19.value, isChecked: lumberValues.floor40x19.isChecked, unit: 'м.', onChange: handleLumberChange('floor40x19'), onCheckChange: handleLumberCheckChange('floor40x19') },
                { label: '40x19 ригель в метрах', value: lumberValues.beam40x19.value, isChecked: lumberValues.beam40x19.isChecked, unit: 'м.', onChange: handleLumberChange('beam40x19'), onCheckChange: handleLumberCheckChange('beam40x19') },
                { label: '20x9 обрешетка в метрах', value: lumberValues.lathing20x9.value, isChecked: lumberValues.lathing20x9.isChecked, unit: 'м.', onChange: handleLumberChange('lathing20x9'), onCheckChange: handleLumberCheckChange('lathing20x9') },
                { label: 'Перекр + Потолок + Франтон', value: '', isHeader: true },
                { label: 'м2 межэтажн перекрытия', value: lumberValues.floorArea.value, isChecked: lumberValues.floorArea.isChecked, onChange: handleLumberChange('floorArea'), onCheckChange: handleLumberCheckChange('floorArea') },
                { label: 'м2 чердачного перекрытия', value: lumberValues.atticArea.value, isChecked: lumberValues.atticArea.isChecked, onChange: handleLumberChange('atticArea'), onCheckChange: handleLumberCheckChange('atticArea') },
                { label: 'м2 франтона', value: lumberValues.frontonArea.value, isChecked: lumberValues.frontonArea.isChecked, onChange: handleLumberChange('frontonArea'), onCheckChange: handleLumberCheckChange('frontonArea') },
                { label: 'ГКЛ перегородки', value: '', isHeader: true },
                { label: 'м2 межк стен', value: lumberValues.gklWallsArea.value, isChecked: lumberValues.gklWallsArea.isChecked, onChange: handleLumberChange('gklWallsArea'), onCheckChange: handleLumberCheckChange('gklWallsArea') },
                { label: 'Длина межк стен', value: lumberValues.gklWallsLength.value, isChecked: lumberValues.gklWallsLength.isChecked, onChange: handleLumberChange('gklWallsLength'), onCheckChange: handleLumberCheckChange('gklWallsLength') },
                { label: 'С/У 1эт длина вн стен', value: lumberValues.firstFloorWallsLength.value, isChecked: lumberValues.firstFloorWallsLength.isChecked, onChange: handleLumberChange('firstFloorWallsLength'), onCheckChange: handleLumberCheckChange('firstFloorWallsLength') },
                { label: 'С/У 2эт длина вн стен', value: lumberValues.secondFloorWallsLength.value, isChecked: lumberValues.secondFloorWallsLength.isChecked, onChange: handleLumberChange('secondFloorWallsLength'), onCheckChange: handleLumberCheckChange('secondFloorWallsLength') },
                { label: 'Профиль для перег', value: lumberValues.partitionProfile.value, isChecked: lumberValues.partitionProfile.isChecked, onChange: handleLumberChange('partitionProfile'), onCheckChange: handleLumberCheckChange('partitionProfile') }
              ]}
              isEditing={isEditing}
            />

            <EstimateTable
              title="Крыша"
              rows={[
                { label: 'Мет. Череп м2', value: roofValues.metalTileArea.value, isChecked: roofValues.metalTileArea.isChecked, onChange: handleRoofChange('metalTileArea'), onCheckChange: handleRoofCheckChange('metalTileArea') },
                { label: 'Длина коньков', value: roofValues.ridgeLength.value, isChecked: roofValues.ridgeLength.isChecked, unit: 'м.', onChange: handleRoofChange('ridgeLength'), onCheckChange: handleRoofCheckChange('ridgeLength') },
                { label: 'Длина вн ендов', value: roofValues.endowLength.value, isChecked: roofValues.endowLength.isChecked, unit: 'м.', onChange: handleRoofChange('endowLength'), onCheckChange: handleRoofCheckChange('endowLength') },
                { label: 'Заглушка конусная', value: roofValues.conicPlug.value, isChecked: roofValues.conicPlug.isChecked, onChange: handleRoofChange('conicPlug'), onCheckChange: handleRoofCheckChange('conicPlug') },
                { label: 'Тройник', value: roofValues.tee.value, isChecked: roofValues.tee.isChecked, onChange: handleRoofChange('tee'), onCheckChange: handleRoofCheckChange('tee') },
                { label: 'Планка примык к стене', value: roofValues.wallPlank.value, isChecked: roofValues.wallPlank.isChecked, onChange: handleRoofChange('wallPlank'), onCheckChange: handleRoofCheckChange('wallPlank') },
                { label: 'Паропленка под обреш', value: roofValues.vaporBarrier.value, isChecked: roofValues.vaporBarrier.isChecked, onChange: handleRoofChange('vaporBarrier'), onCheckChange: handleRoofCheckChange('vaporBarrier') },
                { label: 'Паропленка пот 2 эт.', value: roofValues.steamBarrier2.value, isChecked: roofValues.steamBarrier2.isChecked, onChange: handleRoofChange('steamBarrier2'), onCheckChange: handleRoofCheckChange('steamBarrier2') },
                { label: 'Конек бочкообразный', value: roofValues.barrelRidge.value, isChecked: roofValues.barrelRidge.isChecked, unit: 'м.', onChange: handleRoofChange('barrelRidge'), onCheckChange: handleRoofCheckChange('barrelRidge') },
                { label: 'Ендова Внешняя', value: roofValues.externalEndow.value, isChecked: roofValues.externalEndow.isChecked, onChange: handleRoofChange('externalEndow'), onCheckChange: handleRoofCheckChange('externalEndow') },
                { label: 'Ендова Внутренняя', value: roofValues.internalEndow.value, isChecked: roofValues.internalEndow.isChecked, onChange: handleRoofChange('internalEndow'), onCheckChange: handleRoofCheckChange('internalEndow') },
                { label: 'Разное', value: '', isHeader: true },
                { label: 'ЗП строителям', value: roofValues.builderSalary.value, isChecked: roofValues.builderSalary.isChecked, onChange: handleRoofChange('builderSalary'), onCheckChange: handleRoofCheckChange('builderSalary') },
                { label: 'Цена по договору', value: roofValues.contractPrice.value, isChecked: roofValues.contractPrice.isChecked, onChange: handleRoofChange('contractPrice'), onCheckChange: handleRoofCheckChange('contractPrice') }
              ]}
              isEditing={isEditing}
            />
          </div>
        </div>
      )}
    </div>
  );
};