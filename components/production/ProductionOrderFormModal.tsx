import React, { useState } from 'react';
import Modal from '../common/Modal';
import { ProductionOrder } from '../../types';

interface ProductionOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (order: Omit<ProductionOrder, 'id' | 'status'>) => void;
}

const ProductionOrderFormModal: React.FC<ProductionOrderFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [customer, setCustomer] = useState('');
    const [partNumber, setPartNumber] = useState('');
    const [partDescription, setPartDescription] = useState('');
    const [targetQuantity, setTargetQuantity] = useState(1000);
    const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

    const handleSubmit = () => {
        if (!customer || !partNumber || !partDescription || targetQuantity <= 0) {
            alert('Please fill all fields correctly.');
            return;
        }
        onSubmit({
            customer,
            partNumber,
            partDescription,
            quantity: { target: targetQuantity, produced: 0 },
            dueDate: new Date(dueDate),
            priority,
            qualityChecks: [
                { name: 'dimensional_check', status: 'pending' },
                { name: 'surface_finish', status: 'pending' },
                { name: 'pressure_test', status: 'pending' }
            ]
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Production Order">
            <div className="space-y-4">
                <InputField label="Customer" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g., Tata Motors" />
                <InputField label="Part Number" value={partNumber} onChange={e => setPartNumber(e.target.value)} placeholder="e.g., CYL-HEAD-T4" />
                <InputField label="Part Description" value={partDescription} onChange={e => setPartDescription(e.target.value)} placeholder="e.g., Automotive Cylinder Head" />
                <InputField label="Target Quantity" type="number" value={targetQuantity} onChange={e => setTargetQuantity(Number(e.target.value))} />
                <InputField label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                <SelectField label="Priority" value={priority} onChange={e => setPriority(e.target.value as any)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </SelectField>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">Create Order</button>
                </div>
            </div>
        </Modal>
    );
};

const InputField: React.FC<{ label: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-2 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" />
    </div>
);

const SelectField: React.FC<{ label: string, value: any, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <select value={value} onChange={onChange} className="w-full p-2.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
            {children}
        </select>
    </div>
);

export default ProductionOrderFormModal;
