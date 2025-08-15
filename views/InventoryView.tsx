

import React, { useState, useMemo } from 'react';
import { User, InventoryItem } from '../types';
import { useProductionData } from '../hooks/useProductionData';
import Card from '../components/common/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, PlusIcon } from '../components/common/Icons';
import InventoryItemFormModal from '../components/inventory/InventoryItemFormModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';

const InventoryView: React.FC<{ user: User }> = ({ user }) => {
    const { inventoryItems, addInventoryItem, updateInventoryItem, removeInventoryItem, orderInventoryItem } = useProductionData();
    const { addNotification } = useNotifications();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [itemToRemove, setItemToRemove] = useState<InventoryItem | null>(null);


    const categories: ('All' | InventoryItem['category'])[] = useMemo(() => ['All', ...Array.from(new Set(inventoryItems.map(i => i.category)))], [inventoryItems]);

    const filteredItems = useMemo(() => {
        return inventoryItems.filter(item => {
            const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
            const searchMatch = searchTerm === '' || 
                                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.id.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [inventoryItems, activeCategory, searchTerm]);
    
    const kpiData = useMemo(() => {
        const totalValue = inventoryItems.reduce((sum, item) => sum + (item.stockLevel * item.unitCost), 0);
        const lowStock = inventoryItems.filter(i => i.stockStatus !== 'adequate').length;
        return {
            totalItems: inventoryItems.length,
            lowStock,
            totalValue,
            categories: categories.length - 1
        };
    }, [inventoryItems, categories]);

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setFormModalOpen(true);
    };

    const handleOpenEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setFormModalOpen(true);
    };
    
    const handleSaveItem = (itemData: InventoryItem | Omit<InventoryItem, 'id'>) => {
        if ('id' in itemData) {
            updateInventoryItem(itemData);
             addNotification({ title: 'Item Updated', message: `${itemData.name} has been updated.`, type: 'success' });
        } else {
            addInventoryItem(itemData);
            addNotification({ title: 'Item Added', message: `${itemData.name} has been added to inventory.`, type: 'success' });
        }
        setFormModalOpen(false);
    };

    const handleRemoveConfirm = () => {
        if (itemToRemove) {
            removeInventoryItem(itemToRemove.id);
            addNotification({ title: 'Item Removed', message: `${itemToRemove.name} has been removed.`, type: 'info' });
            setItemToRemove(null);
        }
    };
    
    const handleOrder = (item: InventoryItem) => {
        const orderQty = item.maxStock - item.stockLevel;
        orderInventoryItem(item.id, orderQty);
        addNotification({ title: 'Order Placed', message: `Order for ${orderQty} ${item.unit} of ${item.name} has been placed.`, type: 'success' });
    };

    return (
        <div className="space-y-6">
            <InventoryItemFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSave={handleSaveItem}
                item={editingItem}
            />
             <ConfirmationModal
                isOpen={!!itemToRemove}
                onClose={() => setItemToRemove(null)}
                onConfirm={handleRemoveConfirm}
                title={`Remove ${itemToRemove?.name}?`}
             >
                <p>Are you sure you want to remove this item from the inventory? This action cannot be undone.</p>
             </ConfirmationModal>

             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total Items" value={kpiData.totalItems.toString()} />
                <KpiCard title="Low Stock Alerts" value={kpiData.lowStock.toString()} />
                <KpiCard title="Total Value" value={`$${kpiData.totalValue.toLocaleString('en-US', {maximumFractionDigits: 0})}`} />
                <KpiCard title="Categories" value={kpiData.categories.toString()} />
            </div>
            
            <Card>
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="relative w-full md:max-w-xs">
                        <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 top-1/2 left-3" />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                        />
                    </div>
                     <div className="flex-shrink-0 p-1 rounded-lg bg-gray-200/50 dark:bg-black/20">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeCategory === cat ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleOpenAddModal} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                        <PlusIcon className="w-5 h-5" /> Add Item
                    </button>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 max-h-[65vh] overflow-y-auto pr-2">
                    {filteredItems.map(item => (
                        <InventoryItemCard 
                            key={item.id} 
                            item={item} 
                            onEdit={handleOpenEditModal}
                            onRemove={setItemToRemove}
                            onOrder={handleOrder}
                        />
                    ))}
                </div>
            </Card>
        </div>
    );
};

const KpiCard: React.FC<{title: string, value: string}> = ({ title, value }) => (
    <Card className="text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-4xl font-bold text-disa-red">{value}</p>
    </Card>
);

const InventoryItemCard: React.FC<{
    item: InventoryItem, 
    onEdit: (item: InventoryItem) => void,
    onRemove: (item: InventoryItem) => void,
    onOrder: (item: InventoryItem) => void,
}> = ({ item, onEdit, onRemove, onOrder }) => {
    const stockPercentage = item.maxStock > 0 ? (item.stockLevel / item.maxStock) * 100 : 0;
    const statusColors = {
        adequate: { bg: 'bg-green-500/20', text: 'text-green-600 dark:text-green-400', progress: 'bg-disa-accent-green' },
        low: { bg: 'bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', progress: 'bg-disa-accent-yellow' },
        critical: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400', progress: 'bg-disa-red' }
    };
    const currentStatus = statusColors[item.stockStatus];

    return (
        <Card className="flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.id}</p>
                    <h4 className="font-bold text-gray-800 dark:text-white">{item.name}</h4>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
                    {item.stockStatus}
                </span>
            </div>
            
            <div className="my-4">
                <div className="flex justify-between items-end">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">{item.stockLevel}</span>
                    <span className="font-semibold text-gray-500 dark:text-gray-400">{item.unit}</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-1.5 dark:bg-gray-700 mt-1">
                    <div className={`${currentStatus.progress} h-1.5 rounded-full`} style={{ width: `${stockPercentage}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Min: {item.minStock}</span>
                    <span>Max: {item.maxStock}</span>
                </div>
            </div>

            <div className="mt-auto space-y-2 text-sm">
                 <InfoRow label="Location" value={item.location} />
                 <InfoRow label="Unit Cost" value={`$${item.unitCost}`} />
                 <InfoRow label="Supplier" value={item.supplier} />
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => onRemove(item)} className="px-3 py-1 text-sm font-semibold text-red-600 transition-colors rounded-md bg-red-500/20 hover:bg-red-500/30">Remove</button>
                <button onClick={() => onEdit(item)} className="px-3 py-1 text-sm font-semibold text-gray-700 transition-colors rounded-md dark:text-gray-300 bg-gray-500/20 hover:bg-gray-500/30">Edit</button>
                <button onClick={() => onOrder(item)} className="px-3 py-1 text-sm font-semibold text-white transition-colors rounded-md bg-disa-accent-blue hover:bg-blue-500">Order</button>
            </div>

        </Card>
    );
};

const InfoRow: React.FC<{label: string, value: string | number}> = ({ label, value }) => (
    <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-white">{value}</span>
    </div>
);


export default InventoryView;