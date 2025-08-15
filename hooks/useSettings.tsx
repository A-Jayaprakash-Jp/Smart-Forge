import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Theme } from '../types';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem('disa-theme') as Theme;
      return savedTheme || 'dark'; // Default to dark theme
    } catch {
      return 'dark';
    }
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('disa-theme', newTheme);
      document.body.className = newTheme;
    } catch (error) {
      console.error("Could not save theme to localStorage", error);
    }
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
