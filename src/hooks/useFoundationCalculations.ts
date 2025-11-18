import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FoundationValues {
  pilesCount: { value: number };
  perimeter: { value: number };
  backfillArea: { value: number };
  pipeLength: { value: number };
}

interface CalculationResults {
  foundationConcreteQuantity: number;
  screedConcreteQuantity: number;
  totalConcreteQuantity: number;
  meshQuantity: number;
  armatureQuantity: number;
  wireQuantity: number;
  pipeLength: number;
  pgsKamazQuantity: number;
  pgsHowoQuantity: number;
  bindingWireQuantity: number;
  tieWireQuantity: number;
  nailsQuantity: number;
  underlayQuantity: number;
  heatedFloorQuantity: number;
}

export const useFoundationCalculations = (clientId: string) => {
  const [calculations, setCalculations] = useState<CalculationResults>({
    foundationConcreteQuantity: 0,
    screedConcreteQuantity: 0,
    totalConcreteQuantity: 0,
    meshQuantity: 0,
    armatureQuantity: 0,
    wireQuantity: 0,
    pipeLength: 0,
    pgsKamazQuantity: 0,
    pgsHowoQuantity: 0,
    bindingWireQuantity: 0,
    tieWireQuantity: 0,
    nailsQuantity: 0,
    underlayQuantity: 0,
    heatedFloorQuantity: 0
  });

  useEffect(() => {
    const estimateBlockRef = doc(db, 'estimates', clientId);
    
    const unsubscribe = onSnapshot(estimateBlockRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const values = data.foundationValues as FoundationValues;

        const pilesCount = values.pilesCount.value || 0;
        const perimeter = values.perimeter.value || 0;
        const backfillArea = values.backfillArea.value || 0;
        const pipeLength = values.pipeLength.value || 0;

        // Расчет бетона для фундамента
        const foundationConcreteQuantity = (0.09 * pilesCount) + (0.18 * perimeter);
        // Расчет бетона для стяжки
        const screedConcreteQuantity = (0.06 * backfillArea);
        // Общий объем бетона
        const totalConcreteQuantity = foundationConcreteQuantity + screedConcreteQuantity;

        // Расчет количества сетки с учетом запаса 30%
        const meshQuantity = Math.ceil((backfillArea * 1.3) / 1.92);

        // Расчет количества арматуры
        const armatureQuantity = Math.ceil((6 * pilesCount) + (4 * perimeter) + 60);

        // Расчет количества проволоки (13% от количества арматуры)
        const wireQuantity = Math.ceil(armatureQuantity * 0.13);

        // Расчет количества вязальной проволоки (0.087 * периметр)
        const bindingWireQuantity = Math.ceil(perimeter * 0.087);

        // Расчет количества вязальной проволоки для связки (0.125 * периметр)
        const tieWireQuantity = Math.ceil(perimeter * 0.125);

        // Расчет количества ПГС Камаз
        const pgsKamazQuantity = Math.ceil((backfillArea * 0.5) / 7);

        // Расчет количества ПГС Howo
        const pgsHowoQuantity = Math.ceil((backfillArea * 0.5) / 15);

        // Расчет количества гвоздей (0.12 * периметр)
        const nailsQuantity = Math.ceil(perimeter * 0.12);

        // Расчет количества подложки (площадь засыпки / 50)
        const underlayQuantity = Math.ceil(backfillArea / 50);

        // Расчет количества теплого пола (площадь засыпки / 50)
        const heatedFloorQuantity = Math.ceil(backfillArea / 50);

        setCalculations({
          foundationConcreteQuantity,
          screedConcreteQuantity,
          totalConcreteQuantity,
          meshQuantity,
          armatureQuantity,
          wireQuantity,
          pipeLength,
          pgsKamazQuantity,
          pgsHowoQuantity,
          bindingWireQuantity,
          tieWireQuantity,
          nailsQuantity,
          underlayQuantity,
          heatedFloorQuantity
        });
      }
    });

    return () => unsubscribe();
  }, [clientId]);

  return calculations;
};