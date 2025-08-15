import React, { useState, Suspense } from 'react';
import { User } from '../types';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers } from '../hooks/useUsers';
import NotificationHost from '../components/common/NotificationHost';
import { usePermissions } from '../hooks/usePermissions';
import { Cog6ToothIcon } from '../components/common/Icons';
import { ADMIN_EMAIL } from '../constants';

// Lazy load all views
const OperatorDashboard = React.lazy(() => import('./OperatorDashboard'));
const SupervisorDashboard = React.lazy(() => import('./SupervisorDashboard'));
const ManagerDashboard = React.lazy(() => import('./ManagerDashboard'));
const HistoryView = React.lazy(() => import('./HistoryView'));
const SettingsView = React.lazy(() => import('./SettingsView'));
const AdminView = React.lazy(() => import('./AdminView'));
const Chatbot = React.lazy(() => import('../components/common/Chatbot'));
const MessagingPane = React.lazy(() => import('../components/messaging/MessagingPane'));
const ProductionView = React.lazy(() => import('./ProductionView'));
const InventoryView = React.lazy(() => import('./InventoryView'));
const MaintenanceView = React.lazy(() => import('./MaintenanceView'));
const QualityView = React.lazy(() => import('./QualityView'));
const ReportsView = React.lazy(() => import('./ReportsView'));
const PerformanceAnalysisView = React.lazy(() => import('./PerformanceAnalysisView'));
const TeamView = React.lazy(() => import('./TeamView'));
const ValidationView = React.lazy(() => import('./ValidationView'));
const LiveStatusView = React.lazy(() => import('./LiveStatusView'));
const ProjectsView = React.lazy(() => import('./ProjectsView'));
const ToolManagementView = React.lazy(() => import('./ToolManagementView'));
const ProgramLibraryView = React.lazy(() => import('./ProgramLibraryView'));
const InnovationHubView = React.lazy(() => import('./InnovationHubView'));
const WarehouseDashboardView = React.lazy(() => import('./WarehouseDashboardView'));
const QualityDashboard = React.lazy(() => import('./QualityDashboard'));
const SafetyDashboard = React.lazy(() => import('./SafetyDashboard'));
const ToolRoomDashboard = React.lazy(() => import('./ToolRoomDashboard'));
const EnergyView = React.lazy(() => import('./EnergyView'));

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
  onCurrentUserUpdate: (user: User) => void;
}

const pageTitles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    live_monitoring: 'Live Machine Monitoring',
    warehouse_dashboard: 'Warehouse Dashboard',
    validation: 'Data Validation',
    team: 'Team Management',
    production: 'Production Management',
    inventory: 'Inventory Management',
    maintenance: 'Maintenance',
    quality: 'Quality Control',
    energy: 'Energy Management',
    tool_management: 'Tool Management',
    program_library: 'Program Library',
    projects: 'Project Management',
    reports: 'Reports & Analytics',
    performance_analysis: 'Performance Analysis',
    innovation_hub: 'Innovation Hub',
    chat: 'Chat',
    history: 'Work History',
    admin_users: 'Admin Panel',
    admin_system: 'Admin Panel',
    settings: 'Settings',
};

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <Cog6ToothIcon className="w-12 h-12 text-disa-red animate-spin" />
  </div>
);

const MainLayout: React.FC<MainLayoutProps> = ({ 
    user, 
    onLogout,
    onCurrentUserUpdate
}) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { updateUser } = useUsers();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const permissions = usePermissions(user);
  const isAdmin = user.email === ADMIN_EMAIL;

  const isFullScreenPage = currentPage === 'chat';

  const renderCurrentPage = () => {
    // Render role-specific dashboards
    if (currentPage === 'dashboard') {
        if (permissions.isOperator) return <OperatorDashboard user={user} onCurrentUserUpdate={onCurrentUserUpdate} />;
        if (permissions.isSupervisor) return <SupervisorDashboard user={user} />;
        if (permissions.isManager) return <ManagerDashboard user={user} />;
        if (permissions.isQualityEngineer) return <QualityDashboard user={user} />;
        if (permissions.isSafetyOfficer) return <SafetyDashboard user={user} />;
        if (permissions.isToolRoomOperator) return <ToolRoomDashboard user={user} />;
        return <OperatorDashboard user={user} onCurrentUserUpdate={onCurrentUserUpdate} />; // Fallback
    }

    // Render common or role-gated pages
    switch (currentPage) {
      case 'live_monitoring': return permissions.canAccessCoreSupervisorFeatures ? <LiveStatusView /> : null;
      case 'warehouse_dashboard': return permissions.canAccessCoreSupervisorFeatures ? <WarehouseDashboardView /> : null;
  case 'validation': return (permissions.isSupervisor ? <ValidationView user={user} /> : null);
      case 'team': return permissions.canManageTeam ? <TeamView user={user} /> : null;
      case 'production': return permissions.canAccessCoreSupervisorFeatures ? <ProductionView user={user} /> : null;
      case 'inventory': return permissions.canAccessCoreSupervisorFeatures ? <InventoryView user={user} /> : null;
      case 'maintenance': return permissions.canManageAllMaintenance ? <MaintenanceView user={user} /> : null;
      case 'quality': return permissions.canAccessCoreSupervisorFeatures ? <QualityView user={user} /> : null;
      case 'energy': return permissions.canAccessCoreSupervisorFeatures ? <EnergyView /> : null;
      case 'tool_management': return permissions.canAccessCoreSupervisorFeatures ? <ToolManagementView user={user} /> : null;
      case 'program_library': return permissions.canAccessCoreSupervisorFeatures ? <ProgramLibraryView user={user} /> : null;
      case 'projects': return permissions.canManageProjects ? <ProjectsView user={user} /> : null;
      case 'reports': return permissions.canViewFullAnalytics ? <ReportsView user={user} /> : null;
      case 'performance_analysis': return permissions.canAccessCoreSupervisorFeatures ? <PerformanceAnalysisView /> : null;
      case 'innovation_hub': return permissions.canAccessInnovationHub ? <InnovationHubView /> : null;
      case 'chat': return <MessagingPane currentUser={user} setCurrentPage={setCurrentPage} />;
      case 'history': return <HistoryView user={user} />;
      case 'settings': return <SettingsView user={user} onUpdateUser={updateUser} onCurrentUserUpdate={onCurrentUserUpdate} />;
      case 'admin_users':
      case 'admin_system': return permissions.canViewAdminPanel ? <AdminView initialTab={currentPage} /> : null;
      default:
        // Fallback to a default dashboard if a page is somehow accessed without permission
        return <OperatorDashboard user={user} onCurrentUserUpdate={onCurrentUserUpdate} />;
    }
  };
  
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setIsSidebarOpen(false); // Close sidebar on navigation
  }

  return (
    <div className="flex h-screen bg-disa-light-bg dark:bg-disa-dark-bg">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        currentPage={currentPage} 
        setCurrentPage={handlePageChange} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        onAiAssistantClick={() => setIsChatbotOpen(true)}
        isAdmin={isAdmin}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        {!isFullScreenPage && (
            <Header 
                title={pageTitles[currentPage] || 'Dashboard'} 
                onMenuClick={() => setIsSidebarOpen(true)}
                setCurrentPage={handlePageChange}
            />
        )}
        <main className={`relative flex-1 ${isFullScreenPage ? 'overflow-hidden' : 'p-4 md:p-6 overflow-y-auto'}`}>
            <NotificationHost />
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={isFullScreenPage ? 'h-full' : ''}
                >
                    <Suspense fallback={<PageLoader />}>
                        {renderCurrentPage()}
                    </Suspense>
                </motion.div>
            </AnimatePresence>
        </main>
      </div>
      <Suspense>
        <Chatbot user={user} isOpen={isChatbotOpen} setIsOpen={setIsChatbotOpen} />
      </Suspense>
    </div>
  );
};

export default MainLayout;
