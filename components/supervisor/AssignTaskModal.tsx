
import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../common/Modal';
import { AssignedTask, User, Role } from '../../types';
import { useUsers } from '../../hooks/useUsers';

interface AssignTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Omit<AssignedTask, 'id' | 'isCompleted' | 'assignedAt' | 'completedAt'>) => void;
    supervisorId: string;
}

const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ isOpen, onClose, onSubmit, supervisorId }) => {
    const { users } = useUsers();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedToUserId, setAssignedToUserId] = useState('');

    const operators = useMemo(() => users.filter(u => u.role === Role.Operator), [users]);

    // Set default operator if list is not empty
    useEffect(() => {
        if (isOpen && operators.length > 0 && !assignedToUserId) {
            setAssignedToUserId(operators[0].uid);
        }
    }, [isOpen, operators, assignedToUserId]);

    const handleSubmit = () => {
        if (!title.trim() || !description.trim() || !assignedToUserId) {
            alert('Please fill out all fields.');
            return;
        }
        onSubmit({
            title,
            description,
            assignedToUserId,
            assignedByUserId: supervisorId,
        });
        // Reset and close
        setTitle('');
        setDescription('');
        setAssignedToUserId(operators[0]?.uid || '');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign New Task">
            <div className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Assign To Operator</label>
                    <select value={assignedToUserId} onChange={(e) => setAssignedToUserId(e.target.value)} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
                        {operators.map(op => <option key={op.uid} value={op.uid}>{op.name} ({op.employeeId})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Task Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="e.g., Calibrate shot valve" />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="Provide details about the task..."/>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-purple hover:bg-purple-700">Assign Task</button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignTaskModal;
