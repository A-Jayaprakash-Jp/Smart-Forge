

import React, { useMemo, useState } from 'react';
import { useProductionData } from '../hooks/useProductionData';
import { useSettings } from '../hooks/useSettings';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import AnalyticsToolbar, { ReportFilters } from '../components/analytics/AnalyticsToolbar';
import Card from '../components/common/Card';
import { toLocalISOString } from '../utils/helpers';

const PerformanceAnalysisView: React.FC = () => {
    const { data, machines } = useProductionData();
    const { theme } = useSettings();
    const [filters, setFilters] = useState<ReportFilters>({
        startDate: toLocalISOString(new Date(new Date().setDate(new Date().getDate() - 7))),
        endDate: toLocalISOString(new Date()),
        chartType: 'bar',
        machineId: 'all'
    });

    const tooltipStyle = useMemo(() => (
        theme === 'light'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem' }
            : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem' }
    ), [theme]);

    const { filteredLogs, filteredDowntime } = useMemo(() => {
        const [startYear, startMonth, startDay] = filters.startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = filters.endDate.split('-').map(Number);
        const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

        const logs = data.logs.filter(log => {
            const dateMatch = log.timestamp >= startDate && log.timestamp <= endDate;
            const machineMatch = filters.machineId === 'all' || log.machineId === filters.machineId;
            return dateMatch && machineMatch;
        });

        const downtime = data.downtime.filter(dt => {
            const dateMatch = dt.start >= startDate && dt.start <= endDate;
            const machineMatch = filters.machineId === 'all' || dt.machineId === filters.machineId;
            return dateMatch && machineMatch;
        });
        
        return { filteredLogs: logs, filteredDowntime: downtime };
    }, [data.logs, data.downtime, filters]);


    const chartData = useMemo(() => {
        const trendData: { [key: string]: { Good: number, Rejected: number } } = {};
        filteredLogs.forEach(log => {
            const key = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!trendData[key]) trendData[key] = { Good: 0, Rejected: 0 };
            trendData[key].Good += log.goodMoulds;
            trendData[key].Rejected += log.rejectedMoulds;
        });
        return Object.entries(trendData).map(([name, values]) => ({ name, ...values }));
    }, [filteredLogs]);

    const downtimeData = useMemo(() => {
        const reasons = filteredDowntime.reduce<Record<string, number>>((acc, dt) => {
            const duration = ((dt.end || new Date()).getTime() - dt.start.getTime()) / 60000;
            acc[dt.reason] = (acc[dt.reason] || 0) + duration;
            return acc;
        }, {});
        return Object.entries(reasons).map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }));
    }, [filteredDowntime]);
    
    const PIE_COLORS = ['#C8102E', '#3b82f6', '#10B981', '#F59E0B', '#8B5CF6', '#8884d8', '#ed64a6'];

    const renderChart = () => {
        switch (filters.chartType) {
            case 'bar':
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="Good" fill="#10B981" />
                        <Bar dataKey="Rejected" fill="#C8102E" />
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Line type="monotone" dataKey="Good" stroke="#10B981" strokeWidth={2} />
                        <Line type="monotone" dataKey="Rejected" stroke="#C8102E" strokeWidth={2} />
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart>
                         <Pie data={downtimeData} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                            {downtimeData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} min`} />
                        <Legend />
                    </PieChart>
                )
            default:
                return <></>;
        }
    };

    return (
        <Card>
            <AnalyticsToolbar filters={filters} onFilterChange={setFilters} machines={machines} />
            <div className="mt-6 h-[70vh]">
                <ResponsiveContainer>
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default PerformanceAnalysisView;