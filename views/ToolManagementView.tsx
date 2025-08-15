

import React, { useState, useMemo } from 'react';
import { User, Tool, ToolType } from '../types';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { CubeIcon, MagnifyingGlassIcon, PlusIcon } from '../components/common/Icons';

const ToolManagementView: React.FC<{ user: User }> = () => {
    const { tools } = useProductionData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeType, setActiveType] = useState<ToolType | 'All'>('All');

    const toolTypes = useMemo<(ToolType | 'All')[]>(() => {
        if (!tools) return ['All'];
        return ['All', ...Array.from(new Set(tools.map(t => t.type))) as ToolType[]];
    }, [tools]);

    const filteredTools = useMemo(() => {
        if (!tools) return [];
        return tools.filter(tool => {
            const typeMatch = activeType === 'All' || tool.type === activeType;
            const searchMatch = searchTerm === '' ||
                                tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                tool.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
            return typeMatch && searchMatch;
        });
    }, [tools, activeType, searchTerm]);

    const kpiData = useMemo(() => {
        if (!tools) return { totalTools: 0, needsAttention: 0, inUse: 0 };
        const needsAttention = tools.filter(t => t.status === 'Needs Regrinding' || t.status === 'Needs Replacement').length;
        const inUse = tools.filter(t => t.status === 'In Use').length;
        return { totalTools: tools.length, needsAttention, inUse };
    }, [tools]);
    
    if (!tools) return null; // Handle case where tools might not be loaded yet

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Total Tools" value={kpiData.totalTools} />
                <KpiCard title="Tools In Use" value={kpiData.inUse} />
                <KpiCard title="Needs Attention" value={kpiData.needsAttention} />
            </div>
            
            <Card>
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                     <div className="relative w-full md:max-w-xs">
                        <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 top-1/2 left-3" />
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                        />
                    </div>
                     <div className="flex-shrink-0 p-1 rounded-lg bg-gray-200/50 dark:bg-black/20">
                        {toolTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setActiveType(type)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeType === type ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/50'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                        <PlusIcon className="w-5 h-5" /> Add Tool
                    </button>
                 </div>
                 
                 <div className="overflow-x-auto max-h-[65vh]">
                    <table className="w-full text-sm text-left">
                         <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="p-3 font-semibold">Tool Name</th>
                                <th className="p-3 font-semibold">Serial No.</th>
                                <th className="p-3 font-semibold">Type</th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold">Usage</th>
                                <th className="p-3 font-semibold">Location</th>
                                <th className="p-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTools.map(tool => (
                                <ToolRow key={tool.id} tool={tool} />
                            ))}
                        </tbody>
                    </table>
                 </div>
            </Card>
        </div>
    );
};

const KpiCard: React.FC<{title: string, value: string | number}> = ({ title, value }) => (
    <Card className="text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-4xl font-bold text-disa-red">{value}</p>
    </Card>
);

const ToolRow: React.FC<{ tool: Tool }> = ({ tool }) => {
    const usagePercent = tool.maxUsageCycles > 0 ? (tool.currentUsageCycles / tool.maxUsageCycles) * 100 : 0;
    const statusColors = {
        Available: 'bg-green-500/20 text-green-600',
        'In Use': 'bg-blue-500/20 text-blue-600',
        'Needs Regrinding': 'bg-yellow-500/20 text-yellow-600',
        'Needs Replacement': 'bg-red-500/20 text-red-600',
        'Scrapped': 'bg-gray-500/20 text-gray-600',
    };
    
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td className="p-3 font-semibold">{tool.name}</td>
            <td className="p-3 font-mono text-xs">{tool.serialNumber}</td>
            <td className="p-3">{tool.type}</td>
            <td className="p-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[tool.status]}`}>
                    {tool.status}
                </span>
            </td>
            <td className="p-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div className="bg-disa-accent-blue h-1.5 rounded-full" style={{width: `${usagePercent}%`}}></div>
                </div>
                <div className="text-xs text-right">{tool.currentUsageCycles}/{tool.maxUsageCycles}</div>
            </td>
            <td className="p-3">{tool.location}</td>
            <td className="p-3">
                <div className="flex gap-1">
                    <button className="px-2 py-1 text-xs font-semibold rounded-md bg-gray-500/20 hover:bg-gray-500/30">Issue</button>
                    <button className="px-2 py-1 text-xs font-semibold rounded-md bg-gray-500/20 hover:bg-gray-500/30">Inspect</button>
                </div>
            </td>
        </tr>
    );
};

export default ToolManagementView;