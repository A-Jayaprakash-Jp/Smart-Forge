import React from 'react';
import { User, FontPreference } from './types';
import { DataProvider, useProductionData } from './hooks/useProductionData';
import { useSettings } from './hooks/useSettings';
import { useAppSettings } from './hooks/useAppSettings';
import LoginScreen from './LoginScreen';
import AdminLoginScreen from './AdminLoginScreen';
import AdminView from './views/AdminView';
import MainLayout from './views/MainLayout';
import { MessagingDataProvider } from './hooks/useMessagingData';
import { motion } from 'framer-motion';
import { Cog6ToothIcon } from './components/common/Icons';
import { RealtimeDataProvider } from './hooks/useRealtimeData';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useNotifications } from './hooks/useNotifications';
import OnboardingScreen from './components/OnboardingScreen';

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';

const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
        >
            <Cog6ToothIcon className="w-16 h-16 text-disa-red" />
        </motion.div>
        <motion.p 
            className="mt-4 text-lg font-semibold"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
            {message}
        </motion.p>
    </div>
);

const AppContent: React.FC = () => {
  const { isLoading, loadingMessage } = useProductionData();
  const { theme } = useSettings();
  const { appName } = useAppSettings();
  const { addNotification } = useNotifications();
  
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [showAdminLogin, setShowAdminLogin] = React.useState(false);
  const [hasOnboarded, setHasOnboarded] = React.useState(() => {
    try {
      return localStorage.getItem('disa-onboarded') === 'true';
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    document.title = appName;
  }, [appName]);

  React.useEffect(() => {
    const initNativeFeatures = async () => {
        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide();
          PushNotifications.addListener('registration', (token: Token) => {
            console.log('Push registration success, token:', token.value);
          });
          PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Error on registration:', JSON.stringify(error));
          });
          PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            addNotification({
              title: notification.title || 'New Notification',
              message: notification.body || '',
              type: 'info'
            });
          });
        }
    };
    if (!isLoading) {
      initNativeFeatures();
    }
  }, [isLoading, addNotification]);

  React.useEffect(() => {
    document.body.className = `${theme}`;
    if (Capacitor.isNativePlatform()) {
        StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
        const statusBarColor = theme === 'dark' ? '#111827' : '#ffffff';
        StatusBar.setBackgroundColor({ color: statusBarColor });
    }
    if (currentUser?.fontPreference) {
      const fontName = currentUser.fontPreference;
      const monoFonts: FontPreference[] = ['Roboto Mono', 'Source Code Pro'];
      const fallback = monoFonts.includes(fontName) ? 'monospace' : 'sans-serif';
      document.body.style.fontFamily = `'${fontName}', ${fallback}`;
    } else {
      document.body.style.fontFamily = 'Inter, sans-serif';
    }
    
    if (currentUser?.fontSize) {
      document.documentElement.style.fontSize = `${currentUser.fontSize}px`;
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  }, [theme, currentUser]);


  // When a user logs in, check if admin and set both currentUser and isAdmin
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAdmin(user.role === 'Admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setShowAdminLogin(false);
  };

  const handleOnboardingComplete = () => {
    try {
        localStorage.setItem('disa-onboarded', 'true');
    } catch (error) {
        console.error("Could not save onboarding status to localStorage", error);
    }
    setHasOnboarded(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingScreen message={loadingMessage} />;
    }
    if (!hasOnboarded) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }
    if (showAdminLogin) {
      return <AdminLoginScreen onAdminLogin={() => { setIsAdmin(true); setShowAdminLogin(false); }} />;
    }
    if (isAdmin) {
      return <AdminView onLogout={handleLogout} />;
    }
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }
    // If user is not admin, ensure correct dashboard is shown based on role
    // This is handled by MainLayout, but ensure currentUser is set correctly
    return (
      <RealtimeDataProvider>
        <MessagingDataProvider initialMessages={[]}> 
          <MainLayout 
            user={currentUser} 
            onLogout={handleLogout}
            onCurrentUserUpdate={setCurrentUser}
          />
        </MessagingDataProvider>
      </RealtimeDataProvider>
    );
  };

  return (
      <div className="min-h-screen bg-disa-light-bg dark:bg-disa-dark-bg text-gray-800 dark:text-gray-100 selection:bg-disa-red/30">
          <div className="gradient-bg transition-opacity duration-500"></div>
          {renderContent()}
      </div>
  );
}


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ErrorBoundary>
  );
};

export default App;