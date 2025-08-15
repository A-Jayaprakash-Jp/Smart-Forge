import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { InventoryItem } from '../../types';

interface InventoryItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: InventoryItem | Omit<InventoryItem, 'id'>) => void;
    item: InventoryItem | null;
}

const InventoryItemFormModal: React.FC<InventoryItemFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});
    
    useEffect(() => {
        if (item) {
            setFormData(item);
        } else {
            setFormData({
                name: '',
                category: 'Raw Materials',
                stockLevel: 0,
                unit: 'kg',
                minStock: 0,
                maxStock: 0,
                location: '',
                unitCost: 0,
                supplier: ''
            });
        }
    }, [item, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['stockLevel', 'minStock', 'maxStock', 'unitCost'].includes(name);
        setFormData(prev => ({...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = () => {
        // Simple validation
        if (!formData.name || !formData.category || !formData.unit) {
            alert('Please fill out all required fields.');
            return;
        }

        const stockStatus = formData.stockLevel! <= formData.minStock! 
            ? 'critical' 
            : formData.stockLevel! < (formData.minStock! * 1.2) ? 'low' : 'adequate';

        const dataToSave = {
            ...formData,
            stockStatus,
            lastRestocked: formData.id ? formData.lastRestocked : new Date(), // Keep existing restock date on edit
        };
        
        onSave(dataToSave as InventoryItem);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Inventory Item' : 'Add New Inventory Item'}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto -mr-3 pr-3">
                <InputField label="Item Name" name="name" value={formData.name || ''} onChange={handleChange} />
                <SelectField label="Category" name="category" value={formData.category || 'Raw Materials'} onChange={handleChange}>
                    <option>Raw Materials</option>
                    <option>Molding Materials</option>
                    <option>Chemicals</option>
                    <option>Tools</option>
                </SelectField>
                 <div className="grid grid-cols-2 gap-4">
                    <InputField label="Current Stock" name="stockLevel" type="number" value={formData.stockLevel || 0} onChange={handleChange} />
                    <SelectField label="Unit" name="unit" value={formData.unit || 'kg'} onChange={handleChange}>
                        <option>kg</option>
                        <option>L</option>
                        <option>pcs</option>
                    </SelectField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Min Stock" name="minStock" type="number" value={formData.minStock || 0} onChange={handleChange} />
                    <InputField label="Max Stock" name="maxStock" type="number" value={formData.maxStock || 0} onChange={handleChange} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <InputField label="Location" name="location" value={formData.location || ''} onChange={handleChange} />
                    <InputField label="Unit Cost ($)" name="unitCost" type="number" value={formData.unitCost || 0} onChange={handleChange} />
                </div>
                 <InputField label="Supplier" name="supplier" value={formData.supplier || ''} onChange={handleChange} />
                 
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">Save Item</button>
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


export default InventoryItemFormModal;
