import React, { useState } from 'react';
import Modal from '../common/Modal';
import { BreakdownReport, Machine, User } from '../../types';

interface BreakdownReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (report: Omit<BreakdownReport, 'id' | 'reportTimestamp' | 'status'>) => void;
    user: User;
    machines: Machine[];
}

const BreakdownReportModal: React.FC<BreakdownReportModalProps> = ({ isOpen, onClose, onSubmit, user, machines }) => {
    const [machineId, setMachineId] = useState(user.assignedMachineId || machines[0]?.id || '');
    const [type, setType] = useState<BreakdownReport['type']>('Mechanical');
    const [severity, setSeverity] = useState<BreakdownReport['severity']>('Medium');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!machineId || !description.trim()) {
            alert('Please select a machine and provide a description.');
            return;
        }
        onSubmit({
            machineId,
            reportedByUserId: user.uid,
            type,
            severity,
            description,
        });
        onClose();
        setDescription('');
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Report Machine Breakdown">
            <div className="space-y-4">
                <SelectField label="Machine" value={machineId} onChange={e => setMachineId(e.target.value)}>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </SelectField>
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Breakdown Type" value={type} onChange={e => setType(e.target.value as any)}>
                        <option>Mechanical</option>
                        <option>Electrical</option>
                        <option>Hydraulic</option>
                        <option>Pneumatic</option>
                        <option>Other</option>
                    </SelectField>
                    <SelectField label="Severity" value={severity} onChange={e => setSeverity(e.target.value as any)}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                    </SelectField>
                </div>
                 <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Description of Issue</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="Describe what happened..."/>
                </div>
                 <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700">Submit Report</button>
                </div>
            </div>
        </Modal>
    );
};


const SelectField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <select value={value} onChange={onChange} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
            {children}
        </select>
    </div>
);

export default BreakdownReportModal;