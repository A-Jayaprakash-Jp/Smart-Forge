import React, { useState } from 'react';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import BreakdownsTab from '../components/maintenance/BreakdownsTab';
import MaintenanceDashboardTab from '../components/maintenance/MaintenanceDashboardTab';
import PreventiveTasksTab from '../components/maintenance/PreventiveTasksTab';
import PredictiveAlertsTab from '../components/maintenance/PredictiveAlertsTab';
import MaintenanceRequestsTab from '../components/maintenance/MaintenanceRequestsTab';
import MaintenanceHistoryTab from '../components/maintenance/MaintenanceHistoryTab';
import { ChartPieIcon, ClipboardDocumentListIcon, BellAlertIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, ClockIcon } from '../components/common/Icons';

type MaintenanceTab = 'dashboard' | 'pm' | 'pdm' | 'breakdowns' | 'requests' | 'history';

const MaintenanceView: React.FC<{user: User}> = ({user}) => {
    const [activeTab, setActiveTab] = useState<MaintenanceTab>('dashboard');

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap border-b border-disa-light-border dark:border-disa-dark-border">
                    <TabButton id="dashboard" icon={ChartPieIcon} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton id="pm" icon={ClipboardDocumentListIcon} label="PM Schedules" isActive={activeTab === 'pm'} onClick={() => setActiveTab('pm')} />
                    <TabButton id="pdm" icon={BellAlertIcon} label="Predictive Alerts" isActive={activeTab === 'pdm'} onClick={() => setActiveTab('pdm')} />
                    <TabButton id="breakdowns" icon={ExclamationTriangleIcon} label="Breakdown Reports" isActive={activeTab === 'breakdowns'} onClick={() => setActiveTab('breakdowns')} />
                    <TabButton id="requests" icon={WrenchScrewdriverIcon} label="Requests" isActive={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
                    <TabButton id="history" icon={ClockIcon} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                </div>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="pt-6"
                    >
                        {activeTab === 'dashboard' && <MaintenanceDashboardTab />}
                        {activeTab === 'pm' && <PreventiveTasksTab user={user} />}
                        {activeTab === 'pdm' && <PredictiveAlertsTab user={user} />}
                        {activeTab === 'breakdowns' && <BreakdownsTab user={user} />}
                        {activeTab === 'requests' && <MaintenanceRequestsTab user={user} />}
                        {activeTab === 'history' && <MaintenanceHistoryTab />}
                    </motion.div>
                </AnimatePresence>
            </Card>
        </div>
    );
};

const TabButton: React.FC<{id: string, label: string, icon: React.ElementType, isActive: boolean, onClick: () => void}> = ({id, label, icon: Icon, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${isActive ? 'text-disa-red border-b-2 border-disa-red' : 'text-gray-500 hover:text-disa-red border-b-2 border-transparent'}`}
    >
        <Icon className="w-5 h-5" />
        {label}
    </button>
);

export default MaintenanceView;