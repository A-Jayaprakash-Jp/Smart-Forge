

import React, { useState } from 'react';
import { MaintenanceTask, MachineAlert, IncidentLog } from '../../types';
import { BellAlertIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon } from '../common/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionCenterProps {
    alerts: MachineAlert[];
    tasks: MaintenanceTask[];
    incidents: IncidentLog[];
    onAcknowledgeAlert: (alertId: string) => void;
}

const ActionCenter: React.FC<ActionCenterProps> = ({ alerts, tasks, incidents, onAcknowledgeAlert }) => {
    const [activeTab, setActiveTab] = useState('alerts');

    const tabs = [
        { id: 'alerts', label: 'Alerts', icon: BellAlertIcon, data: alerts, count: alerts.length, color: 'text-disa-red' },
        { id: 'tasks', label: 'Maintenance', icon: WrenchScrewdriverIcon, data: tasks, count: tasks.length, color: 'text-disa-accent-yellow' },
        { id: 'incidents', label: 'Incidents', icon: ExclamationTriangleIcon, data: incidents, count: incidents.length, color: 'text-disa-accent-purple' },
    ];

    const TabButton: React.FC<{tab: typeof tabs[0]}> = ({ tab }) => (
        <button
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold transition-colors rounded-md ${activeTab === tab.id ? 'bg-disa-accent-blue text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-white/10'}`}
        >
            <tab.icon className="w-5 h-5" />
            <span className="hidden md:inline">{tab.label}</span>
            {tab.count > 0 && <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${tab.color.replace('text-', 'bg-')}`}>{tab.count}</span>}
        </button>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'alerts': return <AlertsList alerts={alerts} onAcknowledge={onAcknowledgeAlert} />;
            case 'tasks': return <TasksList tasks={tasks} />;
            case 'incidents': return <IncidentsList incidents={incidents} />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full p-4 rounded-2xl bg-gray-200/50 dark:bg-black/20">
            <div className="flex-shrink-0 flex p-1 rounded-lg bg-gray-300/50 dark:bg-black/30">
                {tabs.map(tab => <TabButton key={tab.id} tab={tab} />)}
            </div>
            <div className="flex-grow mt-4 overflow-y-auto -mr-2 pr-2 min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const AlertsList: React.FC<{ alerts: MachineAlert[], onAcknowledge: (id: string) => void }> = ({ alerts, onAcknowledge }) => (
    <div className="space-y-2">
        {alerts.length > 0 ? alerts.map(alert => (
            <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${alert.severity === 'High' ? 'border-red-500 bg-red-500/10' : alert.severity === 'Medium' ? 'border-yellow-500 bg-yellow-500/10' : 'border-blue-500 bg-blue-500/10'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold">{alert.machineId}: {alert.code}</p>
                        <p className="text-sm">{alert.description}</p>
                    </div>
                    <button onClick={() => onAcknowledge(alert.id)} className="text-xs p-1 rounded hover:bg-black/10">Ack</button>
                </div>
            </div>
        )) : <EmptyState message="No active alerts." />}
    </div>
);

const TasksList: React.FC<{ tasks: MaintenanceTask[] }> = ({ tasks }) => (
    <div className="space-y-2">
        {tasks.length > 0 ? tasks.map(task => (
             <div key={task.id} className={`p-3 rounded-lg border-l-4 ${task.status === 'Overdue' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
                <p className="font-bold">{task.machineId}: {task.description}</p>
                <p className="text-sm">Due: {task.nextDue.toLocaleDateString()}</p>
            </div>
        )) : <EmptyState message="No upcoming maintenance tasks." />}
    </div>
);

const IncidentsList: React.FC<{ incidents: IncidentLog[] }> = ({ incidents }) => (
    <div className="space-y-2">
        {incidents.length > 0 ? incidents.map(incident => (
            <div key={incident.id} className={`p-3 rounded-lg border-l-4 ${incident.severity === 'High' ? 'border-red-500 bg-red-500/10' : incident.severity === 'Medium' ? 'border-yellow-500 bg-yellow-500/10' : 'border-blue-500 bg-blue-500/10'}`}>
                <p className="font-bold">{incident.machineId}: <span className="font-normal">{incident.description}</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reported at {incident.timestamp.toLocaleTimeString()}</p>
            </div>
        )) : <EmptyState message="No open incidents." />}
    </div>
);

const EmptyState: React.FC<{message: string}> = ({ message }) => (
    <div className="text-center py-10">
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
);

export default ActionCenter;