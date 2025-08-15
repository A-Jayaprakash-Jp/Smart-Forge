import React, { useState, useMemo } from 'react';
import Card from '../components/common/Card';
import { BeakerIcon, ChartPieIcon, CheckCircleIcon, XCircleIcon, CubeIcon, ClockIcon, ClipboardDocumentListIcon, ShieldCheckIcon } from '../components/common/Icons';
import { useProductionData } from '../hooks/useProductionData';
import { User, ProductionOrder, QualityCheck } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { useSettings } from '../hooks/useSettings';
import QualityCheckUpdateModal from '../components/production/QualityCheckUpdateModal';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutInspectionTab from '../components/quality/LayoutInspectionTab';
import QmsDocumentsTab from '../components/quality/QmsDocumentsTab';

const QualityStatusIcon: React.FC<{ status: QualityCheck['status'] }> = ({ status }) => {
    switch (status) {
        case 'passed':
            return <CheckCircleIcon className="w-6 h-6 text-green-500" title="Passed" />;
        case 'failed':
            return <XCircleIcon className="w-6 h-6 text-red-500" title="Failed" />;
        case 'pending':
        default:
            return <ClockIcon className="w-6 h-6 text-gray-400" title="Pending" />;
    }
};

const QualityView: React.FC<{ user: User }> = ({ user }) => {
    const { productionOrders, data, updateProductionOrderQualityCheck } = useProductionData();
    const { theme } = useSettings();
    const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
    const [activeTab, setActiveTab] = useState<'checks' | 'layout' | 'docs'>('layout');

    const rejectionData = useMemo(() => {
        const reasons = data.logs.flatMap(l => l.rejectionReason || []);
        const counts = reasons.reduce<Record<string, number>>((acc, reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [data.logs]);
    
    const qualityKpis = useMemo(() => {
        let totalChecks = 0;
        let passedChecks = 0;
        productionOrders.forEach(order => {
            order.qualityChecks?.forEach(qc => {
                totalChecks++;
                if (qc.status === 'passed') passedChecks++;
            });
        });
        const passRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;
        return { totalChecks, passedChecks, passRate };
    }, [productionOrders]);

    const COLORS = ['#C8102E', '#3b82f6', '#10B981', '#F59E0B', '#8B5CF6'];

    const tooltipStyle = useMemo(() => (
        theme === 'light'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem' }
            : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem' }
    ), [theme]);

    return (
        <div className="space-y-6">
            <QualityCheckUpdateModal 
                isOpen={!!editingOrder}
                onClose={() => setEditingOrder(null)}
                order={editingOrder}
                onUpdateCheck={updateProductionOrderQualityCheck}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Overall Pass Rate" value={`${qualityKpis.passRate.toFixed(1)}%`} icon={CheckCircleIcon} />
                <KpiCard title="Total Checks Passed" value={qualityKpis.passedChecks.toLocaleString()} icon={BeakerIcon} />
                <KpiCard title="Top Rejection Reason" value={rejectionData[0]?.name || 'N/A'} icon={ChartPieIcon} />
            </div>
            
            <Card>
                <div className="flex flex-wrap border-b border-disa-light-border dark:border-disa-dark-border">
                    <TabButton id="layout" icon={ShieldCheckIcon} label="Layout Inspection" isActive={activeTab === 'layout'} onClick={() => setActiveTab('layout')} />
                    <TabButton id="docs" icon={ClipboardDocumentListIcon} label="QMS Documents" isActive={activeTab === 'docs'} onClick={() => setActiveTab('docs')} />
                    <TabButton id="checks" icon={CubeIcon} label="Product Checks" isActive={activeTab === 'checks'} onClick={() => setActiveTab('checks')} />
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
                        {activeTab === 'checks' && (
                             <ProductChecksTab
                                productionOrders={productionOrders}
                                rejectionData={rejectionData}
                                tooltipStyle={tooltipStyle}
                                colors={COLORS}
                                onUpdateClick={setEditingOrder}
                            />
                        )}
                        {activeTab === 'layout' && <LayoutInspectionTab user={user} />}
                        {activeTab === 'docs' && <QmsDocumentsTab user={user} />}
                    </motion.div>
                </AnimatePresence>
            </Card>
        </div>
    );
};

const TabButton: React.FC<{id: string, label: string, icon: React.ElementType, isActive: boolean, onClick: () => void}> = ({id, label, icon: Icon, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${isActive ? 'text-disa-red border-b-2 border-disa-red' : 'text-gray-500 hover:text-disa-red border-b-2 border-transparent'}`}
    >
        <Icon className="w-5 h-5" />
        {label}
    </button>
);

const ProductChecksTab: React.FC<{
    productionOrders: ProductionOrder[],
    rejectionData: any[],
    tooltipStyle: object,
    colors: string[],
    onUpdateClick: (order: ProductionOrder) => void,
}> = ({ productionOrders, rejectionData, tooltipStyle, colors, onUpdateClick }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Product Quality Checks
            </h3>
            <div className="overflow-x-auto max-h-[65vh]">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="p-3 font-semibold">Order ID</th>
                            <th className="p-3 font-semibold">Product</th>
                            <th className="p-3 font-semibold text-center">Dimensional</th>
                            <th className="p-3 font-semibold text-center">Surface</th>
                            <th className="p-3 font-semibold text-center">Pressure</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {productionOrders.map(order => {
                            const dimensional = order.qualityChecks?.find(q => q.name === 'dimensional_check')?.status || 'pending';
                            const surface = order.qualityChecks?.find(q => q.name === 'surface_finish')?.status || 'pending';
                            const pressure = order.qualityChecks?.find(q => q.name === 'pressure_test')?.status || 'pending';

                            return (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-semibold">{order.id}</td>
                                    <td className="p-3">{order.partDescription}</td>
                                    <td className="p-3 text-center"><QualityStatusIcon status={dimensional} /></td>
                                    <td className="p-3 text-center"><QualityStatusIcon status={surface} /></td>
                                    <td className="p-3 text-center"><QualityStatusIcon status={pressure} /></td>
                                    <td className="p-3">{order.status}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => onUpdateClick(order)}
                                            className="px-3 py-1 text-xs font-semibold text-white transition-colors rounded-md bg-disa-accent-blue hover:bg-blue-500"
                                        >
                                            Update
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
        <div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ChartPieIcon className="w-6 h-6 text-disa-red" />
                Top Rejection Reasons
            </h3>
            <div className="w-full h-80 mt-4">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={rejectionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label>
                            {rejectionData.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

const KpiCard: React.FC<{title: string, value: string, icon: React.ElementType}> = ({ title, value, icon: Icon }) => (
    <Card className="text-center">
        <Icon className="w-12 h-12 mx-auto text-disa-accent-blue" />
        <p className="mt-2 text-3xl font-bold text-disa-red">{value}</p>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
    </Card>
);

export default QualityView;