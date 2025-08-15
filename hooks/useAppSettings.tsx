import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';

interface AppSettingsContextType extends AppSettings {
  setAppName: (name: string) => void;
  setAppLogo: (logo: string | null) => void;
}

const DEFAULT_APP_NAME = "Smart Forge";
const DEFAULT_APP_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0M4MTAyRSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzNiODJmNiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIiBmaWxsPSJ1cmwoI2cpIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNSwgNSkiPjxwYXRoIGQ9Ik0gMzAsMTUgQyAxNSwxNSAxNSw3NSAzMCw3NSBMIDQ1LDc1IEwgNDUsMTUgWiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik0gNDUsMTUgTCA0NSw3NSBMIDcwLDc1IEMgNzAsNzUgODUsNTAgNzAsMTUgWiIgZmlsbD0iI0ZGRiIvPjxjaXJjbGUgY3g9IjM3LjUiIGN5PSI0NSIgcj0iMTAiIGZpbGw9IiMxMTE4MjciLz48L2c+PC9zdmc+";

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appName, setAppNameState] = useState<string>(() => {
    try {
      return localStorage.getItem('disa-appName') || DEFAULT_APP_NAME;
    } catch {
      return DEFAULT_APP_NAME;
    }
  });

  const [appLogo, setAppLogoState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('disa-appLogo') || DEFAULT_APP_LOGO;
    } catch {
      return DEFAULT_APP_LOGO;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('disa-appName', appName);
    } catch (error) {
      console.error("Could not save appName to localStorage", error);
    }
  }, [appName]);

  useEffect(() => {
    try {
      if (appLogo) {
        localStorage.setItem('disa-appLogo', appLogo);
      } else {
        localStorage.removeItem('disa-appLogo');
      }
    } catch (error) {
      console.error("Could not save appLogo to localStorage", error);
    }
  }, [appLogo]);
  
  const setAppName = useCallback((name: string) => setAppNameState(name), []);
  const setAppLogo = useCallback((logo: string | null) => setAppLogoState(logo), []);

  return (
    <AppSettingsContext.Provider value={{ appName, appLogo, setAppName, setAppLogo }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};