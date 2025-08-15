import React, { useState, useMemo, useCallback } from 'react';
import { User, IncidentLog, ProductionLog, DowntimeEvent, Machine } from '../types';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { useSettings } from '../hooks/useSettings';
import { generateTodaysFocus } from '../services/geminiService';
import { LightBulbIcon } from '../components/common/Icons';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { toLocalISOString, calculateOEE } from '../utils/helpers';
import LogDetailModal from '../components/manager/LogDetailModal';

const PresetButton: React.FC<{label: string, onClick: () => void}> = ({ label, onClick }) => (
    <button
        onClick={onClick}
        className="px-3 py-1 text-sm font-semibold transition-colors rounded-full text-disa-accent-blue bg-disa-accent-blue/10 hover:bg-disa-accent-blue/20"
    >
        {label}
    </button>
);

const ManagerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const { data, maintenanceTasks, machines, incidentLogs } = useProductionData();
  const { theme } = useSettings();
  const [todaysFocus, setTodaysFocus] = useState<string>('Loading AI focus tip...');
  const [filters, setFilters] = useState({
      startDate: toLocalISOString(new Date(new Date().setDate(new Date().getDate() - 7))),
      endDate: toLocalISOString(new Date()),
      machineId: 'all'
  });
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{day: string, logs: ProductionLog[]}>({day: '', logs: []});

  React.useEffect(() => {
    generateTodaysFocus(user, data, maintenanceTasks, incidentLogs)
        .then(setTodaysFocus)
        .catch(err => {
            console.error("Failed to get today's focus:", err);
            setTodaysFocus("Could not load AI focus tip. Check API key and connection.");
        });
  }, [user, data, maintenanceTasks, incidentLogs]);

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

  const { filteredData, dateRange, dailyLogMap } = useMemo(() => {
    const startParts = filters.startDate.split('-').map(Number);
    const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0);

    const endParts = filters.endDate.split('-').map(Number);
    const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999);
    
    const { machineId } = filters;
    const approvedLogs = data.logs.filter(log => log.status === 'Approved');
    const logsByDay: Map<string, ProductionLog[]> = new Map();

    const filterByDateAndMachine = (items: (ProductionLog | DowntimeEvent | IncidentLog)[]) => {
        return items.filter(item => {
            const date = 'timestamp' in item ? new Date(item.timestamp) : new Date(item.start);
            const dateMatch = date >= startDate && date <= endDate;
            const machineMatch = machineId === 'all' || ('machineId' in item && item.machineId === machineId);
            
            if (dateMatch && machineMatch && 'timestamp' in item) {
                const dayKey = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (!logsByDay.has(dayKey)) {
                    logsByDay.set(dayKey, []);
                }
                logsByDay.get(dayKey)!.push(item as ProductionLog);
            }

            return dateMatch && machineMatch;
        });
    };
    
    return {
        filteredData: {
            logs: filterByDateAndMachine(approvedLogs) as ProductionLog[],
            downtime: filterByDateAndMachine(data.downtime) as DowntimeEvent[],
            incidents: filterByDateAndMachine(incidentLogs) as IncidentLog[],
        },
        dateRange: { startDate, endDate },
        dailyLogMap: logsByDay
    }
  }, [data, incidentLogs, filters]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
        const day = data.activePayload[0].payload.name;
        const logsForDay = dailyLogMap.get(day) || [];
        setSelectedDayData({ day, logs: logsForDay });
        setDetailModalOpen(true);
    }
  };

  const chartData = useMemo(() => {
    const dailyData: { [key: string]: { good: number, rejected: number, target: number, cost: number } } = {};
    const downtimeReasons: { [key: string]: number } = {};
    const incidentSeverities: { [key: string]: number } = {};
    const oeeTrend: { name: string, OEE: number }[] = [];

    const diffTime = Math.abs(dateRange.endDate.getTime() - dateRange.startDate.getTime());
    const dayDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= dayDiff; i++) {
        const d = new Date(dateRange.startDate);
        d.setDate(d.getDate() + i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyData[key] = { good: 0, rejected: 0, target: 1100, cost: 0 };
        
        const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
        const dayLogs = filteredData.logs.filter(l => new Date(l.timestamp) >= dayStart && new Date(l.timestamp) <= dayEnd);
        const dayDowntime = filteredData.downtime.filter(dt => new Date(dt.start) >= dayStart && new Date(dt.start) <= dayEnd);
        oeeTrend.push({ name: key, OEE: calculateOEE(dayLogs, dayDowntime, machines, dayStart, dayEnd, filters.machineId) * 100 });
    }

    filteredData.logs.forEach(log => {
      const key = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyData[key]) {
        dailyData[key].good += log.goodMoulds;
        dailyData[key].rejected += log.rejectedMoulds;
        dailyData[key].cost += log.cost || 0;
      }
    });

    filteredData.downtime.forEach(dt => {
      const duration = ((dt.end || new Date()).getTime() - dt.start.getTime()) / 60000;
      downtimeReasons[dt.reason] = (downtimeReasons[dt.reason] || 0) + duration;
    });

    filteredData.incidents.forEach(inc => {
        incidentSeverities[inc.severity] = (incidentSeverities[inc.severity] || 0) + 1;
    });
    
    const productionVsTargetData = Object.entries(dailyData).map(([name, values]) => ({ name, 'Produced': values.good, 'Target': values.target }));
    const costData = Object.entries(dailyData).map(([name, values]) => ({ name, 'Cost': values.cost }));
    const downtimeByCategoryData = Object.entries(downtimeReasons).map(([name, minutes]) => ({ name, value: Math.round(minutes) })).sort((a,b) => b.value - a.value).slice(0, 7);
    const incidentsBySeverityData = Object.entries(incidentSeverities).map(([name, value]) => ({ name, value }));
    
    return { productionVsTargetData, downtimeByCategoryData, incidentsBySeverityData, oeeTrend, costData };

  }, [filteredData, dateRange, machines, filters.machineId]);

  const tooltipStyle = useMemo(() => (
    theme === 'light' 
    ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }
    : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }
  ), [theme]);
  
  const PIE_COLORS = ['#C8102E', '#3b82f6', '#10B981', '#F59E0B', '#8B5CF6'];


    return (
        <>
        <LogDetailModal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} day={selectedDayData.day} logs={selectedDayData.logs} />
        <div className="mb-4">
            <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-900 font-bold text-lg w-fit shadow">Manager Dashboard</div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card className="bg-gradient-to-r from-disa-accent-purple/80 to-disa-accent-blue/80 text-white">
        <div className="flex items-center gap-4">
            <LightBulbIcon className="w-8 h-8 text-yellow-300 flex-shrink-0" />
            <div>
                <h3 className="font-bold">Today's Focus</h3>
                <p className="text-lg">{todaysFocus}</p>
            </div>
        </div>
      </Card>

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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-bold mb-4">OEE Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.oeeTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleBarClick} className="cursor-pointer">
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis dataKey="name" />
                    <YAxis unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="OEE" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
          </Card>
           <Card>
            <h3 className="font-bold mb-4">Production Output vs. Target</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.productionVsTargetData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleBarClick} className="cursor-pointer">
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={tooltipStyle}/>
                    <Legend />
                    <Bar dataKey="Produced" fill="#10B981" />
                    <Bar dataKey="Target" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
          </Card>
           <Card>
            <h3 className="font-bold mb-4">Downtime by Category (Top 7)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={chartData.downtimeByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {chartData.downtimeByCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} min`}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </Card>
           <Card>
            <h3 className="font-bold mb-4">Cost Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.costData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis dataKey="name" />
                    <YAxis unit="$" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="Cost" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="font-bold mb-4">Incidents by Severity</h3>
            <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                    <Pie data={chartData.incidentsBySeverityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {chartData.incidentsBySeverityData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </Card>
      </div>
    </motion.div>
    </>
  );
};

export default ManagerDashboard;