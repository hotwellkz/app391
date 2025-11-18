// Утилита для подготовки данных сметы перед сохранением
export const prepareEstimateForSave = (data: any) => {
  // Создаем новый объект без циклических ссылок
  const cleanData = JSON.parse(JSON.stringify(data));
  
  // Удаляем undefined значения
  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  });

  return cleanData;
};