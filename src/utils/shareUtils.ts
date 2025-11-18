export const shareContent = async (title: string, text: string) => {
  // Проверяем поддержку Web Share API
  if (navigator.share && navigator.canShare) {
    try {
      await navigator.share({
        title,
        text
      });
      return true;
    } catch (error) {
      console.log('Web Share API not supported, falling back to clipboard');
    }
  }

  // Если Web Share API не поддерживается, копируем в буфер обмена
  try {
    await navigator.clipboard.writeText(`${title}\n\n${text}`);
    alert('Текст скопирован в буфер обмена');
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};