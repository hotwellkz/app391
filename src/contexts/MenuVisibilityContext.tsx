import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MenuVisibilityContextType {
  isMenuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
}

const MenuVisibilityContext = createContext<MenuVisibilityContextType | undefined>(undefined);

export const useMenuVisibility = () => {
  const context = useContext(MenuVisibilityContext);
  if (!context) {
    throw new Error('useMenuVisibility must be used within a MenuVisibilityProvider');
  }
  return context;
};

interface MenuVisibilityProviderProps {
  children: ReactNode;
}

export const MenuVisibilityProvider: React.FC<MenuVisibilityProviderProps> = ({ children }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(true);

  const setMenuVisible = (visible: boolean) => {
    setIsMenuVisible(visible);
  };

  return (
    <MenuVisibilityContext.Provider value={{ isMenuVisible, setMenuVisible }}>
      {children}
    </MenuVisibilityContext.Provider>
  );
}; 