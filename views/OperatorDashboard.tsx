import React, { useState, useMemo, useEffect } from 'react';
import { User, ProductionLog, AssignedTask, IncidentLog, MaintenanceRequest, Machine } from '../types';
import Card from '../components/common/Card';
import ProductionLogForm from '../components/operator/ProductionLogForm';
import OcrLogModal from '../components/operator/OcrLogModal';
import VoiceLogModal from '../components/operator/VoiceLogModal';
import RecycleAiModal from '../components/operator/RecycleAiModal';
import ReportIssueModal from '../components/operator/ReportIssueModal';
import RequestMaintenanceModal from '../components/operator/RequestMaintenanceModal';
import MachineSelectionModal from '../components/operator/MachineSelectionModal';
import { useProductionData } from '../hooks/useProductionData';
import { useUsers } from '../hooks/useUsers';
import { generateTodaysFocus } from '../services/geminiService';
import { LightBulbIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, CheckCircleIcon, SparklesIcon, XCircleIcon } from '../components/common/Icons';
import { motion } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';
import CurrentTaskCard from '../components/operator/CurrentTaskCard';

const OperatorDashboard: React.FC<{ user: User; onCurrentUserUpdate: (user: User) => void; }> = ({ user, onCurrentUserUpdate }) => {
    const { 
        machines, 
        data, 
        maintenanceTasks, 
        incidentLogs,
        productionOrders,
        assignedTasks,
        addProductionLog, 
        addMultipleProductionLogs,
        startDowntime, 
        endDowntime, 
        getDowntimeData,
        addIncidentLog,
        addMaintenanceRequest,
        toggleAssignedTask,
    } = useProductionData();
    const { addNotification } = useNotifications();
    const { updateUser } = useUsers();

    const [todaysFocus, setTodaysFocus] = useState<string>('Loading AI focus tip...');
  
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [isRecycleModalOpen, setRecycleModalOpen] = useState(false);
    const [isReportIssueModalOpen, setReportIssueModalOpen] = useState(false);
    const [isRequestMaintenanceModalOpen, setRequestMaintenanceModalOpen] = useState(false);
    const [isMachineSelectionOpen, setIsMachineSelectionOpen] = useState(false);
    
    const [parsedLogData, setParsedLogData] = useState<Partial<ProductionLog> | null>(null);

    useEffect(() => {
        if (!user.assignedMachineId && machines.length > 0) {
            setIsMachineSelectionOpen(true);
        }
    }, [user.assignedMachineId, machines.length]);

    const userAssignedTasks = useMemo(() => {
        return assignedTasks.filter(task => task.assignedToUserId === user.uid);
    }, [assignedTasks, user.uid]);
    
    const handleToggleTask = (taskId: string) => {
        toggleAssignedTask(taskId);
    };

    const assignedMachine = useMemo(() => {
        return machines.find(m => m.id === user.assignedMachineId);
    }, [machines, user.assignedMachineId]);
    
    const activeProductionOrder = useMemo(() => {
        return productionOrders.find(o => o.status === 'In Progress');
    }, [productionOrders]);

    const activeDowntime = useMemo(() => {
        if (!assignedMachine) return null;
        return getDowntimeData(assignedMachine.id).find(dt => !dt.end);
    }, [getDowntimeData, assignedMachine]);
  
    const recentActivity = useMemo(() => {
        const userLogs = data.logs.filter(log => log.userId === user.uid);
        const userDowntime = data.downtime.filter(dt => dt.userId === user.uid);
        
        const combined = [
            ...userLogs.map(l => ({ ...l, type: 'log' as const, date: l.timestamp })),
            ...userDowntime.map(d => ({ ...d, type: 'downtime' as const, date: d.start })),
        ];

        return combined.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    }, [data, user.uid]);

    useEffect(() => {
        generateTodaysFocus(user, data, maintenanceTasks, incidentLogs)
            .then(setTodaysFocus)
            .catch(err => {
                console.error("Failed to get today's focus:", err);
                setTodaysFocus("Could not load AI focus tip. Check API key and connection.");
            });
    }, [user, data, maintenanceTasks, incidentLogs]);

    const handleLogSubmit = (logData: Omit<ProductionLog, 'id' | 'timestamp'>) => {
        const logWithOrder = {
            ...logData,
            jobOrderNumber: activeProductionOrder?.id,
            partId: activeProductionOrder?.partNumber,
        };
        addProductionLog(logWithOrder);
        addNotification({ title: 'Log Submitted', message: `${logData.goodMoulds} good moulds logged.`, type: 'success' });
        setIsLogModalOpen(false);
        setParsedLogData(null);
    };
    
    const handleImportComplete = (logs: Partial<ProductionLog>[]) => {
        // If only one log is returned, let the user confirm it in the form.
        if (logs.length === 1) {
            setParsedLogData(logs[0]);
            setIsImportModalOpen(false);
            setIsLogModalOpen(true);
        } else {
            // Otherwise, bulk-add the logs directly.
            addMultipleProductionLogs(logs);
            addNotification({
                title: 'Import Successful',
                message: `${logs.length} log(s) have been imported and are pending validation.`,
                type: 'success'
            });
            setIsImportModalOpen(false);
        }
    };

    const handleVoiceComplete = (data: Partial<ProductionLog>) => {
        setParsedLogData(data);
        setIsVoiceModalOpen(false);
        setIsLogModalOpen(true);
    };
    
     const handleReportIssue = (incident: Omit<IncidentLog, 'id'|'timestamp'|'reportedByUserId'>) => {
        addIncidentLog({...incident, reportedByUserId: user.uid});
        addNotification({ title: 'Issue Reported', message: 'Your report has been submitted to the supervisor.', type: 'success'});
        setReportIssueModalOpen(false);
    };

    const handleRequestMaintenance = (request: Omit<MaintenanceRequest, 'id'|'reportedDate'|'status'>) => {
        addMaintenanceRequest(request);
        addNotification({ title: 'Maintenance Requested', message: 'Your request has been sent for review.', type: 'success'});
        setRequestMaintenanceModalOpen(false);
    };

    const handleOpenReportRequest = () => {
        if (!assignedMachine) {
            addNotification({title: 'No Machine', message: 'Please select a workstation before reporting an issue.', type: 'warning'});
            return;
        }
        setReportIssueModalOpen(true); 
    }
    
    const handleOpenMaintenanceRequest = () => {
        if (!assignedMachine) {
            addNotification({title: 'No Machine', message: 'Please select a workstation before requesting maintenance.', type: 'warning'});
            return;
        }
        setRequestMaintenanceModalOpen(true); 
    }

    const handleSelectMachine = (machineId: string) => {
        const updatedUser = { ...user, assignedMachineId: machineId };
        updateUser(updatedUser);
        onCurrentUserUpdate(updatedUser);
        addNotification({ title: 'Workstation Changed', message: `You are now assigned to ${machines.find(m => m.id === machineId)?.name}.`, type: 'info' });
        setIsMachineSelectionOpen(false);
    };

    const handleUnassignMachine = () => {
        const updatedUser = { ...user, assignedMachineId: undefined };
        updateUser(updatedUser);
        onCurrentUserUpdate(updatedUser);
        addNotification({ title: 'Workstation Unassigned', message: 'You are no longer assigned to a machine.', type: 'info' });
        setIsMachineSelectionOpen(true);
    };

    const statusStyles = {
        Approved: 'bg-green-500/20 text-green-700 dark:text-green-400',
        Rejected: 'bg-red-500/20 text-red-700 dark:text-red-400',
        Pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-500',
    };

    return (
        <>
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                <Card className="bg-gradient-to-r from-disa-accent-purple/80 to-disa-accent-blue/80 text-white">
                    <div className="flex items-center gap-4">
                        <LightBulbIcon className="w-8 h-8 text-yellow-300 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold">Today's Focus</h3>
                            <p className="text-lg">{todaysFocus}</p>
                        </div>
                    </div>
                </Card>

                <CurrentTaskCard
                    user={user}
                    machine={assignedMachine}
                    productionOrder={activeProductionOrder}
                    activeDowntime={activeDowntime}
                    onLogProduction={() => setIsLogModalOpen(true)}
                    onStartDowntime={() => startDowntime({ machineId: assignedMachine!.id, userId: user.uid, reason: 'Unplanned Stop' })}
                    onEndDowntime={() => endDowntime(assignedMachine!.id)}
                    onRequestMaintenance={handleOpenMaintenanceRequest}
                    onReportIssue={handleOpenReportRequest}
                    onSelectWorkstation={() => setIsMachineSelectionOpen(true)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <Card>
                            <h3 className="text-xl font-bold mb-4">Assigned Tasks</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {userAssignedTasks.filter(t => !t.isCompleted).map(task => (
                                    <div key={task.id} className="flex items-start gap-3">
                                        <input type="checkbox" checked={task.isCompleted} onChange={() => handleToggleTask(task.id)} className="mt-1 h-5 w-5 rounded accent-disa-red" />
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{task.title}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                                        </div>
                                    </div>
                                ))}
                                    {userAssignedTasks.filter(t => !t.isCompleted).length === 0 && (
                                    <p className="text-center text-gray-500 py-4">No pending tasks.</p>
                                    )}
                            </div>
                        </Card>
                         {assignedMachine && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                <button
                                    onClick={handleUnassignMachine}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700"
                                >
                                    <XCircleIcon className="w-6 h-6" />
                                    Unassign from Workstation
                                </button>
                            </motion.div>
                        )}
                    </div>
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Recent Activity</h3>
                            <button onClick={() => setRecycleModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white transition-colors rounded-lg bg-disa-accent-green hover:bg-green-600">
                                <SparklesIcon className="w-4 h-4" /> AI Recycle
                            </button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {recentActivity.map(item => (
                                <div key={`${item.type}-${item.id}`} className="flex items-center gap-3">
                                    {item.type === 'log' ? <ArrowUpCircleIcon className="w-6 h-6 text-disa-accent-green flex-shrink-0" /> : <ArrowDownCircleIcon className="w-6 h-6 text-disa-red flex-shrink-0" />}
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">
                                            {item.type === 'log' ? `Logged ${item.goodMoulds} good moulds` : `Downtime: ${item.reason}`}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.date.toLocaleString()}</p>
                                    </div>
                                    {item.type === 'log' && <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[item.status]}`}>{item.status}</span>}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </motion.div>
            
            <OcrLogModal 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)} 
                onComplete={handleImportComplete}
                user={user}
            />

            <VoiceLogModal 
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onComplete={handleVoiceComplete}
            />

            <ProductionLogForm 
                isOpen={isLogModalOpen} 
                onClose={() => {setIsLogModalOpen(false); setParsedLogData(null);}} 
                onSubmit={handleLogSubmit} 
                initialData={parsedLogData}
                onOpenFileImporter={() => setIsImportModalOpen(true)}
                onOpenVoiceLogger={() => setIsVoiceModalOpen(true)}
            />

            <RecycleAiModal isOpen={isRecycleModalOpen} onClose={() => setRecycleModalOpen(false)} />
            
            {assignedMachine && (
                 <>
                    <ReportIssueModal isOpen={isReportIssueModalOpen} onClose={() => setReportIssueModalOpen(false)} onSubmit={handleReportIssue} machine={assignedMachine} />
                    <RequestMaintenanceModal isOpen={isRequestMaintenanceModalOpen} onClose={() => setRequestMaintenanceModalOpen(false)} onSubmit={handleRequestMaintenance} machine={assignedMachine} />
                 </>
            )}

            <MachineSelectionModal 
                isOpen={isMachineSelectionOpen}
                onClose={() => setIsMachineSelectionOpen(false)}
                onSelectMachine={handleSelectMachine}
                onUnassignMachine={handleUnassignMachine}
                currentMachineId={user.assignedMachineId}
            />
        </>
    );
};

export default OperatorDashboard;
