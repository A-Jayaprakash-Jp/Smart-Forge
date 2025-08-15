
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { MaintenanceTask } from '../../types';

interface CompleteTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (notes: string) => void;
    task: MaintenanceTask | null;
}

const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({ isOpen, onClose, onSubmit, task }) => {
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNotes('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        onSubmit(notes);
    };

    if (!task) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Complete Task: ${task.description}`}>
            <div className="space-y-4">
                <p>Add any relevant notes about the work performed. This will be saved to the maintenance history.</p>
                <div>
                    <label htmlFor="completion-notes" className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Completion Notes (Optional)</label>
                    <textarea
                        id="completion-notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={5}
                        className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                        placeholder="e.g., Replaced filter with part #F-123. Old filter was clean."
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-green hover:bg-green-600">Confirm Completion</button>
                </div>
            </div>
        </Modal>
    );
};

export default CompleteTaskModal;