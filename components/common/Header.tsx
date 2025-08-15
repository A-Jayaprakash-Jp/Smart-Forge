import React, { useState } from 'react';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useSettings } from '../../hooks/useSettings';
import { useProductionData } from '../../hooks/useProductionData';
import { useMessagingData } from '../../hooks/useMessagingData';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { SunIcon, MoonIcon, Bars3Icon, CloudArrowUpIcon, CheckCircleIcon, SignalSlashIcon, ExclamationCircleIcon, CircleStackIcon, MagnifyingGlassIcon, ClockIcon } from './Icons';
import GlobalSearch from './GlobalSearch';

const ApiSyncIndicator: React.FC = () => {
    const { syncStatus: prodSyncStatus, syncQueue: prodQueue } = useProductionData();
    const { syncStatus: msgSyncStatus, syncQueue: msgQueue } = useMessagingData();
    const { isOnline } = useOnlineStatus();

    const totalPendingItems = prodQueue.length + msgQueue.length;

    let status: 'synced' | 'syncing' | 'pending' | 'offline' | 'error' = 'synced';
    
    if (!isOnline) {
        status = 'offline';
    } else if (prodSyncStatus === 'error' || msgSyncStatus === 'error') {
        status = 'error';
    } else if (prodSyncStatus === 'syncing' || msgSyncStatus === 'syncing') {
        status = 'syncing';
    } else if (totalPendingItems > 0) {
        status = 'pending';
    }

    const getStatusText = () => {
        switch (status) {
            case 'syncing':
                return `Syncing (${totalPendingItems})...`;
            case 'pending':
                return `Pending Sync (${totalPendingItems})`;
            case 'synced':
                return 'All Synced';
            case 'offline':
                return `Offline ${totalPendingItems > 0 ? `(${totalPendingItems} pending)` : ''}`;
            case 'error':
                return `Sync Error ${totalPendingItems > 0 ? `(${totalPendingItems} items)` : ''}`;
            default:
                return 'API Status';
        }
    };

    const statusInfo = {
        syncing: { icon: CloudArrowUpIcon, text: getStatusText(), color: 'text-disa-accent-blue', animation: 'animate-pulse' },
        pending: { icon: ClockIcon, text: getStatusText(), color: 'text-disa-accent-yellow', animation: 'animate-pulse' },
        synced: { icon: CheckCircleIcon, text: getStatusText(), color: 'text-disa-accent-green', animation: '' },
        offline: { icon: SignalSlashIcon, text: getStatusText(), color: 'text-gray-500', animation: '' },
        error: { icon: ExclamationCircleIcon, text: getStatusText(), color: 'text-disa-red', animation: '' },
    };
    
    const current = statusInfo[status];
    const Icon = current.icon;

    return (
        <div className="flex items-center gap-2" title={current.text}>
            <Icon className={`w-6 h-6 ${current.color} ${current.animation}`} />
            <span className={`hidden text-sm font-semibold sm:block ${current.color}`}>{current.text}</span>
        </div>
    );
}

const MongoDbIndicator: React.FC = () => {
    const { mongoStatus } = useOnlineStatus();
    const statusInfo = {
        connecting: { icon: CircleStackIcon, text: 'DB Connecting', color: 'text-disa-accent-yellow', animation: 'animate-pulse' },
        connected: { icon: CircleStackIcon, text: 'DB Connected', color: 'text-disa-accent-green', animation: '' },
        disconnected: { icon: CircleStackIcon, text: 'DB Disconnected', color: 'text-gray-500', animation: '' },
        error: { icon: CircleStackIcon, text: 'DB Error', color: 'text-disa-red', animation: '' },
    };
    
    const current = statusInfo[mongoStatus];
    const Icon = current.icon;

    return (
        <div className="flex items-center gap-2" title={current.text}>
            <Icon className={`w-6 h-6 ${current.color} ${current.animation}`} />
            <span className={`hidden text-sm font-semibold sm:block ${current.color}`}>{current.text}</span>
        </div>
    );
};


interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  setCurrentPage: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick, setCurrentPage }) => {
  const { appName, appLogo } = useAppSettings();
  const { theme, setTheme } = useSettings();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      <GlobalSearch isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} setCurrentPage={setCurrentPage} />
      <header className="flex items-center justify-between flex-shrink-0 h-16 px-4 md:px-6 bg-white/5 dark:bg-black/5 backdrop-blur-md border-b border-disa-light-border dark:border-disa-dark-border">
        <div className="flex items-center flex-1 min-w-0 gap-4">
          <button 
            onClick={onMenuClick}
            className="p-2 text-gray-600 rounded-full md:hidden dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          {appLogo && <img src={appLogo} alt="App Logo" className="hidden h-10 w-10 object-contain md:block" />}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate dark:text-white whitespace-nowrap">{title}</h1>
            <p className="text-xs text-gray-500 truncate dark:text-gray-400 whitespace-nowrap">{appName}</p>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0 gap-2 sm:gap-4">
          <div className="items-center hidden gap-4 p-2 rounded-lg lg:flex bg-gray-500/5">
              <ApiSyncIndicator />
              <div className="h-6 w-px bg-gray-500/20"></div>
              <MongoDbIndicator />
          </div>
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-gray-600 transition-colors rounded-full dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Global Search"
          >
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={toggleTheme} 
            className="p-2 text-gray-600 transition-colors rounded-full dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;