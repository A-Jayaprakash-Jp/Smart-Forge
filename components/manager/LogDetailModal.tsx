import React from 'react';
import Modal from '../common/Modal';
import { ProductionLog } from '../../types';
import { useUsers } from '../../hooks/useUsers';

interface LogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: ProductionLog[];
    day: string;
}

const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, logs, day }) => {
    const { users } = useUsers();
    const getOperatorName = (userId: string) => users.find(u => u.uid === userId)?.name || 'Unknown';
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Production Logs for ${day}`}>
            <div className="max-h-[60vh] overflow-y-auto -mr-3 pr-3">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="p-2 font-semibold">Time</th>
                            <th className="p-2 font-semibold">Machine</th>
                            <th className="p-2 font-semibold">Operator</th>
                            <th className="p-2 font-semibold text-right">Good</th>
                            <th className="p-2 font-semibold text-right">Rejected</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-2">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                <td className="p-2">{log.machineId}</td>
                                <td className="p-2">{getOperatorName(log.userId)}</td>
                                <td className="p-2 font-semibold text-right text-green-600">{log.goodMoulds}</td>
                                <td className="p-2 font-semibold text-right text-red-600">{log.rejectedMoulds}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-end pt-4">
                <button onClick={onClose} className="px-6 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Close</button>
            </div>
        </Modal>
    );
};

export default LogDetailModal;