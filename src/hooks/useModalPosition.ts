import { useState, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

export const useModalPosition = (initialPosition: Position, menuWidth: number = 200, menuHeight: number = 150) => {
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    const updatePosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let { x, y } = initialPosition;

      // Проверяем правую границу
      if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 10;
      }

      // Проверяем левую границу
      if (x < 10) {
        x = 10;
      }

      // Проверяем нижнюю границу
      if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 10;
      }

      // Проверяем верхнюю границу
      if (y < 10) {
        y = 10;
      }

      setPosition({ x, y });
    };

    updatePosition();

    // Обновляем позицию при изменении размера окна
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [initialPosition, menuWidth, menuHeight]);

  return position;
};