
import React, { useState } from 'react';
import Modal from '../common/Modal';
import { MaintenanceRequest, Machine } from '../../types';

interface RequestMaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (request: Omit<MaintenanceRequest, 'id' | 'reportedDate' | 'status'>) => void;
    machine: Machine;
}

const RequestMaintenanceModal: React.FC<RequestMaintenanceModalProps> = ({ isOpen, onClose, onSubmit, machine }) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<MaintenanceRequest['priority']>('Medium');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!title.trim() || !description.trim()) {
            alert('Please fill out all fields.');
            return;
        }
        onSubmit({
            machineId: machine.id,
            title,
            priority,
            description,
            // These fields are typically filled by a supervisor/manager later
            type: 'Corrective',
            estimatedCost: 0,
            estimatedDurationHours: 0,
            partsRequired: [],
        });
        onClose();
        setTitle('');
        setPriority('Medium');
        setDescription('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Request Maintenance for ${machine.name}`}>
            <div className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Issue Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Loud grinding noise from conveyor" className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>Critical</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="Provide more details about the problem..."/>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700">Submit Request</button>
                </div>
            </div>
        </Modal>
    );
};

export default RequestMaintenanceModal;
