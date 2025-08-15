
import React, { useState, useMemo } from 'react';
import { useProductionData } from '../../hooks/useProductionData';
import { MaintenanceTask, User } from '../../types';
import Card from '../common/Card';
import { PlusIcon, CalendarDaysIcon, ClockIcon } from '../common/Icons';
import PmTaskFormModal from './PmTaskFormModal';
import CompleteTaskModal from './CompleteTaskModal';
import { useUsers } from '../../hooks/useUsers';

const PreventiveTasksTab: React.FC<{ user: User }> = ({ user }) => {
    const { maintenanceTasks, addMaintenanceTask, updateMaintenanceTask, completeMaintenanceTask } = useProductionData();
    const { users } = useUsers();
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
    const [completingTask, setCompletingTask] = useState<MaintenanceTask | null>(null);
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredTasks = useMemo(() => {
        const statusOrder = { 'Overdue': 1, 'Due': 2, 'Upcoming': 3, 'Completed': 4 };
        let tasks = [...maintenanceTasks];
        if (statusFilter !== 'All') {
            tasks = tasks.filter(t => t.status === statusFilter);
        }
        return tasks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());
    }, [maintenanceTasks, statusFilter]);

    const handleOpenAddModal = () => {
        setEditingTask(null);
        setFormModalOpen(true);
    };

    const handleOpenEditModal = (task: MaintenanceTask) => {
        setEditingTask(task);
        setFormModalOpen(true);
    };
    
    const handleOpenCompleteModal = (task: MaintenanceTask) => {
        setCompletingTask(task);
        setCompleteModalOpen(true);
    };
    
    const handleSaveTask = (taskData: MaintenanceTask | Omit<MaintenanceTask, 'id' | 'lastCompleted' | 'nextDue' | 'status'>) => {
        if ('id' in taskData) {
            updateMaintenanceTask(taskData);
        } else {
            addMaintenanceTask(taskData);
        }
        setFormModalOpen(false);
    };

    const handleCompleteTask = (notes: string) => {
        if (completingTask) {
            completeMaintenanceTask(completingTask.id, notes, user.uid);
        }
        setCompleteModalOpen(false);
    };

    const getAssigneeName = (userId?: string) => {
        if (!userId) return 'Unassigned';
        return users.find(u => u.uid === userId)?.name || 'Unknown User';
    };

    return (
        <div className="space-y-4">
            <PmTaskFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSave={handleSaveTask}
                task={editingTask}
            />
            <CompleteTaskModal 
                isOpen={isCompleteModalOpen}
                onClose={() => setCompleteModalOpen(false)}
                onSubmit={handleCompleteTask}
                task={completingTask}
            />

            <div className="flex justify-between items-center">
                <div className="flex gap-2 p-1 rounded-lg bg-gray-200/50 dark:bg-black/20">
                    {['All', 'Overdue', 'Due', 'Upcoming', 'Completed'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                            {status}
                        </button>
                    ))}
                </div>
                <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                    <PlusIcon className="w-5 h-5"/> New Schedule
                </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {filteredTasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        assigneeName={getAssigneeName(task.assignedToUserId)}
                        onEdit={() => handleOpenEditModal(task)}
                        onComplete={() => handleOpenCompleteModal(task)}
                    />
                ))}
            </div>
        </div>
    );
};

const TaskCard: React.FC<{ task: MaintenanceTask, assigneeName: string, onEdit: () => void, onComplete: () => void }> = ({ task, assigneeName, onEdit, onComplete }) => {
    const statusStyles = {
        Overdue: 'border-red-500 bg-red-500/10',
        Due: 'border-yellow-500 bg-yellow-500/10',
        Upcoming: 'border-blue-500 bg-blue-500/10',
        Completed: 'border-green-500 bg-green-500/10 opacity-70',
    };
    const ScheduleIcon = task.scheduleType === 'calendar' ? CalendarDaysIcon : ClockIcon;
    const scheduleUnit = task.scheduleType === 'calendar' ? 'days' : 'hours';

    return (
        <Card className={`!p-4 border-l-4 ${statusStyles[task.status]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-800 dark:text-white">{task.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Machine: {task.machineId} | Assigned: {assigneeName}
                    </p>
                     <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <ScheduleIcon className="w-4 h-4" />
                        <span>Every {task.interval} {scheduleUnit}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{task.status}</p>
                    <p className="text-xs text-gray-500">Due: {new Date(task.nextDue).toLocaleDateString()}</p>
                </div>
            </div>
            {task.completionNotes && (
                <div className="mt-2 pt-2 border-t border-gray-500/10 text-sm italic text-gray-600 dark:text-gray-400">
                    Notes: "{task.completionNotes}"
                </div>
            )}
            <div className="flex justify-end gap-2 mt-2">
                <button onClick={onEdit} className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-500/20 hover:bg-gray-500/30">Edit</button>
                {task.status !== 'Completed' && (
                    <button onClick={onComplete} className="px-3 py-1 text-xs font-semibold text-white rounded-md bg-disa-accent-green hover:bg-green-500">Complete</button>
                )}
            </div>
        </Card>
    );
};

export default PreventiveTasksTab;