
import React from 'react';
import Modal from '../common/Modal';
import { ProductionOrder, QualityCheck } from '../../types';
import { CheckCircleIcon, XCircleIcon } from '../common/Icons';

interface QualityCheckUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: ProductionOrder | null;
    onUpdateCheck: (orderId: string, checkName: QualityCheck['name'], status: QualityCheck['status']) => void;
}

const QualityCheckUpdateModal: React.FC<QualityCheckUpdateModalProps> = ({ isOpen, onClose, order, onUpdateCheck }) => {
    if (!order) return null;

    const checkLabels: Record<QualityCheck['name'], string> = {
        'dimensional_check': 'Dimensional Check',
        'surface_finish': 'Surface Finish',
        'pressure_test': 'Pressure Test'
    };

    const defaultChecks: QualityCheck[] = [
        { name: 'dimensional_check', status: 'pending' },
        { name: 'surface_finish', status: 'pending' },
        { name: 'pressure_test', status: 'pending' },
    ];

    const allChecks: QualityCheck[] = defaultChecks.map(defaultCheck => 
        order.qualityChecks?.find(qc => qc.name === defaultCheck.name) || defaultCheck
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Update Quality Checks for ${order.id}`}>
            <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">Update the status for each quality check below.</p>
                {allChecks.map(qc => (
                    <div key={qc.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-500/10">
                        <span className="font-semibold text-gray-800 dark:text-white">{checkLabels[qc.name]}</span>
                        {qc.status === 'pending' ? (
                            <div className="flex gap-2">
                                <button onClick={() => onUpdateCheck(order.id, qc.name, 'passed')} className="px-3 py-1 text-sm font-semibold text-white bg-disa-accent-green rounded-md hover:bg-green-500">Pass</button>
                                <button onClick={() => onUpdateCheck(order.id, qc.name, 'failed')} className="px-3 py-1 text-sm font-semibold text-white bg-disa-red rounded-md hover:bg-red-700">Fail</button>
                            </div>
                        ) : (
                            <span className={`flex items-center gap-2 text-sm font-bold ${qc.status === 'passed' ? 'text-green-500' : 'text-red-500'}`}>
                                {qc.status === 'passed' ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                                {qc.status.charAt(0).toUpperCase() + qc.status.slice(1)}
                            </span>
                        )}
                    </div>
                ))}
                 <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-6 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Done</button>
                </div>
            </div>
        </Modal>
    );
};

export default QualityCheckUpdateModal;