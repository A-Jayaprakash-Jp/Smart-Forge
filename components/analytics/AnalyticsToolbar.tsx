
import React from 'react';
import { ChartBarIcon, ChartPieIcon, ArrowTrendingUpIcon } from '../common/Icons';
import { Machine } from '../../types';

export interface ReportFilters {
    startDate: string;
    endDate: string;
    chartType: string;
    machineId: string;
}

interface AnalyticsToolbarProps {
    filters: ReportFilters;
    onFilterChange: (filters: ReportFilters) => void;
    machines: Machine[];
}

const AnalyticsToolbar: React.FC<AnalyticsToolbarProps> = ({ filters, onFilterChange, machines }) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onFilterChange({ ...filters, [e.target.name]: e.target.value });
    };

    const handleChartTypeChange = (type: string) => {
        onFilterChange({ ...filters, chartType: type });
    };

    const chartOptions = [
        { type: 'bar', icon: ChartBarIcon, label: 'Bar' },
        { type: 'line', icon: ArrowTrendingUpIcon, label: 'Line' },
        { type: 'pie', icon: ChartPieIcon, label: 'Pie' },
    ];

    return (
        <div className="flex flex-col gap-4 p-4 rounded-lg md:flex-row md:items-center md:justify-between bg-gray-200/50 dark:bg-black/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div>
                    <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">From</label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleInputChange}
                        className="p-2 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">To</label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleInputChange}
                        className="p-2 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                    />
                </div>
                 <div>
                    <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">Machine</label>
                    <select
                        name="machineId"
                        value={filters.machineId}
                        onChange={handleInputChange}
                        className="p-2.5 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                    >
                        <option value="all">All Machines</option>
                        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex p-1 rounded-lg bg-gray-200 dark:bg-black/30">
                {chartOptions.map(({ type, icon: Icon, label }) => (
                    <button
                        key={type}
                        onClick={() => handleChartTypeChange(type)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold transition-colors rounded-md ${filters.chartType === type ? 'bg-disa-accent-blue text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-white/10'}`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="hidden md:inline">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AnalyticsToolbar;
