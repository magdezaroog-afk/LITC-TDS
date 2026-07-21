import React, { createContext, useContext, useState } from 'react';

export interface WindowContextType {
  activeWindows: string[];
  toggleWindow: (windowId: string) => void;
  closeWindow: (windowId: string) => void;
  closeAllWindows: () => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWindows, setActiveWindows] = useState<string[]>([]);

  const toggleWindow = (windowId: string) => {
    setActiveWindows(prev => 
      prev.includes(windowId) ? prev.filter(id => id !== windowId) : [...prev, windowId]
    );
  };

  const closeWindow = (windowId: string) => {
    setActiveWindows(prev => prev.filter(id => id !== windowId));
  };

  const closeAllWindows = () => {
    setActiveWindows([]);
  };

  return (
    <WindowContext.Provider value={{ activeWindows, toggleWindow, closeWindow, closeAllWindows }}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowContext);
  if (!context) throw new Error('useWindowManager must be used within WindowProvider');
  return context;
};
