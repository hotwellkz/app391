import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EstimateValues } from '../types/estimate';

const initialEstimateValues = {
  value: 0,
  isChecked: false
};

export const useEstimateData = (clientId: string, isEditing: boolean) => {
  const [projectNumber, setProjectNumber] = useState('0');
  const [floors, setFloors] = useState('1');
  const [firstFloorHeight, setFirstFloorHeight] = useState('2,5 м.');
  const [secondFloorHeight, setSecondFloorHeight] = useState('2,5 м.');
  const [isProjectNumberChecked, setIsProjectNumberChecked] = useState(false);
  const [isFloorsChecked, setIsFloorsChecked] = useState(false);
  const [isFirstFloorHeightChecked, setIsFirstFloorHeightChecked] = useState(false);
  const [isSecondFloorHeightChecked, setIsSecondFloorHeightChecked] = useState(false);

  const [foundationValues, setFoundationValues] = useState<EstimateValues>({
    perimeter: initialEstimateValues,
    pilesCount: initialEstimateValues,
    backfillArea: initialEstimateValues,
    pipeLength: initialEstimateValues,
    sip25Area: initialEstimateValues,
    sip28Area: initialEstimateValues
  });

  const [lumberValues, setLumberValues] = useState<EstimateValues>({
    walls40x14: initialEstimateValues,
    roof40x14: initialEstimateValues,
    attic40x14: initialEstimateValues,
    floor40x19: initialEstimateValues,
    beam40x19: initialEstimateValues,
    lathing20x9: initialEstimateValues,
    floorArea: initialEstimateValues,
    atticArea: initialEstimateValues,
    frontonArea: initialEstimateValues,
    gklWallsArea: initialEstimateValues,
    gklWallsLength: initialEstimateValues,
    firstFloorWallsLength: initialEstimateValues,
    secondFloorWallsLength: initialEstimateValues,
    partitionProfile: initialEstimateValues
  });

  const [roofValues, setRoofValues] = useState<EstimateValues>({
    metalTileArea: initialEstimateValues,
    ridgeLength: initialEstimateValues,
    endowLength: initialEstimateValues,
    conicPlug: initialEstimateValues,
    tee: initialEstimateValues,
    wallPlank: initialEstimateValues,
    vaporBarrier: initialEstimateValues,
    steamBarrier2: initialEstimateValues,
    barrelRidge: initialEstimateValues,
    externalEndow: initialEstimateValues,
    internalEndow: initialEstimateValues,
    builderSalary: initialEstimateValues,
    contractPrice: initialEstimateValues
  });

  useEffect(() => {
    const loadEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'estimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          const data = estimateDoc.data();
          setProjectNumber(data.projectNumber || '0');
          setFloors(data.floors || '1');
          setFirstFloorHeight(data.firstFloorHeight || '2,5 м.');
          setSecondFloorHeight(data.secondFloorHeight || '2,5 м.');
          setIsProjectNumberChecked(data.isProjectNumberChecked || false);
          setIsFloorsChecked(data.isFloorsChecked || false);
          setIsFirstFloorHeightChecked(data.isFirstFloorHeightChecked || false);
          setIsSecondFloorHeightChecked(data.isSecondFloorHeightChecked || false);
          
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
          floors,
          firstFloorHeight,
          secondFloorHeight,
          isProjectNumberChecked,
          isFloorsChecked,
          isFirstFloorHeightChecked,
          isSecondFloorHeightChecked,
          foundationValues,
          lumberValues,
          roofValues,
          updatedAt: serverTimestamp()
        });
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
    floors,
    firstFloorHeight,
    secondFloorHeight,
    isProjectNumberChecked,
    isFloorsChecked,
    isFirstFloorHeightChecked,
    isSecondFloorHeightChecked,
    foundationValues,
    lumberValues,
    roofValues
  ]);

  const handleProjectNumberChange = (value: string) => setProjectNumber(value);
  const handleFloorsChange = (value: string) => setFloors(value);
  const handleFirstFloorHeightChange = (value: string) => setFirstFloorHeight(value);
  const handleSecondFloorHeightChange = (value: string) => setSecondFloorHeight(value);
  const handleProjectNumberCheckChange = (checked: boolean) => setIsProjectNumberChecked(checked);
  const handleFloorsCheckChange = (checked: boolean) => setIsFloorsChecked(checked);
  const handleFirstFloorHeightCheckChange = (checked: boolean) => setIsFirstFloorHeightChecked(checked);
  const handleSecondFloorHeightCheckChange = (checked: boolean) => setIsSecondFloorHeightChecked(checked);

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

  return {
    projectNumber,
    floors,
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
    handleFloorsChange,
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
  };
};