import React, { useMemo, useState } from 'react';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { useSettings } from '../hooks/useSettings';
import { EnergyIcon, ChartBarIcon } from '../components/common/Icons';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toLocalISOString } from '../utils/helpers';
import { Machine } from '../types';

const ENERGY_COST_PER_KWH = 0.12;

const KpiCard: React.FC<{title: string, value: string, icon: React.ElementType}> = ({ title, value, icon: Icon }) => (
    <Card className="text-center">
        <Icon className="w-12 h-12 mx-auto text-disa-accent-yellow" />
        <p className="mt-2 text-3xl font-bold text-disa-red">{value}</p>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
    </Card>
);

const PresetButton: React.FC<{label: string, onClick: () => void}> = ({ label, onClick }) => (
    <button
        onClick={onClick}
        className="px-3 py-1 text-sm font-semibold transition-colors rounded-full text-disa-accent-blue bg-disa-accent-blue/10 hover:bg-disa-accent-blue/20"
    >
        {label}
    </button>
);

const EnergyView: React.FC = () => {
    const { data, machines } = useProductionData();
    const { theme } = useSettings();
    const [filters, setFilters] = useState({
        startDate: toLocalISOString(new Date(new Date().setDate(new Date().getDate() - 7))),
        endDate: toLocalISOString(new Date()),
        machineId: 'all'
    });

    const handleDateRangePreset = (preset: '7d' | '30d' | 'this_month' | 'last_month') => {
        const today = new Date();
        let startDate = new Date();
        let endDate = new Date(); 

        switch(preset) {
            case '7d':
                startDate.setDate(today.getDate() - 6);
                break;
            case '30d':
                startDate.setDate(today.getDate() - 29);
                break;
            case 'this_month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_month':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
        }

        setFilters(prev => ({
            ...prev,
            startDate: toLocalISOString(startDate),
            endDate: toLocalISOString(endDate),
        }));
    };

    const filteredLogs = useMemo(() => {
        const startParts = filters.startDate.split('-').map(Number);
        const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0);

        const endParts = filters.endDate.split('-').map(Number);
        const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999);

        return data.logs.filter(log => {
            const dateMatch = new Date(log.timestamp) >= startDate && new Date(log.timestamp) <= endDate;
            const machineMatch = filters.machineId === 'all' || log.machineId === filters.machineId;
            return dateMatch && machineMatch;
        });
    }, [data.logs, filters]);


    const energyData = useMemo(() => {
        let totalKwh = 0;
        let totalParts = 0;
        const trend: { [key: string]: { date: Date, kWh: number, cost: number } } = {};
        const byMachine: { [key: string]: { machineName: string; kWh: number, parts: number } } = {};

        filteredLogs.forEach(log => {
            if (!log.energyConsumedKwh) return; // Skip logs without energy data
            
            const kwh = log.energyConsumedKwh;
            const parts = log.goodMoulds + log.rejectedMoulds;
            totalKwh += kwh;
            totalParts += parts;

            // Trend data
            const day = new Date(log.timestamp).toISOString().split('T')[0];
            if (!trend[day]) trend[day] = { date: new Date(day), kWh: 0, cost: 0 };
            trend[day].kWh += kwh;
            trend[day].cost += kwh * ENERGY_COST_PER_KWH;

            // By machine data
            const machineName = machines.find(m => m.id === log.machineId)?.name || log.machineId;
            if (!byMachine[log.machineId]) byMachine[log.machineId] = { machineName, kWh: 0, parts: 0 };
            byMachine[log.machineId].kWh += kwh;
            byMachine[log.machineId].parts += parts;
        });

        const kpis = {
            totalKwh,
            totalCost: totalKwh * ENERGY_COST_PER_KWH,
            avgKwhPerPart: totalParts > 0 ? totalKwh / totalParts : 0,
        };
        
        const trendChartData = Object.values(trend).sort((a,b) => a.date.getTime() - b.date.getTime());
        const machineConsumptionData = Object.values(byMachine).map(data => ({
            name: data.machineName,
            'Total kWh': data.kWh,
        }));
        const machineEfficiencyData = Object.values(byMachine).map(data => ({
            name: data.machineName,
            'kWh per Part': data.parts > 0 ? data.kWh / data.parts : 0,
        }));
        const machineTableData = Object.values(byMachine).map(data => ({
            name: data.machineName,
            totalKwh: data.kWh,
            totalParts: data.parts,
            kwhPerPart: data.parts > 0 ? data.kWh / data.parts : 0,
            totalCost: data.kWh * ENERGY_COST_PER_KWH,
        }));

        return { kpis, trendChartData, machineConsumptionData, machineEfficiencyData, machineTableData };
    }, [filteredLogs, machines]);

    const tooltipStyle = useMemo(() => (
        theme === 'light'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem' }
            : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem' }
    ), [theme]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">From</label>
                        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="p-2 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"/>
                    </div>
                     <div>
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">To</label>
                        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="p-2 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"/>
                    </div>
                    <div>
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">Machine</label>
                        <select value={filters.machineId} onChange={e => setFilters({...filters, machineId: e.target.value})} className="p-2.5 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
                            <option value="all">All Machines</option>
                            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    <PresetButton label="Last 7 Days" onClick={() => handleDateRangePreset('7d')} />
                    <PresetButton label="Last 30 Days" onClick={() => handleDateRangePreset('30d')} />
                    <PresetButton label="This Month" onClick={() => handleDateRangePreset('this_month')} />
                    <PresetButton label="Last Month" onClick={() => handleDateRangePreset('last_month')} />
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Total Energy Consumed" value={`${energyData.kpis.totalKwh.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh`} icon={EnergyIcon} />
                <KpiCard title="Total Energy Cost" value={`$${energyData.kpis.totalCost.toLocaleString('en-US', {maximumFractionDigits: 0})}`} icon={ChartBarIcon} />
                <KpiCard title="Avg. kWh per Part" value={energyData.kpis.avgKwhPerPart.toFixed(2)} icon={EnergyIcon} />
            </div>
            
            <Card>
                <h3 className="font-bold mb-4">Energy Consumption Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={energyData.trendChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} />
                        <YAxis yAxisId="left" unit=" kWh" />
                        <YAxis yAxisId="right" orientation="right" unit="$" />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="kWh" stroke="#F59E0B" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="font-bold mb-4">Total Consumption by Machine</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={energyData.machineConsumptionData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="name" />
                            <YAxis unit=" kWh" />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="Total kWh" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                 <Card>
                    <h3 className="font-bold mb-4">Energy Efficiency by Machine</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={energyData.machineEfficiencyData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="name" />
                            <YAxis unit=" kWh/Part" />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="kWh per Part" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
            
            <Card>
                 <h3 className="font-bold mb-4">Detailed Machine Breakdown</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="p-3 font-semibold">Machine</th>
                                <th className="p-3 font-semibold text-right">Total kWh</th>
                                <th className="p-3 font-semibold text-right">Total Parts</th>
                                <th className="p-3 font-semibold text-right">kWh / Part</th>
                                <th className="p-3 font-semibold text-right">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {energyData.machineTableData.map(row => (
                                <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-semibold">{row.name}</td>
                                    <td className="p-3 text-right">{row.totalKwh.toLocaleString(undefined, {maximumFractionDigits: 1})}</td>
                                    <td className="p-3 text-right">{row.totalParts.toLocaleString()}</td>
                                    <td className="p-3 text-right font-bold">{row.kwhPerPart.toFixed(3)}</td>
                                    <td className="p-3 text-right">{`$${row.totalCost.toLocaleString(undefined, {maximumFractionDigits: 2})}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </Card>
        </motion.div>
    );
};

export default EnergyView;
