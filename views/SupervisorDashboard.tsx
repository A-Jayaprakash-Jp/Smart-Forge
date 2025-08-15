import React, { useMemo, useState, useEffect } from 'react';
import { User, Machine, Role, ProductionLog, MaintenanceTask, MachineAlert, IncidentLog, AssignedTask } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useProductionData } from '../hooks/useProductionData';
import { useUsers } from '../hooks/useUsers';
import { useSettings } from '../hooks/useSettings';
import { generateTodaysFocus } from '../services/geminiService';
import { Area, AreaChart, ResponsiveContainer, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { UserPlusIcon, TrashIcon, LightBulbIcon, BellAlertIcon, WrenchScrewdriverIcon, ChartPieIcon, TableCellsIcon, ExclamationTriangleIcon, PlusIcon, PlusCircleIcon } from '../components/common/Icons';
import AnalyticsToolbar from '../components/analytics/AnalyticsToolbar';
import { AnimatePresence, motion } from 'framer-motion';
import ActionCenter from '../components/supervisor/ActionCenter';
import AssignTaskModal from '../components/supervisor/AssignTaskModal';

const MachineStatusCard: React.FC<{ machine: Machine, assignedOperator?: User }> = ({ machine, assignedOperator }) => {
    const { getMachineData } = useProductionData();
    const machineLogs = useMemo(() => getMachineData(machine.id).filter(l => l.status === 'Approved'), [getMachineData, machine.id]);

    const shiftSummary = useMemo(() => {
        const now = new Date();
        const shiftStart = new Date(now);
        shiftStart.setHours(now.getHours() - 12);

        const shiftLogs = machineLogs.filter(log => log.timestamp >= shiftStart);
        return shiftLogs.reduce((acc, log) => {
          acc.good += log.goodMoulds;
          acc.rejected += log.rejectedMoulds;
          return acc;
        }, { good: 0, rejected: 0 });
    }, [machineLogs]);

    const sparklineData = useMemo(() => {
        const now = new Date();
        const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
        return machineLogs
            .filter(log => log.timestamp > eightHoursAgo)
            .map(log => ({ time: log.timestamp.getTime(), good: log.goodMoulds }))
            .sort((a, b) => a.time - b.time);
    }, [machineLogs]);
    
    const sparklineColor = machine.status === 'Running' ? "#10B981" : machine.status === 'Idle' ? "#F59E0B" : "#C8102E";

    const statusStyles = {
        Running: 'from-disa-accent-green/20 to-disa-dark-bg',
        Idle: 'from-disa-accent-yellow/20 to-disa-dark-bg',
        Down: 'from-disa-red/20 to-disa-dark-bg',
    };
    
    const statusTextStyles = {
        Running: 'bg-disa-accent-green/80 text-white',
        Idle: 'bg-disa-accent-yellow/80 text-black',
        Down: 'bg-disa-red/80 text-white',
    };

    return (
        <Card className={`transition-all duration-300 flex flex-col bg-gradient-to-br ${statusStyles[machine.status]}`}>
            <div className="flex-grow">
                <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{machine.name}</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusTextStyles[machine.status]}`}>
                        {machine.status}
                    </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Operator: {assignedOperator?.name || 'Unassigned'}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Moulds/hr: {machine.mouldsPerHour}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-300">Good (Shift)</p>
                        <p className="text-3xl font-bold text-disa-accent-green">{shiftSummary.good}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-300">Rejected (Shift)</p>
                        <p className="text-3xl font-bold text-disa-red">{shiftSummary.rejected}</p>
                    </div>
                </div>
            </div>
             <div className="h-20 mt-4 -mx-5 -mb-5">
                <ResponsiveContainer>
                    <AreaChart data={sparklineData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${machine.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={sparklineColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="good" stroke={sparklineColor} strokeWidth={2} fill={`url(#gradient-${machine.id})`} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};


const SupervisorDashboard: React.FC<{ user: User }> = ({ user }) => {
    // Debug: Show user info for troubleshooting
    if (!user || !user.uid || user.role !== Role.Supervisor) {
        return (
            <div className="p-8 text-center text-red-600 font-bold">
                Invalid or missing supervisor user. Please log in again.<br/>
                <pre className="mt-4 text-xs text-gray-700 bg-gray-100 p-2 rounded">{JSON.stringify(user, null, 2)}</pre>
            </div>
        );
    }

    const { machines, data, maintenanceTasks, machineAlerts, incidentLogs, acknowledgeAlert, addIncidentLog, addAssignedTask } = useProductionData();
    const { users, addUser, removeUser } = useUsers();
    const [todaysFocus, setTodaysFocus] = useState<string>('Loading AI focus tip...');

    const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserEmployeeId, setNewUserEmployeeId] = useState('');
    const [userToRemove, setUserToRemove] = useState<User | null>(null);

    const operators = useMemo(() => users.filter(u => u.role === Role.Operator), [users]);

    useEffect(() => {
        generateTodaysFocus(user, data, maintenanceTasks, incidentLogs)
            .then(setTodaysFocus)
            .catch(err => {
                console.error("Failed to get today's focus:", err);
                setTodaysFocus("Could not load AI focus tip. Check API key and connection.");
            });
    }, [user, data, maintenanceTasks, incidentLogs]);
  
  const handleAddOperator = async () => {
    if (newUserName.trim() && newUserEmail.trim() && newUserEmployeeId.trim()) {
      try {
        await addUser({ name: newUserName, email: newUserEmail, role: Role.Operator, employeeId: newUserEmployeeId });
        setNewUserName('');
        setNewUserEmail('');
        setNewUserEmployeeId('');
        setAddUserModalOpen(false);
      } catch (error: any) {
        alert(`Failed to add user: ${error.message}`);
      }
    } else {
      alert('Please provide a valid name, Employee ID, and email.');
    }
  };
  
  const handleAddIncident = (incident: Omit<IncidentLog, 'id' | 'timestamp' | 'reportedByUserId'>) => {
    addIncidentLog({ ...incident, reportedByUserId: user.uid });
    setIsIncidentModalOpen(false);
  };

  const handleAssignTask = (task: Omit<AssignedTask, 'id' | 'isCompleted' | 'assignedAt' | 'completedAt'>) => {
      addAssignedTask(task);
      setIsAssignTaskModalOpen(false);
  };

  const upcomingMaintenance = useMemo(() => maintenanceTasks.filter(t => t.status === 'Due' || t.status === 'Overdue').sort((a,b) => a.nextDue.getTime() - b.nextDue.getTime()), [maintenanceTasks]);
  const activeAlerts = useMemo(() => machineAlerts.filter(a => !a.isAcknowledged).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()), [machineAlerts]);
  const activeIncidents = useMemo(() => incidentLogs.filter(i => !i.resolvedAt).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()), [incidentLogs]);


  return (
    <div className="space-y-6">
        <Card className="bg-gradient-to-r from-disa-accent-purple/80 to-disa-accent-blue/80 text-white">
            <div className="flex items-center gap-4">
                <LightBulbIcon className="w-8 h-8 text-yellow-300 flex-shrink-0" />
                <div>
                    <h3 className="font-bold">Today's Focus</h3>
                    <p className="text-lg">{todaysFocus}</p>
                </div>
            </div>
        </Card>

        <Card>
            <div className="flex justify-between items-center border-b border-disa-light-border dark:border-disa-dark-border pb-3 mb-6">
                 <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <TableCellsIcon className="w-6 h-6" />
                    Shop Floor Overview
                </h2>
                 <button onClick={() => setIsIncidentModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-disa-accent-purple hover:bg-purple-700">
                    <PlusIcon className="w-4 h-4" /> Report Incident
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {machines.map(machine => {
                            const operator = users.find(u => u.assignedMachineId === machine.id);
                            return <MachineStatusCard key={machine.id} machine={machine} assignedOperator={operator} />
                        })}
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                         <ActionCenter 
                            alerts={activeAlerts}
                            tasks={upcomingMaintenance}
                            incidents={activeIncidents}
                            onAcknowledgeAlert={acknowledgeAlert}
                         />
                        <Card className="flex-1 flex flex-col">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Team Overview</h3>
                                <div className="flex gap-2">
                                     <button onClick={() => setIsAssignTaskModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-disa-accent-purple hover:bg-purple-700">
                                        <PlusCircleIcon className="w-4 h-4" /> Assign Task
                                    </button>
                                    <button onClick={() => setAddUserModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                                        <UserPlusIcon className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 flex-grow overflow-y-auto -mr-2 pr-2">
                                {operators.map(op => (
                                <div key={op.uid} className="flex items-center justify-between p-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <img src={op.profilePicUrl || `https://i.pravatar.cc/150?u=${op.employeeId}`} alt={op.name} className="object-cover w-10 h-10 rounded-full" />
                                        <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ${op.isOnline ? 'bg-disa-accent-green' : 'bg-gray-400'} border-2 border-white dark:border-gray-800`}></span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white">{op.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{op.assignedMachineId || 'Unassigned'}</p>
                                    </div>
                                    </div>
                                    <button onClick={() => setUserToRemove(op)} className="p-2 text-gray-500 transition-colors rounded-full hover:bg-red-500/20 hover:text-red-500">
                                    <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </Card>

        <AssignTaskModal
            isOpen={isAssignTaskModalOpen}
            onClose={() => setIsAssignTaskModalOpen(false)}
            onSubmit={handleAssignTask}
            supervisorId={user.uid}
        />

        <IncidentFormModal 
            isOpen={isIncidentModalOpen} 
            onClose={() => setIsIncidentModalOpen(false)}
            onSubmit={handleAddIncident}
            machines={machines}
        />

        <Modal isOpen={isAddUserModalOpen} onClose={() => setAddUserModalOpen(false)} title="Add New Operator">
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Operator Name</label>
              <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="e.g., Jane Smith" />
            </div>
             <div>
              <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Employee ID</label>
              <input type="text" value={newUserEmployeeId} onChange={e => setNewUserEmployeeId(e.target.value)} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="e.g., E103"/>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
              <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="e.g., j.smith@disa.com"/>
            </div>
            <button onClick={handleAddOperator} className="w-full py-3 mt-4 font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">Create Operator</button>
          </div>
        </Modal>

        <ConfirmationModal
            isOpen={!!userToRemove}
            onClose={() => setUserToRemove(null)}
            onConfirm={() => {
                if (userToRemove) {
                    removeUser(userToRemove.uid);
                }
                setUserToRemove(null);
            }}
            title="Remove Operator"
        >
            <p>Are you sure you want to remove <span className="font-bold">{userToRemove?.name}</span>? This action cannot be undone.</p>
        </ConfirmationModal>
    </div>
  );
};

const IncidentFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (incident: Omit<IncidentLog, 'id' | 'timestamp' | 'reportedByUserId'>) => void;
    machines: Machine[];
}> = ({ isOpen, onClose, onSubmit, machines }) => {
    const [machineId, setMachineId] = useState(machines[0]?.id || '');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState<IncidentLog['severity']>('Low');

    const handleSubmit = () => {
        if (!machineId || !description) {
            alert('Please fill all fields');
            return;
        }
        onSubmit({ machineId, description, severity });
        // Reset form
        setMachineId(machines[0]?.id || '');
        setDescription('');
        setSeverity('Low');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Report New Incident">
            <div className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Machine</label>
                    <select value={machineId} onChange={(e) => setMachineId(e.target.value)} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
                        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Severity</label>
                    <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                </div>
                 <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                     <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="Describe the incident..."/>
                </div>
                <button onClick={handleSubmit} className="w-full py-3 mt-6 font-bold text-white transition-colors rounded-lg bg-disa-accent-purple hover:bg-purple-700">Submit Incident</button>
            </div>
        </Modal>
    );
}

export default SupervisorDashboard;