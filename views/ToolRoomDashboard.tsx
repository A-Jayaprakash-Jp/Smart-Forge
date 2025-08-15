
import React, { useMemo, useState } from 'react';
import { User, Tool, Role, Machine } from '../types';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { motion } from 'framer-motion';
import { CubeIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon, ShareIcon } from '../components/common/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useSettings } from '../hooks/useSettings';
import IssueReturnModal from '../components/tool_room/IssueReturnModal';
import { useUsers } from '../hooks/useUsers';

const KpiCard: React.FC<{title: string, value: string | number}> = ({ title, value }) => (
    <Card className="text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-4xl font-bold text-disa-red">{value}</p>
    </Card>
);

const ToolRow: React.FC<{ tool: Tool, onAction: (action: 'issue' | 'return', tool: Tool) => void }> = ({ tool, onAction }) => {
    const statusColors: Record<Tool['status'], string> = {
        Available: 'text-green-600 dark:text-green-400',
        'In Use': 'text-blue-600 dark:text-blue-400',
        'Needs Regrinding': 'text-yellow-600 dark:text-yellow-400',
        'Needs Replacement': 'text-red-600 dark:text-red-400',
        'Scrapped': 'text-gray-600 dark:text-gray-400',
    };
    const usagePercent = tool.maxUsageCycles > 0 ? (tool.currentUsageCycles / tool.maxUsageCycles) * 100 : 0;


    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td className="p-3 font-semibold">{tool.name}</td>
            <td className="p-3 font-mono text-xs">{tool.serialNumber}</td>
            <td className="p-3">
                <span className={`font-semibold ${statusColors[tool.status]}`}>
                    {tool.status}
                </span>
            </td>
            <td className="p-3">{tool.location}</td>
            <td className="p-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div className="bg-disa-accent-blue h-1.5 rounded-full" style={{width: `${usagePercent}%`}}></div>
                </div>
                <div className="text-xs text-right">{tool.currentUsageCycles}/{tool.maxUsageCycles}</div>
            </td>
            <td className="p-3 text-right">
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => onAction('issue', tool)} 
                        disabled={tool.status !== 'Available'}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white transition-colors rounded-md bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-400"
                    >
                        <ShareIcon className="w-3 h-3"/> Issue
                    </button>
                    <button 
                        onClick={() => onAction('return', tool)} 
                        disabled={tool.status !== 'In Use'}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white transition-colors rounded-md bg-disa-accent-green hover:bg-green-500 disabled:bg-gray-400"
                    >
                        <ArrowUturnLeftIcon className="w-3 h-3"/> Return
                    </button>
                </div>
            </td>
        </tr>
    );
};

const ToolRoomDashboard: React.FC<{ user: User }> = ({ user }) => {
    const { tools, machines, toolUsageLogs, issueTool, returnTool } = useProductionData();
    const { users } = useUsers();
    const { theme } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'issue' | 'return'>('issue');
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

    const operators = useMemo(() => users.filter(u => u.role === Role.Operator), [users]);

    const kpiData = useMemo(() => {
        const overdueReturns = toolUsageLogs.filter(log => {
            if (log.returnTimestamp) return false;
            const issueTime = new Date(log.issueTimestamp).getTime();
            const now = new Date().getTime();
            const hoursDiff = (now - issueTime) / (1000 * 60 * 60);
            return hoursDiff > 8; // Overdue if longer than a shift
        }).length;

        return {
            total: tools.length,
            available: tools.filter(t => t.status === 'Available').length,
            inUse: tools.filter(t => t.status === 'In Use').length,
            needsMaintenance: tools.filter(t => t.status === 'Needs Regrinding' || t.status === 'Needs Replacement').length,
            overdue: overdueReturns,
        };
    }, [tools, toolUsageLogs]);

    const toolStatusChartData = useMemo(() => [
        { name: 'Available', value: kpiData.available },
        { name: 'In Use', value: kpiData.inUse },
        { name: 'Needs Maintenance', value: kpiData.needsMaintenance },
    ], [kpiData]);

    const filteredTools = useMemo(() => {
        return tools.filter(tool => 
            tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            tool.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tools, searchTerm]);
    
    const handleOpenModal = (action: 'issue' | 'return', tool: Tool) => {
        setSelectedTool(tool);
        setModalAction(action);
        setIsModalOpen(true);
    };

    const handleIssueSubmit = (toolId: string, issuedToUserId: string, machineId: string) => {
        issueTool(toolId, issuedToUserId, user.uid, machineId);
        setIsModalOpen(false);
    };

    const handleReturnSubmit = (toolId: string) => {
        returnTool(toolId);
        setIsModalOpen(false);
    };

    const COLORS = ['#10B981', '#3b82f6', '#F59E0B'];
    const tooltipStyle = useMemo(() => (
        theme === 'light'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem' }
            : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem' }
    ), [theme]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {selectedTool && (
                <IssueReturnModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    action={modalAction}
                    tool={selectedTool}
                    operators={operators}
                    machines={machines}
                    onIssue={handleIssueSubmit}
                    onReturn={handleReturnSubmit}
                />
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <KpiCard title="Total Tools" value={kpiData.total} />
                <KpiCard title="Available" value={kpiData.available} />
                <KpiCard title="In Use" value={kpiData.inUse} />
                <KpiCard title="Needs Maintenance" value={kpiData.needsMaintenance} />
                <KpiCard title="Overdue Returns" value={kpiData.overdue} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="relative mb-4">
                        <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 top-1/2 left-3" />
                        <input type="text" placeholder="Search by name or serial number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" />
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-3 font-semibold">Tool</th>
                                    <th className="p-3 font-semibold">Serial No.</th>
                                    <th className="p-3 font-semibold">Status</th>
                                    <th className="p-3 font-semibold">Location</th>
                                    <th className="p-3 font-semibold">Usage</th>
                                    <th className="p-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredTools.map(tool => (
                                    <ToolRow key={tool.id} tool={tool} onAction={handleOpenModal} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <div className="space-y-6">
                    <Card>
                        <h3 className="font-bold text-center mb-4">Tool Status Overview</h3>
                        <div className="w-full h-64">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={toolStatusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} >
                                        {toolStatusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="font-bold mb-4">Regrind & Repair Queue</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {tools.filter(t => t.status === 'Needs Regrinding').map(tool => (
                                <div key={tool.id} className="p-2 rounded-lg bg-yellow-500/10 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{tool.name}</p>
                                        <p className="text-xs text-gray-500">{tool.serialNumber}</p>
                                    </div>
                                    <button className="px-2 py-1 text-xs font-semibold text-white bg-disa-accent-blue rounded-md">Send</button>
                                </div>
                            ))}
                            {tools.filter(t => t.status === 'Needs Regrinding').length === 0 && <p className="text-sm text-center text-gray-500 py-4">No tools are currently in the regrind queue.</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default ToolRoomDashboard;
