import React, { useMemo, useState, useRef, useEffect } from 'react';
import { User, Role, ProductionLog, DowntimeEvent, IncidentLog } from '../types';
import { useProductionData } from '../hooks/useProductionData';
import { 
    exportHistoryToCSV,
    exportHistoryToExcel,
    exportHistoryToPDF,
    exportHistoryToWord,
    exportHistoryToText
} from '../utils/exporter';
import Card from '../components/common/Card';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, ArrowDownTrayIcon, ChevronDownIcon, ExclamationTriangleIcon } from '../components/common/Icons';
import { AnimatePresence, motion } from 'framer-motion';

const ITEMS_PER_PAGE = 15;

const HistoryView: React.FC<{ user: User }> = ({ user }) => {
    const { data, machines, incidentLogs } = useProductionData();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [filters, setFilters] = useState({ eventType: 'all', machineId: 'all' });
    const [currentPage, setCurrentPage] = useState(1);
    
    type HistoryItem = (ProductionLog & {type: 'log', date: Date}) | (DowntimeEvent & {type: 'downtime', date: Date}) | (IncidentLog & {type: 'incident', date: Date});

    const filteredHistory: HistoryItem[] = useMemo(() => {
        let relevantLogs: ProductionLog[] = [];
        let relevantDowntime: DowntimeEvent[] = [];
        let relevantIncidents: IncidentLog[] = [];

        if (user.role === Role.Operator) {
            relevantLogs = data.logs.filter(log => log.userId === user.uid);
            relevantDowntime = data.downtime.filter(dt => dt.userId === user.uid);
            relevantIncidents = incidentLogs.filter(inc => inc.reportedByUserId === user.uid);
        } else {
            // Supervisors and Managers see all data
            relevantLogs = data.logs;
            relevantDowntime = data.downtime;
            relevantIncidents = incidentLogs;
        }

        const combined: HistoryItem[] = [
            ...relevantLogs.map(item => ({ ...item, type: 'log' as const, date: item.timestamp })),
            ...relevantDowntime.map(item => ({ ...item, type: 'downtime' as const, date: item.start })),
            ...relevantIncidents.map(item => ({ ...item, type: 'incident' as const, date: item.timestamp }))
        ];
        
        const filtered = combined.filter(item => {
            const eventTypeMatch = filters.eventType === 'all' || item.type === filters.eventType;
            const machineMatch = filters.machineId === 'all' || item.machineId === filters.machineId;
            return eventTypeMatch && machineMatch;
        });
        
        return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    }, [data, user, incidentLogs, filters]);

    // Reset page number when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const paginatedHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

    const handleDownload = (format: 'csv' | 'excel' | 'pdf' | 'word' | 'text') => {
        const filename = 'disa_work_history';
        // Note: We export the full filtered list, not just the paginated one.
        switch (format) {
            case 'csv': exportHistoryToCSV(filteredHistory, filename); break;
            case 'excel': exportHistoryToExcel(filteredHistory, filename); break;
            case 'pdf': exportHistoryToPDF(filteredHistory, filename); break;
            case 'word': exportHistoryToWord(filteredHistory, filename); break;
            case 'text': exportHistoryToText(filteredHistory, filename); break;
        }
        setDropdownOpen(false);
    }
    
    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    const downloadOptions = [
        { format: 'csv', label: 'CSV' },
        { format: 'excel', label: 'Excel (XLSX)' },
        { format: 'pdf', label: 'PDF' },
        { format: 'word', label: 'Word (DOCX)' },
        { format: 'text', label: 'Text (TXT)' },
    ];
    
    const statusStyles = {
        Approved: 'bg-green-500/20 text-green-700 dark:text-green-400',
        Rejected: 'bg-red-500/20 text-red-700 dark:text-red-400',
        Pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-500',
    };

    return (
        <div className="space-y-4">
            <Card className="relative z-20">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div>
                            <label htmlFor="eventTypeFilter" className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Event Type</label>
                            <select 
                                id="eventTypeFilter"
                                value={filters.eventType} 
                                onChange={e => setFilters(f => ({...f, eventType: e.target.value}))}
                                className="w-full p-2 font-semibold text-gray-900 bg-gray-100 border-2 rounded-lg md:w-auto dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                            >
                                <option value="all">All Events</option>
                                <option value="log">Production Logs</option>
                                <option value="downtime">Downtime</option>
                                <option value="incident">Incidents</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="machineFilter" className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Machine</label>
                            <select 
                                id="machineFilter"
                                value={filters.machineId} 
                                onChange={e => setFilters(f => ({...f, machineId: e.target.value}))}
                                className="w-full p-2 font-semibold text-gray-900 bg-gray-100 border-2 rounded-lg md:w-auto dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                            >
                                <option value="all">All Machines</option>
                                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setDropdownOpen(prev => !prev)}
                            className="flex items-center w-full justify-center gap-2 px-4 py-2 font-semibold transition-colors rounded-lg text-gray-800 dark:text-white bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Download History
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                         <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 z-40 w-48 mt-2 overflow-hidden origin-top-right rounded-md shadow-lg glass-card"
                                >
                                    <div className="p-1">
                                        {downloadOptions.map(opt => (
                                             <button
                                                key={opt.format}
                                                onClick={() => handleDownload(opt.format as any)}
                                                className="w-full px-3 py-2 text-left text-gray-800 rounded-md dark:text-gray-200 hover:bg-disa-accent-blue/80 hover:text-white"
                                            >
                                               {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                <AnimatePresence>
                    {paginatedHistory.length > 0 ? (
                        paginatedHistory.map((item, index) => (
                             <motion.div
                                layout
                                key={`${item.type}-${item.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.3, delay: index * 0.02 }}
                             >
                                <Card className="transition-all hover:border-disa-red/50">
                                    {item.type === 'log' ? (
                                        <div className="flex items-center gap-4">
                                            <ArrowUpCircleIcon className="w-10 h-10 text-disa-accent-green" />
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-900 dark:text-white">Production Log - Machine {item.machineId}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {item.goodMoulds} Good, {item.rejectedMoulds} Rejected
                                                    {item.rejectionReason && item.rejectionReason.length > 0 && ` (${item.rejectionReason.join(', ')})`}
                                                </p>
                                                 {item.batchNumber && <p className="text-xs text-gray-500 dark:text-gray-400">Batch: {item.batchNumber}</p>}
                                            </div>
                                            <div className="flex flex-col items-end flex-shrink-0">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.timestamp.toLocaleString()}</p>
                                                <span className={`mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[item.status]}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    ) : item.type === 'downtime' ? (
                                         <div className="flex items-center gap-4">
                                            <ArrowDownCircleIcon className="w-10 h-10 text-disa-red" />
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-900 dark:text-white">Downtime Event - Machine {item.machineId}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">Reason: {item.reason}</p>
                                            </div>
                                            <div className="text-sm text-right text-gray-500 dark:text-gray-400">
                                              <p>{item.start.toLocaleString()}</p>
                                              {item.end && <p>to {item.end.toLocaleString()}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                         <div className="flex items-center gap-4">
                                            <ExclamationTriangleIcon className="w-10 h-10 text-disa-accent-yellow" />
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-900 dark:text-white">{item.severity} Incident - Machine {item.machineId}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                                                {item.resolution && <p className="text-xs text-green-600 dark:text-green-400">Resolved: {item.resolution}</p>}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.timestamp.toLocaleString()}</p>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            key="no-results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <Card>
                                <p className="py-8 text-center text-gray-500 dark:text-gray-400">No history records match the current filters.</p>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 font-semibold rounded-lg disabled:opacity-50 bg-gray-200 dark:bg-gray-700">Previous</button>
                    <span className="font-semibold">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 font-semibold rounded-lg disabled:opacity-50 bg-gray-200 dark:bg-gray-700">Next</button>
                </div>
            )}
        </div>
    );
};

export default HistoryView;