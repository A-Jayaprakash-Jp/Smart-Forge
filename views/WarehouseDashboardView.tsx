
import React, { useMemo } from 'react';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { InventoryItem } from '../types';
import { motion } from 'framer-motion';
import { CubeIcon, ExclamationTriangleIcon } from '../components/common/Icons';

const WarehouseDashboardView: React.FC = () => {
    const { inventoryItems } = useProductionData();
    
    const castingStock = useMemo(() => {
        return inventoryItems.filter(item => item.category === 'Castings');
    }, [inventoryItems]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <Card>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Casting Stock Real-time Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Live inventory levels for the rough casting warehouse.</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {castingStock.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <StockCard item={item} />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

const StockCard: React.FC<{ item: InventoryItem }> = ({ item }) => {
    const stockPercentage = item.maxStock > 0 ? (item.stockLevel / item.maxStock) * 100 : 0;
    const statusClasses = {
        adequate: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-500', progress: 'bg-disa-accent-green' },
        low: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500', progress: 'bg-disa-accent-yellow' },
        critical: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-500', progress: 'bg-disa-red' }
    };
    const currentStatus = statusClasses[item.stockStatus];

    return (
        <Card className={`text-center border-t-8 ${currentStatus.border} ${currentStatus.bg}`}>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{item.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.location}</p>
            
            <div className="my-4">
                <p className={`text-6xl font-bold ${currentStatus.text}`}>{item.stockLevel}</p>
                <p className="font-semibold text-gray-600 dark:text-gray-300">{item.unit}</p>
            </div>
            
             <div className="w-full bg-gray-300 rounded-full h-2.5 dark:bg-gray-700 mt-1">
                <div className={`${currentStatus.progress} h-2.5 rounded-full`} style={{ width: `${stockPercentage}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Min: {item.minStock}</span>
                <span>Max: {item.maxStock}</span>
            </div>
            
            {item.stockStatus !== 'adequate' && (
                <div className={`mt-4 flex items-center justify-center gap-2 p-2 text-sm font-semibold rounded-md ${currentStatus.bg} ${currentStatus.text}`}>
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    Replenishment Needed
                </div>
            )}
        </Card>
    );
};

export default WarehouseDashboardView;