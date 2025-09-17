import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DropdownState {
  activeDropdown: string | null;
  position: { x: number; y: number };
}

interface DropdownManagerContextType {
  activeDropdown: string | null;
  position: { x: number; y: number };
  openDropdown: (id: string, position: { x: number; y: number }) => void;
  closeDropdown: (id?: string) => void;
  isDropdownOpen: (id: string) => boolean;
}

const DropdownManagerContext = createContext<DropdownManagerContextType | null>(null);

export const useDropdownManager = () => {
  const context = useContext(DropdownManagerContext);
  if (!context) {
    throw new Error('useDropdownManager must be used within a DropdownManagerProvider');
  }
  return context;
};

interface DropdownManagerProviderProps {
  children: ReactNode;
}

export const DropdownManagerProvider: React.FC<DropdownManagerProviderProps> = ({ children }) => {
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    activeDropdown: null,
    position: { x: 0, y: 0 }
  });

  const openDropdown = useCallback((id: string, position: { x: number; y: number }) => {
    setDropdownState({
      activeDropdown: id,
      position
    });
  }, []);

  const closeDropdown = useCallback((id?: string) => {
    setDropdownState(prev => {
      // 如果指定了 id，只有当前活动的下拉菜单是这个 id 时才关闭
      if (id && prev.activeDropdown !== id) {
        return prev;
      }
      return {
        activeDropdown: null,
        position: { x: 0, y: 0 }
      };
    });
  }, []);

  const isDropdownOpen = useCallback((id: string) => {
    return dropdownState.activeDropdown === id;
  }, [dropdownState.activeDropdown]);

  const value: DropdownManagerContextType = {
    activeDropdown: dropdownState.activeDropdown,
    position: dropdownState.position,
    openDropdown,
    closeDropdown,
    isDropdownOpen
  };

  return (
    <DropdownManagerContext.Provider value={value}>
      {children}
    </DropdownManagerContext.Provider>
  );
};