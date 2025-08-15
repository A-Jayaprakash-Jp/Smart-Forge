
import React, { useState } from 'react';
import Modal from '../common/Modal';
import { IncidentLog, Machine } from '../../types';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (incident: Omit<IncidentLog, 'id' | 'timestamp' | 'reportedByUserId'>) => void;
    machine: Machine;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, onSubmit, machine }) => {
    const [severity, setSeverity] = useState<IncidentLog['severity']>('Low');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!description.trim()) {
            alert('Please provide a description of the issue.');
            return;
        }
        onSubmit({
            machineId: machine.id,
            severity,
            description
        });
        onClose();
        setDescription('');
        setSeverity('Low');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Report Issue for ${machine.name}`}>
            <div className="space-y-4">
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
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="Describe the issue..."/>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-yellow hover:bg-yellow-600">Submit Report</button>
                </div>
            </div>
        </Modal>
    );
};

export default ReportIssueModal;
