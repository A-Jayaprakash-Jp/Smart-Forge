import React, { useState } from 'react';
import { User, Role } from '../../types';
import { 
    ChartPieIcon, 
    Cog6ToothIcon, 
    ArrowLeftOnRectangleIcon,
    ShieldCheckIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    ChevronDownIcon,
    ArchiveBoxIcon,
    DocumentChartBarIcon,
    UsersIcon,
    CpuChipIcon,
    SparklesIcon,
    DocumentTextIcon,
    BellAlertIcon,
    WrenchScrewdriverIcon,
    BeakerIcon,
    ExclamationTriangleIcon,
    PlusCircleIcon,
    FolderIcon,
    GanttChartIcon,
    CubeIcon,
    RecycleIcon,
    TableCellsIcon,
    EnergyIcon,
} from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSettings } from '../../hooks/useAppSettings';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
    user: User;
    onLogout: () => void;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onAiAssistantClick: () => void;
    isAdmin: boolean;
}

const NavItem: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
    <motion.button
        onClick={onClick}
        className={`flex items-center w-full text-left transition-colors duration-200 rounded-lg pl-10 pr-4 py-2 text-sm ${
            isActive
                ? 'bg-disa-red text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
        }`}
        whileHover={{ scale: isActive ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <Icon className="w-5 h-5 mr-3" />
        <span className="font-semibold">{label}</span>
    </motion.button>
);


const NavGroup: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold tracking-wider text-gray-500 uppercase transition-colors dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                {title}
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-1 pl-2 pr-1 space-y-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, currentPage, setCurrentPage, isOpen, setIsOpen, onAiAssistantClick, isAdmin }) => {
    const { appName, appLogo } = useAppSettings();
    const permissions = usePermissions(user);

    const mainNav = [
        // Common
        { id: 'dashboard', label: 'Dashboard', icon: ChartPieIcon, visible: true },
        { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon, visible: true },
        { id: 'history', label: 'Work History', icon: DocumentTextIcon, visible: true },
        
        // Supervisor & Manager
        { id: 'live_monitoring', label: 'Live Monitoring', icon: BellAlertIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        { id: 'warehouse_dashboard', label: 'Warehouse', icon: TableCellsIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        { id: 'team', label: 'Team', icon: UsersIcon, visible: permissions.canManageTeam },
        { id: 'production', label: 'Production', icon: CpuChipIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        { id: 'maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon, visible: permissions.canManageAllMaintenance },
        { id: 'quality', label: 'Quality', icon: BeakerIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        { id: 'energy', label: 'Energy Management', icon: EnergyIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        { id: 'inventory', label: 'Inventory', icon: ArchiveBoxIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        { id: 'tool_management', label: 'Tool Management', icon: CubeIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        { id: 'program_library', label: 'Program Library', icon: FolderIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        { id: 'projects', label: 'Projects', icon: GanttChartIcon, visible: permissions.canManageProjects },
        { id: 'performance_analysis', label: 'Performance', icon: DocumentChartBarIcon, visible: permissions.canAccessCoreSupervisorFeatures },
        
    // Supervisor Only
    // { id: 'validation', label: 'Data Validation', icon: ShieldCheckIcon, visible: permissions.canValidateData },

        // Manager Only
        { id: 'reports', label: 'AI Reports', icon: SparklesIcon, visible: permissions.canViewFullAnalytics },
        { id: 'innovation_hub', label: 'Innovation Hub', icon: RecycleIcon, visible: permissions.canAccessInnovationHub },

    ];
    
    const adminNav = [
        { id: 'admin_users', label: 'User Management', icon: UsersIcon },
        { id: 'admin_system', label: 'System Config', icon: Cog6ToothIcon },
    ];

    const createNavItem = (item: {id: string, label: string, icon: React.ElementType, visible: boolean}) => {
        if (!item.visible) return null;
        return (
            <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentPage === item.id}
                onClick={() => {
                    setCurrentPage(item.id);
                    setIsOpen(false);
                }}
            />
        );
    }
    
    const sidebarContent = (
         <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900/95 text-gray-800 dark:text-gray-200">
            <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                    {appLogo && <img src={appLogo} alt="App Logo" className="h-10 w-10 object-contain" />}
                    <h2 className="font-bold whitespace-nowrap">{appName}</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-full md:hidden hover:bg-black/10 dark:hover:bg-white/10" title="Close sidebar" aria-label="Close sidebar">
                    <XMarkIcon className="w-6 h-6 text-gray-700 dark:text-gray-300"/>
                </button>
            </div>
            
            <nav className="flex-grow p-2 space-y-2 overflow-y-auto">
                 {!permissions.canViewAdminPanel && (
                   <NavGroup title="Main Navigation">
                     {mainNav.map(item => createNavItem(item))}
                   </NavGroup>
                 )}

                 {permissions.canViewAdminPanel && (
                     <NavGroup title="Administration">
                         {adminNav.map(item => (
                             <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={currentPage === item.id}
                                onClick={() => { setCurrentPage(item.id); setIsOpen(false); }}
                            />
                         ))}
                     </NavGroup>
                 )}
                 
                 <NavGroup title="Settings">
                    <NavItem
                        key="settings"
                        icon={Cog6ToothIcon}
                        label="Settings"
                        isActive={currentPage === 'settings'}
                        onClick={() => {
                            setCurrentPage('settings');
                            setIsOpen(false);
                        }}
                    />
                 </NavGroup>

            </nav>

            <div className="flex-shrink-0 p-2 border-t border-black/10 dark:border-white/10">
                <button
                    onClick={onAiAssistantClick}
                    className="flex items-center justify-center w-full gap-3 px-4 py-3 mb-2 font-bold text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-disa-accent-purple to-disa-accent-blue hover:opacity-90"
                >
                    <SparklesIcon className="w-6 h-6" />
                    AI Assistant
                </button>

                <div className="flex items-center gap-4 p-3 mb-2 rounded-xl bg-gray-200/50 dark:bg-black/20">
                    <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.employeeId}`} alt={user.name} className="object-cover w-12 h-12 rounded-full" />
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{isAdmin ? 'Administrator' : user.role}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center justify-center w-full px-4 py-3 font-semibold text-gray-600 transition-colors duration-200 rounded-lg dark:text-gray-300 hover:bg-disa-red/80 hover:text-white"
                >
                    <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Sidebar */}
             <AnimatePresence>
                {isOpen && (
                   <>
                        <motion.div
                            className="fixed inset-0 z-30 bg-black/60 md:hidden"
                            onClick={() => setIsOpen(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.aside
                            className="fixed top-0 left-0 z-40 w-72 h-full md:hidden"
                             initial={{ x: "-100%" }}
                             animate={{ x: 0 }}
                             exit={{ x: "-100%" }}
                             transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {sidebarContent}
                        </motion.aside>
                   </>
                )}
            </AnimatePresence>
            
            {/* Desktop Sidebar */}
            <aside className="flex-col hidden w-72 md:flex flex-shrink-0">
                {sidebarContent}
            </aside>
        </>
    );
};

export default Sidebar;