
import React, { useMemo } from 'react';
import { useProductionData } from '../../hooks/useProductionData';
import Card from '../common/Card';
import { MaintenanceTask, MaintenanceRequest } from '../../types';
import { useUsers } from '../../hooks/useUsers';

type HistoryItem = (MaintenanceTask & { itemType: 'Task' }) | (MaintenanceRequest & { itemType: 'Request' });

const MaintenanceHistoryTab: React.FC = () => {
    const { maintenanceTasks, maintenanceRequests } = useProductionData();
    const { users } = useUsers();

    const historyItems = useMemo(() => {
        const completedTasks: HistoryItem[] = maintenanceTasks
            .filter(t => t.status === 'Completed')
            .map(t => ({ ...t, itemType: 'Task' }));

        const completedRequests: HistoryItem[] = maintenanceRequests
            .filter(r => r.status === 'Completed')
            .map(r => ({ ...r, itemType: 'Request' }));

        const allItems = [...completedTasks, ...completedRequests];

        return allItems.sort((a, b) => {
            const dateA = 'lastCompleted' in a ? new Date(a.lastCompleted) : new Date(a.reportedDate);
            const dateB = 'lastCompleted' in b ? new Date(b.lastCompleted) : new Date(b.reportedDate);
            return dateB.getTime() - dateA.getTime();
        });
    }, [maintenanceTasks, maintenanceRequests]);
    
    const getUserName = (id?: string) => {
        if (!id) return 'N/A';
        return users.find(u => u.uid === id)?.name || 'Unknown';
    }

    return (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {historyItems.map(item => (
                <Card key={`${item.itemType}-${item.id}`} className="!p-4">
                    {item.itemType === 'Task' ? (
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{item.description}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Machine: {item.machineId} | Type: PM Task</p>
                                </div>
                                <div className="text-right text-sm">
                                    <p>Completed: {new Date(item.lastCompleted).toLocaleDateString()}</p>
                                    <p>By: {getUserName(item.completedByUserId)}</p>
                                </div>
                            </div>
                            {item.completionNotes && <p className="mt-2 text-sm italic text-gray-600 dark:text-gray-400">Notes: "{item.completionNotes}"</p>}
                        </div>
                    ) : (
                         <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{item.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Machine: {item.machineId} | Type: Request</p>
                                </div>
                                <p className="text-right text-sm">Completed</p>
                            </div>
                            <p className="mt-2 text-sm italic text-gray-600 dark:text-gray-400">"{item.description}"</p>
                        </div>
                    )}
                </Card>
            ))}
            {historyItems.length === 0 && <p className="text-center py-10 text-gray-500">No completed maintenance history.</p>}
        </div>
    );
};

export default MaintenanceHistoryTab;