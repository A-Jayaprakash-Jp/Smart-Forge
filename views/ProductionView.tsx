import React, { useState, useMemo } from 'react';
import { User, ProductionOrder, Machine, QualityCheck } from '../types';
import { useProductionData } from '../hooks/useProductionData';
import Card from '../components/common/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, StopIcon, CheckCircleIcon, CubeIcon, CpuChipIcon, PlusIcon } from '../components/common/Icons';
import ProductionOrderFormModal from '../components/production/ProductionOrderFormModal';
import MachineDetailModal from '../components/production/MachineDetailModal';
import MachineControlModal from '../components/production/MachineControlModal';

const ProductionView: React.FC<{ user: User }> = ({ user }) => {
    const { productionOrders, machines, addProductionOrder, updateProductionOrderStatus, updateMachineStatus } = useProductionData();
    const [activeTab, setActiveTab] = useState<'orders' | 'status'>('orders');
    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(productionOrders[0] || null);
    
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [machineDetailModal, setMachineDetailModal] = useState<Machine | null>(null);
    const [machineControlModal, setMachineControlModal] = useState<Machine | null>(null);

    const kpiData = useMemo(() => {
        const activeOrders = productionOrders.filter(o => o.status === 'In Progress').length;
        const completedToday = productionOrders.filter(o => {
             if (o.status !== 'Completed') return false;
             // A real implementation would check the completion timestamp.
             // Here we use due date as a proxy.
             const dueDate = new Date(o.dueDate);
             const today = new Date();
             return dueDate.getDate() === today.getDate() && dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
        }).length;
        const runningMachines = machines.filter(m => m.status === 'Running').length;
        
        return { activeOrders, completedToday, runningMachines };
    }, [productionOrders, machines]);

    return (
        <div className="space-y-6">
            <ProductionOrderFormModal isOpen={isNewOrderModalOpen} onClose={() => setIsNewOrderModalOpen(false)} onSubmit={addProductionOrder} />
            {machineDetailModal && <MachineDetailModal machine={machineDetailModal} onClose={() => setMachineDetailModal(null)} />}
            {machineControlModal && <MachineControlModal machine={machineControlModal} onClose={() => setMachineControlModal(null)} onSave={updateMachineStatus} />}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Active Orders" value={kpiData.activeOrders.toString()} />
                <KpiCard title="Completed Today" value={kpiData.completedToday.toString()} />
                <KpiCard title="Running Machines" value={kpiData.runningMachines.toString()} />
            </div>

            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center border-b border-disa-light-border dark:border-disa-dark-border">
                    <div className="flex">
                        <TabButton id="orders" label="Production Orders" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                        <TabButton id="status" label="Machine Status" isActive={activeTab === 'status'} onClick={() => setActiveTab('status')} />
                    </div>
                    {activeTab === 'orders' && (
                        <button onClick={() => setIsNewOrderModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 my-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                           <PlusIcon className="w-5 h-5"/> New Order
                        </button>
                    )}
                </div>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="pt-6"
                    >
                        {activeTab === 'orders' && <ProductionOrdersTab orders={productionOrders} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} onUpdateStatus={updateProductionOrderStatus} />}
                        {activeTab === 'status' && <MachineStatusTab machines={machines} onDetailClick={setMachineDetailModal} onControlClick={setMachineControlModal} />}
                    </motion.div>
                </AnimatePresence>
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

const TabButton: React.FC<{id: string, label: string, isActive: boolean, onClick: () => void}> = ({id, label, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 font-semibold transition-colors ${isActive ? 'text-disa-red border-b-2 border-disa-red' : 'text-gray-500 hover:text-disa-red border-b-2 border-transparent'}`}
    >
        {label}
    </button>
);

const ProductionOrdersTab: React.FC<{orders: ProductionOrder[], selectedOrder: ProductionOrder | null, setSelectedOrder: (order: ProductionOrder | null) => void, onUpdateStatus: (orderId: string, status: ProductionOrder['status']) => void}> = ({ orders, selectedOrder, setSelectedOrder, onUpdateStatus }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {orders.map(order => <OrderCard key={order.id} order={order} isSelected={selectedOrder?.id === order.id} onClick={() => setSelectedOrder(order)} />)}
            </div>
            <div className="lg:col-span-2">
                {selectedOrder ? <OrderDetailCard order={selectedOrder} onUpdateStatus={onUpdateStatus} /> : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 rounded-lg bg-gray-500/10">
                        <div>
                            <CubeIcon className="w-16 h-16 mx-auto mb-2" />
                            <p className="font-semibold">Select an order to see details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const OrderCard: React.FC<{order: ProductionOrder, isSelected: boolean, onClick: () => void}> = ({ order, isSelected, onClick }) => {
    const progress = order.quantity.target > 0 ? (order.quantity.produced / order.quantity.target) * 100 : 0;
    const priorityColors = {
        high: 'bg-red-500',
        medium: 'bg-yellow-500',
        low: 'bg-green-500'
    };
    return (
        <button onClick={onClick} className={`w-full text-left p-4 rounded-lg transition-all border-2 ${isSelected ? 'border-disa-red bg-disa-red/10' : 'border-transparent bg-gray-500/10 hover:bg-gray-500/20'}`}>
            <div className="flex justify-between items-start">
                <p className="font-bold text-gray-800 dark:text-white">{order.id}</p>
                <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${priorityColors[order.priority]}`}>{order.priority}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{order.partDescription}</p>
            <div className="mt-4">
                <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2.5 dark:bg-gray-700 mt-1">
                    <div className="bg-disa-accent-blue h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{order.quantity.produced}/{order.quantity.target}</span>
                    <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                </div>
            </div>
        </button>
    );
};

const OrderDetailCard: React.FC<{order: ProductionOrder, onUpdateStatus: (orderId: string, status: ProductionOrder['status']) => void}> = ({ order, onUpdateStatus }) => {
    const progress = order.quantity.target > 0 ? (order.quantity.produced / order.quantity.target) * 100 : 0;
    
    return (
        <Card className="h-full">
            <h3 className="text-xl font-bold">{order.id}</h3>
            <p className="text-gray-500 dark:text-gray-400">{order.partDescription}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <InfoItem label="Customer" value={order.customer} />
                <InfoItem label="Part Number" value={order.partNumber} />
                <InfoItem label="Quantity" value={`${order.quantity.produced} / ${order.quantity.target}`} />
                <InfoItem label="Status" value={order.status} />
            </div>

            <div className="mt-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</p>
                <div className="w-full bg-gray-300 rounded-full h-4 dark:bg-gray-700 mt-1">
                    <div className="bg-disa-accent-green h-4 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ width: `${progress}%` }}>
                        {progress.toFixed(0)}%
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quality Checks</p>
                <div className="flex gap-2 mt-2">
                    {order.qualityChecks?.map(qc => <QualityCheckPill key={qc.name} name={qc.name} status={qc.status} />)}
                </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
                <motion.button onClick={() => onUpdateStatus(order.id, 'In Progress')} disabled={order.status === 'In Progress' || order.status === 'Completed'} whileTap={{scale:0.95}} className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-500"><PlayIcon className="w-5 h-5"/> Start</motion.button>
                <motion.button onClick={() => onUpdateStatus(order.id, 'Paused')} disabled={order.status !== 'In Progress'} whileTap={{scale:0.95}} className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-yellow hover:bg-yellow-500 disabled:bg-gray-500"><PauseIcon className="w-5 h-5"/> Pause</motion.button>
                <motion.button onClick={() => onUpdateStatus(order.id, 'Completed')} disabled={order.status === 'Completed'} whileTap={{scale:0.95}} className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700 disabled:bg-gray-500"><StopIcon className="w-5 h-5"/> Stop</motion.button>
            </div>
        </Card>
    );
};

const InfoItem: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold text-gray-800 dark:text-white">{value}</p>
    </div>
);

const QualityCheckPill: React.FC<{name: string, status: QualityCheck['status']}> = ({ name, status }) => {
    const statusClasses = {
        pending: 'bg-gray-400/20 text-gray-500 dark:text-gray-400',
        passed: 'bg-green-500/20 text-green-600 dark:text-green-400',
        failed: 'bg-red-500/20 text-red-600 dark:text-red-400'
    };
    const label = name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    return (
        <span className={`flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status]}`}>
            {status === 'passed' && <CheckCircleIcon className="w-4 h-4" />}
            {label}
        </span>
    );
};

const MachineStatusTab: React.FC<{machines: Machine[], onDetailClick: (machine: Machine) => void, onControlClick: (machine: Machine) => void}> = ({ machines, onDetailClick, onControlClick }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map(machine => <MachineCard key={machine.id} machine={machine} onDetailClick={onDetailClick} onControlClick={onControlClick} />)}
    </div>
);

const MachineCard: React.FC<{machine: Machine, onDetailClick: (machine: Machine) => void, onControlClick: (machine: Machine) => void}> = ({ machine, onDetailClick, onControlClick }) => {
    // Mock data for display
    const oee = { score: 87.3, efficiency: 92.5, rate: machine.mouldsPerHour };
    const statusClasses = {
        Running: 'border-green-500',
        Idle: 'border-yellow-500',
        Down: 'border-red-500'
    }

    return (
        <Card className={`border-l-4 ${statusClasses[machine.status]}`}>
            <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold flex items-center gap-2"><CpuChipIcon className="w-6 h-6" /> {machine.name}</h4>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${machine.status === 'Running' ? 'bg-green-500/20 text-green-600' : machine.status === 'Idle' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-red-600'}`}>
                    {machine.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <InfoItem label="OEE Score" value={`${oee.score}%`} />
                <InfoItem label="Efficiency" value={`${oee.efficiency}%`} />
            </div>

            <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Production Rate</p>
                <div className="w-full bg-gray-300 rounded-full h-2.5 dark:bg-gray-700 mt-1">
                    <div className="bg-disa-accent-green h-2.5 rounded-full" style={{ width: `${(oee.rate/250)*100}%` }}></div>
                </div>
                 <p className="text-right text-xs text-gray-500 dark:text-gray-400">{oee.rate} moulds/hour</p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
                <motion.button onClick={() => onDetailClick(machine)} whileTap={{scale:0.95}} className="px-4 py-2 font-semibold text-gray-800 transition-colors rounded-lg dark:text-white bg-gray-500/20 hover:bg-gray-500/30">View Details</motion.button>
                <motion.button onClick={() => onControlClick(machine)} whileTap={{scale:0.95}} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">Control</motion.button>
            </div>
        </Card>
    );
};

export default ProductionView;