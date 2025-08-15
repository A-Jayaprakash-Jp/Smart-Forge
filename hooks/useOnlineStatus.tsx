
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type MongoStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface OnlineStatusContextType {
  isOnline: boolean;
  mongoStatus: MongoStatus;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export const OnlineStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [mongoStatus, setMongoStatus] = useState<MongoStatus>('connecting');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    if (!isOnline) {
      setMongoStatus('disconnected');
      return;
    }

    // When coming back online, or on initial load
    if (mongoStatus === 'disconnected' || mongoStatus === 'connecting') {
        const initialConnectTimer = setTimeout(() => {
            setMongoStatus('connected');
        }, 2500); // Simulate initial connection time
        return () => clearTimeout(initialConnectTimer);
    }
  }, [isOnline, mongoStatus]);

  useEffect(() => {
      if(mongoStatus !== 'connected') return;

      // Simulate intermittent connection issues only when connected
      const interval = setInterval(() => {
        const random = Math.random();
        if (random > 0.95) { // 5% chance of error
            setMongoStatus('error');
            const recoveryTimer = setTimeout(() => setMongoStatus('connected'), 5000); // Recover after 5s
            return () => clearTimeout(recoveryTimer);
        }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);

  }, [mongoStatus])

  return (
    <OnlineStatusContext.Provider value={{ isOnline, mongoStatus }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = (): OnlineStatusContextType => {
  const context = useContext(OnlineStatusContext);
  if (context === undefined) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }
  return context;
};