const transliterationMap: { [key: string]: string } = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
  'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
  'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
  'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
  'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
  'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
  'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
  'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

export function transliterate(text: string): string {
  return text.split('').map(char => transliterationMap[char] || char).join('');
}

// Функция для получения безопасного имени файла
export function getSafeFileName(originalName: string): string {
  const nameParts = originalName.split('.');
  const ext = nameParts.pop(); // Получаем расширение
  const nameWithoutExt = nameParts.join('.'); // Получаем имя без расширения
  
  // Транслитерируем имя и заменяем оставшиеся небезопасные символы на _
  const safeNameWithoutExt = transliterate(nameWithoutExt)
    .replace(/[^a-zA-Z0-9-]/g, '_')
    .replace(/_+/g, '_') // Заменяем множественные _ на один
    .replace(/^_|_$/g, ''); // Убираем _ в начале и конце
    
  return ext ? `${safeNameWithoutExt}.${ext}` : safeNameWithoutExt;
}
