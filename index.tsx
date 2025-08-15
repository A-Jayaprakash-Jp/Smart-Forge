import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './hooks/useSettings';
import { AppSettingsProvider } from './hooks/useAppSettings';
import { OnlineStatusProvider } from './hooks/useOnlineStatus';
import { UserProvider } from './hooks/useUsers';
import { TeamProvider } from './hooks/useTeams';
import { NotificationProvider } from './hooks/useNotifications';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SettingsProvider>
      <AppSettingsProvider>
        <OnlineStatusProvider>
          <UserProvider>
            <TeamProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </TeamProvider>
          </UserProvider>
        </OnlineStatusProvider>
      </AppSettingsProvider>
    </SettingsProvider>
  </React.StrictMode>
);