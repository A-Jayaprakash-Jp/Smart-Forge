

import React, { useState, useMemo } from 'react';
import { useProductionData } from '../hooks/useProductionData';
import { useUsers } from '../hooks/useUsers';
import { ProductionLog, User } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import ProductionLogForm from '../components/operator/ProductionLogForm';
import { ShieldCheckIcon, PencilSquareIcon, CheckIcon, XMarkIcon, InformationCircleIcon, CloudArrowUpIcon } from '../components/common/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsPendingSync } from '../hooks/useIsPendingSync';

const ValidationView: React.FC<{ user: User }> = ({ user }) => {
    const { data, approveProductionLog, rejectProductionLog, updateProductionLog } = useProductionData();
    const { users } = useUsers();
    
    const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);
    const [rejectingLog, setRejectingLog] = useState<ProductionLog | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState('');

    const pendingLogs = useMemo(() => {
        return data.logs.filter(log => log.status === 'Pending').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [data.logs]);
    
    const handleApprove = (logId: string) => {
        approveProductionLog(logId, user.uid);
    };

    const handleStartReject = (log: ProductionLog) => {
        setRejectingLog(log);
        setRejectionNotes('');
    };

    const handleConfirmReject = () => {
        if (rejectingLog) {
            rejectProductionLog(rejectingLog.id, user.uid, rejectionNotes);
            setRejectingLog(null);
        }
    };

    const handleEdit = (log: ProductionLog) => {
        setEditingLog(log);
    };
    
    const handleUpdateLog = (updatedData: Omit<ProductionLog, 'id' | 'timestamp'>) => {
        if (editingLog) {
            // We need to merge the new data with the old log, preserving its ID and timestamp
            const finalLog = {
                ...editingLog,
                ...updatedData,
                status: 'Pending' as const, // Ensure status remains pending after edit
            };
            updateProductionLog(finalLog);
            setEditingLog(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <ShieldCheckIcon className="w-8 h-8 text-disa-accent-blue" />
                    Pending Production Logs ({pendingLogs.length})
                </h2>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Review and validate logs submitted by operators.</p>
            </Card>

            <AnimatePresence>
                {pendingLogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingLogs.map(log => (
                            <motion.div key={log.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <LogCard 
                                    log={log}
                                    operator={users.find(u => u.uid === log.userId)}
                                    onApprove={() => handleApprove(log.id)}
                                    onReject={() => handleStartReject(log)}
                                    onEdit={() => handleEdit(log)}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                     <Card className="flex flex-col items-center justify-center py-16 text-center">
                        <InformationCircleIcon className="w-16 h-16 text-gray-400" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">All Clear!</h3>
                        <p className="text-gray-500 dark:text-gray-400">There are no pending logs to review.</p>
                    </Card>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            {editingLog && (
                <ProductionLogForm 
                    isOpen={!!editingLog}
                    onClose={() => setEditingLog(null)}
                    onSubmit={handleUpdateLog}
                    initialData={editingLog}
                    onOpenFileImporter={() => {}}
                    onOpenVoiceLogger={() => {}}
                />
            )}
            
            {/* Reject Modal */}
            <Modal isOpen={!!rejectingLog} onClose={() => setRejectingLog(null)} title="Reject Production Log">
                <div className="space-y-4">
                    <p>Please provide a reason for rejecting this log. This will be visible to the operator.</p>
                    <textarea 
                        value={rejectionNotes}
                        onChange={e => setRejectionNotes(e.target.value)}
                        rows={4}
                        className="w-full p-2 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                        placeholder="e.g., Incorrect mould count reported..."
                    />
                    <div className="flex justify-end gap-4">
                         <button onClick={() => setRejectingLog(null)} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                         <button onClick={handleConfirmReject} disabled={!rejectionNotes.trim()} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700 disabled:bg-gray-500">Confirm Rejection</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const LogCard: React.FC<{
    log: ProductionLog,
    operator?: User,
    onApprove: () => void,
    onReject: () => void,
    onEdit: () => void
}> = ({ log, operator, onApprove, onReject, onEdit }) => {
    const isPendingSync = useIsPendingSync(log.id);
    return (
        <Card className="h-full flex flex-col">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        Machine {log.machineId}
                        {isPendingSync && <CloudArrowUpIcon className="w-5 h-5 text-disa-accent-blue animate-pulse" title="Pending Sync"/>}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{log.timestamp.toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Operator: {operator?.name || 'Unknown'}</p>
                <div className="grid grid-cols-2 gap-4 my-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-300">Good Moulds</p>
                        <p className="text-2xl font-bold text-disa-accent-green">{log.goodMoulds}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-300">Rejected</p>
                        <p className="text-2xl font-bold text-disa-red">{log.rejectedMoulds}</p>
                    </div>
                </div>
                {log.notes && <p className="text-sm p-2 rounded-lg bg-gray-500/10 italic">Notes: "{log.notes}"</p>}
                {log.rejectionReason && log.rejectionReason.length > 0 && <p className="text-sm mt-2 text-red-500">Rejection Reasons: {log.rejectionReason.join(', ')}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onEdit} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition-colors rounded-md bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300">
                    <PencilSquareIcon className="w-4 h-4" /> Edit
                </button>
                <button onClick={onReject} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white transition-colors rounded-md bg-disa-red hover:bg-red-700">
                    <XMarkIcon className="w-4 h-4" /> Reject
                </button>
                <button onClick={onApprove} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white transition-colors rounded-md bg-disa-accent-green hover:bg-green-500">
                    <CheckIcon className="w-4 h-4" /> Approve
                </button>
            </div>
        </Card>
    );
}

export default ValidationView;