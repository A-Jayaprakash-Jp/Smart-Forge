
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { MaintenanceTask } from '../../types';
import { useProductionData } from '../../hooks/useProductionData';
import { useUsers } from '../../hooks/useUsers';

interface PmTaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: MaintenanceTask | Omit<MaintenanceTask, 'id' | 'lastCompleted' | 'nextDue' | 'status'>) => void;
    task: MaintenanceTask | null;
}

const PmTaskFormModal: React.FC<PmTaskFormModalProps> = ({ isOpen, onClose, onSave, task }) => {
    const { machines } = useProductionData();
    const { users } = useUsers();
    const [formData, setFormData] = useState<Partial<MaintenanceTask>>({});

    useEffect(() => {
        if (task) {
            setFormData(task);
        } else {
            setFormData({
                description: '',
                machineId: machines[0]?.id,
                scheduleType: 'calendar',
                interval: 7,
                assignedToUserId: users[0]?.uid,
            });
        }
    }, [task, isOpen, machines, users]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['interval'].includes(name);
        setFormData(prev => ({...prev, [name]: isNumeric ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = () => {
        if (!formData.description || !formData.machineId || !formData.interval || formData.interval <= 0) {
            alert('Please fill all fields with valid values.');
            return;
        }
        onSave(formData as any);
    };

    const scheduleUnit = formData.scheduleType === 'calendar' ? 'Days' : 'Hours';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit PM Schedule' : 'Create New PM Schedule'}>
            <div className="space-y-4">
                <InputField label="Task Description" name="description" value={formData.description || ''} onChange={handleChange} />
                <SelectField label="Machine" name="machineId" value={formData.machineId || ''} onChange={handleChange}>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </SelectField>
                <SelectField label="Assigned To" name="assignedToUserId" value={formData.assignedToUserId || ''} onChange={handleChange}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.uid} value={u.uid}>{u.name}</option>)}
                </SelectField>
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Schedule Type" name="scheduleType" value={formData.scheduleType || 'calendar'} onChange={handleChange}>
                        <option value="calendar">Calendar-based</option>
                        <option value="runtime">Runtime-based</option>
                    </SelectField>
                    <InputField label={`Interval (${scheduleUnit})`} name="interval" type="number" value={formData.interval || 0} onChange={handleChange} />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">Save Schedule</button>
                </div>
            </div>
        </Modal>
    );
};

const InputField: React.FC<{ label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }> = ({ label, name, value, onChange, type = "text" }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <input name={name} type={type} value={value} onChange={onChange} className="w-full p-2 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" />
    </div>
);

const SelectField: React.FC<{ label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }> = ({ label, name, value, onChange, children }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <select name={name} value={value} onChange={onChange} className="w-full p-2.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
            {children}
        </select>
    </div>
);

export default PmTaskFormModal;