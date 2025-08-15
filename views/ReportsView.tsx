import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/common/Card';
import { DocumentChartBarIcon, ArrowPathIcon, SparklesIcon, ArrowDownTrayIcon, ChevronDownIcon, CubeIcon, BeakerIcon, ClockIcon, UsersIcon, ShieldCheckIcon, DocumentTextIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon, InformationCircleIcon, TableCellsIcon, CheckCircleIcon } from '../components/common/Icons';
import { useProductionData } from '../hooks/useProductionData';
import { User, Machine, AiDmmParameterReport, AiDailyProductionPerformanceReport, AiNcrReport, AiSettingAdjustmentReport, AiDisaMachineChecklistReport, AiRorVerificationReport, AiDailyPerformanceMonitoringReport, AiWeeklyPerformanceMonitoringReport, AiExecutiveSummaryReport } from '../types';
import { 
    generateDmmParameterReport,
    generateDailyProductionPerformanceReport,
    generateNcrReport,
    generateSettingAdjustmentReport,
    generateDisaMachineChecklistReport,
    generateRorVerificationReport,
    generateDailyPerformanceMonitoringReport,
    generateWeeklyPerformanceMonitoringReport,
    generateExecutiveSummaryReport
} from '../services/geminiService';
import { AnimatePresence, motion } from 'framer-motion';
import { toLocalISOString } from '../utils/helpers';
import { useNotifications } from '../hooks/useNotifications';
import { exportAiReportToPDF, exportAiReportToWord } from '../utils/exporter';

const reportTypes = [
    { id: 'dmm_parameters', name: 'DMM Setting Parameters', icon: WrenchScrewdriverIcon, generator: generateDmmParameterReport as any },
    { id: 'daily_production', name: 'Daily Production Performance', icon: CubeIcon, generator: generateDailyProductionPerformanceReport as any },
    { id: 'ncr', name: 'Non-Conformance Report', icon: ExclamationTriangleIcon, generator: generateNcrReport as any },
    { id: 'setting_adjustment', name: 'Setting Adjustment Record', icon: ClockIcon, generator: generateSettingAdjustmentReport as any },
    { id: 'disa_checklist', name: 'DISA Operator Checklist', icon: TableCellsIcon, generator: generateDisaMachineChecklistReport as any },
    { id: 'ror_verification', name: 'Error Proof Verification', icon: ShieldCheckIcon, generator: generateRorVerificationReport as any },
    { id: 'daily_monitoring', name: 'EOHS Daily Monitoring', icon: DocumentTextIcon, generator: generateDailyPerformanceMonitoringReport as any },
    { id: 'weekly_monitoring', name: 'EOHS Weekly Monitoring', icon: UsersIcon, generator: generateWeeklyPerformanceMonitoringReport as any },
    { id: 'executive_summary', name: 'Executive Summary', icon: CheckCircleIcon, generator: generateExecutiveSummaryReport as any },
];


const ReportsView: React.FC<{ user: User }> = ({ user }) => {
    const { data, maintenanceTasks, machineAlerts, incidentLogs, machines, qualityDocuments } = useProductionData();
    const [selectedReport, setSelectedReport] = useState(reportTypes[0]);
    const [reportData, setReportData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { addNotification } = useNotifications();

    const [filters, setFilters] = useState({
        startDate: toLocalISOString(new Date(new Date().setDate(new Date().getDate() - 7))),
        endDate: toLocalISOString(new Date()),
        machineId: 'all'
    });

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError('');
        setReportData(null);
        try {
            const generator = selectedReport.generator;
            const result = await generator({
                user,
                productionLogs: data.logs,
                downtimeEvents: data.downtime,
                incidents: incidentLogs,
                qualityDocs: qualityDocuments,
                machines,
                maintenanceTasks,
                machineAlerts,
                filters,
            });
            // TEMP DEBUG LOG
            // eslint-disable-next-line no-console
            console.log('DEBUG: Generated report data:', result);
            setReportData(result);
            addNotification({ title: 'Report Generated', message: 'AI analysis is complete.', type: 'success' });
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
            addNotification({ title: 'Generation Failed', message: e.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            <div className="lg:col-span-1 h-full">
                 <Card className="h-full flex flex-col">
                    <h3 className="text-lg font-bold mb-4">Available Reports</h3>
                    <div className="space-y-2 flex-grow overflow-y-auto -mr-3 pr-3">
                        {reportTypes.map(r => (
                            <button key={r.id} onClick={() => { setSelectedReport(r); setReportData(null); }}
                                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${selectedReport.id === r.id ? 'bg-disa-accent-blue/20' : 'hover:bg-gray-500/10'}`}>
                                <r.icon className="w-6 h-6 text-disa-accent-blue flex-shrink-0" />
                                <span className="font-semibold">{r.name}</span>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-3 space-y-6 h-full flex flex-col">
                <Card>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-grow">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <DocumentChartBarIcon className="w-8 h-8 text-disa-accent-purple" />
                                {selectedReport.name}
                            </h2>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Select filters and generate an automated analysis.</p>
                        </div>
                        <button onClick={handleGenerateReport} disabled={isLoading} className="flex items-center justify-center gap-3 px-6 py-3 mt-4 font-bold text-white transition-colors duration-300 rounded-lg bg-gradient-to-r from-disa-accent-purple to-disa-accent-blue hover:opacity-90 disabled:from-gray-500 md:mt-0">
                            {isLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                            {isLoading ? 'Analyzing...' : 'Generate Report'}
                        </button>
                    </div>
                    <div className="mt-6 border-t border-disa-light-border dark:border-disa-dark-border pt-6">
                        <ReportFilters filters={filters} setFilters={setFilters} machines={machines} />
                    </div>
                </Card>

                <AnimatePresence>
                {reportData && (
                    <Card className="flex-grow overflow-y-auto">
                        <ReportDisplay reportData={reportData} reportType={selectedReport} />
                    </Card>
                )}
                 {error && <Card><p className="text-red-500 text-center">{error}</p></Card>}
                </AnimatePresence>
            </div>
        </div>
    );
};


const ReportFilters: React.FC<{ filters: any, setFilters: any, machines: Machine[] }> = ({ filters, setFilters, machines }) => (
    <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">From</label>
                <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full p-2 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" title="Start Date" />
            </div>
            <div>
                <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">To</label>
                <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full p-2 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" title="End Date" />
            </div>
            <div>
                <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">Machine</label>
                <select value={filters.machineId} onChange={e => setFilters({...filters, machineId: e.target.value})} className="w-full p-2.5 text-sm text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" title="Machine">
                    <option value="all">All Machines</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>
        </div>
    </>
);

const ReportDisplay: React.FC<{ reportData: any, reportType: typeof reportTypes[0] }> = ({ reportData, reportType }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <DownloadButtons reportType={reportType} reportData={reportData} />
            {(() => {
                switch(reportType.id) {
                    case 'dmm_parameters': return <DmmParameterReportDisplay report={reportData as AiDmmParameterReport} />;
                    case 'daily_production': return <DailyProductionPerformanceDisplay report={reportData as AiDailyProductionPerformanceReport} />;
                    case 'ncr': return <NcrReportDisplay report={reportData as AiNcrReport} />;
                    case 'setting_adjustment': return <SettingAdjustmentDisplay report={reportData as AiSettingAdjustmentReport} />;
                    case 'disa_checklist': return <DisaMachineChecklistDisplay report={reportData as AiDisaMachineChecklistReport} />;
                    case 'ror_verification': return <RorVerificationDisplay report={reportData as AiRorVerificationReport} />;
                    case 'daily_monitoring': return <DailyPerformanceMonitoringDisplay report={reportData as AiDailyPerformanceMonitoringReport} />;
                    case 'weekly_monitoring': return <WeeklyPerformanceMonitoringDisplay report={reportData as AiWeeklyPerformanceMonitoringReport} />;
                    case 'executive_summary': return <ExecutiveSummaryDisplay report={reportData as AiExecutiveSummaryReport} />;
                    default: return <p>Report view not implemented for this type.</p>
                }
            })()}
        </motion.div>
    )
};

const DownloadButtons: React.FC<{ reportType: any, reportData: any }> = ({ reportType, reportData }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const handleDownload = (format: 'pdf' | 'word') => {
        const filename = `${reportType.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
        if (format === 'pdf') exportAiReportToPDF(reportData, filename);
        else if (format === 'word') exportAiReportToWord(reportData, filename);
        setDropdownOpen(false);
    };
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);
    return (
        <div className="flex justify-end mb-4">
            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(p => !p)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-gray-800 dark:text-white bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40">
                    <ArrowDownTrayIcon className="w-5 h-5" /> Download <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 z-10 w-48 mt-2 overflow-hidden origin-top-right rounded-md shadow-lg glass-card">
                            <button onClick={() => handleDownload('pdf')} className="block w-full px-4 py-2 text-left hover:bg-gray-500/10">PDF Document</button>
                            <button onClick={() => handleDownload('word')} className="block w-full px-4 py-2 text-left hover:bg-gray-500/10">Word Document</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- START: SPECIFIC REPORT DISPLAY COMPONENTS ---

const ReportWrapper: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="p-4 border rounded-lg border-gray-500/20">
        <div className="text-center">
            <h2 className="text-xl font-bold">SAKTHI AUTO COMPONENT LIMITED</h2>
            <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="mt-4">{children}</div>
    </div>
);

const Preamble: React.FC<{ data: { [key: string]: string } }> = ({ data }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm border-y border-gray-500/20 py-2">
        {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex">
                <span className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}: &nbsp;</span>
                <span className="truncate">{value}</span>
            </div>
        ))}
    </div>
);

const Signatures: React.FC<{ data: { [key: string]: string } }> = ({ data }) => (
     <div className="flex justify-between mt-8 pt-4 border-t border-gray-500/20 text-sm font-bold">
        {Object.entries(data).map(([key, value]) => (
            <div key={key}>
                <p>{value || '________________'}</p>
                <p className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
            </div>
        ))}
    </div>
)

const DmmParameterReportDisplay: React.FC<{ report: AiDmmParameterReport }> = ({ report }) => {
    const headers = ["Core Mask Thick", "CMH Out", "CMH In", "Sand Shot Pr.", "Shot Time Corr.", "Squeeze Pr.", "PP Strip Accel", "PP Strip Dist", "SP Strip Accel", "SP Strip Dist", "Mould Thick", "Close Up Force", "Remarks"];
    const keys: (keyof typeof report.shifts.shift1[0])[] = ["coreMaskThickness", "coreMaskHeightOutside", "coreMaskHeightInside", "sandShotPressure", "shotTimeCorrection", "squeezePressure", "ppStrippingAcceleration", "ppStrippingDistance", "spStrippingAcceleration", "spStrippingDistance", "mouldThickness", "closeUpForce", "remarks"];
    
    const ShiftTable: React.FC<{title: string, data: typeof report.shifts.shift1}> = ({ title, data }) => (
        <div className="mt-4">
            <h4 className="font-bold text-center bg-gray-200 dark:bg-gray-700 p-1">{title}</h4>
            {data.length > 0 ? (
                <table className="w-full text-xs text-left border-collapse">
                    <thead><tr>{headers.map(h => <th key={h} className="p-1 border border-gray-300 dark:border-gray-600 truncate">{h}</th>)}</tr></thead>
                    <tbody>{data.map((row, i) => <tr key={i}>{keys.map(key => <td key={key} className="p-1 border border-gray-300 dark:border-gray-600">{row[key]}</td>)}</tr>)}</tbody>
                </table>
            ) : <p className="text-center text-sm p-4 text-gray-500">No data for this shift.</p>}
        </div>
    );

    return <ReportWrapper title="DMM SETTING PARAMETERS CHECK SHEET">
        <Preamble data={report.preamble} />
        <div className="overflow-x-auto">
            <ShiftTable title="SHIFT I" data={report.shifts.shift1} />
            <ShiftTable title="SHIFT II" data={report.shifts.shift2} />
            <ShiftTable title="SHIFT III" data={report.shifts.shift3} />
        </div>
    </ReportWrapper>
};

const DailyProductionPerformanceDisplay: React.FC<{ report: AiDailyProductionPerformanceReport }> = ({ report }) => {
    return <ReportWrapper title={`DAILY PRODUCTION PERFORMANCE (FOUNDRY - B) - SHIFT ${report.preamble.shift}`}>
        <div className="text-sm"><strong>Date:</strong> {report.preamble.date}</div>
        <div className="grid grid-cols-3 gap-2 my-2 text-center text-sm">
            <div className="p-2 border border-gray-500/20"><strong>POURED MOULDS</strong><br/>{report.summary.pouredMouldsValue}</div>
            <div className="p-2 border border-gray-500/20"><strong>GASTED</strong><br/>{report.summary.gasted}</div>
            <div className="p-2 border border-gray-500/20"><strong>TONNAGE</strong><br/>{report.summary.tonnage}</div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
                <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        {[
                            "S.No", "Pattern Code", "Item Description", "Item", "No of Cavity", "Moulds Poured", "Moulds Produced", "Poured Wt (Kg)", "Planned", "Unplanned", "Total"
                        ].map(h => <th key={h} className="p-1 border border-gray-300 dark:border-gray-600">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {report.rows.map(row => <tr key={row.sNo}>{Object.values(row).map((val, i) => <td key={i} className="p-1 border border-gray-300 dark:border-gray-600">{val}</td>)}</tr>)}
                </tbody>
            </table>
        </div>
        <div className="mt-2 text-sm"><strong>Reasons for producing un-planned items:</strong> {report.unplannedReasons}</div>
        <Signatures data={report.footer} />
    </ReportWrapper>
};

const NcrReportDisplay: React.FC<{ report: AiNcrReport }> = ({ report }) => {
     return <ReportWrapper title="Non-Conformance Report">
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
                 <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        {[
                            "S.No", "Date", "Non-Conformities Details", "Correction", "Root Cause", "Corrective Action", "Target Date", "Responsibility", "Sign", "Status"
                        ].map(h => <th key={h} className="p-1 border border-gray-300 dark:border-gray-600">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                     {report.rows.map(row => <tr key={row.sNo}>{Object.values(row).map((val, i) => <td key={i} className="p-1 border border-gray-300 dark:border-gray-600">{val}</td>)}</tr>)}
                </tbody>
            </table>
        </div>
    </ReportWrapper>
};

const SettingAdjustmentDisplay: React.FC<{ report: AiSettingAdjustmentReport }> = ({ report }) => {
    return <ReportWrapper title="DISA SETTING ADJUSTMENT RECORD">
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
                <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        {["Date", "Counter No.", "No of Moulds", "Work Carried Out", "Preventive Work Carried", "Signature", "Remarks"].map(h => <th key={h} className="p-1 border border-gray-300 dark:border-gray-600">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {report.rows.map((row, i) => (
                        <tr key={i}>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.date}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.counterNumber}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.noOfMoulds}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.workCarriedOut}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.preventiveWorkCarried}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.signature}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.remarks}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </ReportWrapper>
};

const DisaMachineChecklistDisplay: React.FC<{ report: AiDisaMachineChecklistReport }> = ({ report }) => {
    return <ReportWrapper title={`DISA MACHINE OPERATOR CHECK SHEET - ${report.preamble.machine}`}>
        <div className="text-sm"><strong>Month:</strong> {report.preamble.month}</div>
        <div className="overflow-x-auto">
             <table className="w-full text-[10px] text-center border-collapse">
                <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="p-1 border border-gray-300 dark:border-gray-600">Sl.No</th>
                        <th className="p-1 border border-gray-300 dark:border-gray-600 text-left">Check Points</th>
                        <th className="p-1 border border-gray-300 dark:border-gray-600 text-left">Check Method</th>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => <th key={day} className="p-1 border border-gray-300 dark:border-gray-600 w-6">{day}</th>)}
                    </tr>
                </thead>
                 <tbody>
                    {report.rows.map(row => <tr key={row.slNo}>
                        <td className="p-1 border border-gray-300 dark:border-gray-600">{row.slNo}</td>
                        <td className="p-1 border border-gray-300 dark:border-gray-600 text-left">{row.checkPoint}</td>
                        <td className="p-1 border border-gray-300 dark:border-gray-600 text-left">{row.checkMethod}</td>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => <td key={day} className="p-1 border border-gray-300 dark:border-gray-600">{row.days[day]}</td>)}
                    </tr>)}
                </tbody>
            </table>
        </div>
         <Signatures data={report.footer} />
    </ReportWrapper>
};

const RorVerificationDisplay: React.FC<{ report: AiRorVerificationReport }> = ({ report }) => {
    return <ReportWrapper title="ERROR PROOF VERIFICATION CHECK LIST - FDY">
        <Preamble data={report.preamble} />
        <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left border-collapse">
                <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        {["Error Proof Name", "Nature of Error Proof", "Frequency", "I Shift Observation", "II Shift Observation", "III Shift Observation"].map(h => <th key={h} className="p-1 border border-gray-300 dark:border-gray-600">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {report.rows.map((row, i) => (
                        <tr key={i}>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.errorProofName}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.natureOfErrorProof}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.frequency}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.shift1_Observation}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.shift2_Observation}</td>
                            <td className="p-1 border border-gray-300 dark:border-gray-600">{row.shift3_Observation}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <Signatures data={report.footer} />
    </ReportWrapper>
};

const DailyPerformanceMonitoringDisplay: React.FC<{ report: AiDailyPerformanceMonitoringReport }> = ({ report }) => {
    return <ReportWrapper title="EOHS - DAILY PERFORMANCE MONITORING REPORT">
        <Preamble data={report.preamble} />
        <div className="overflow-x-auto mt-2">
            <table className="w-full text-[10px] text-center border-collapse">
                <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="p-1 border border-gray-300 dark:border-gray-600 text-left">Parameter</th>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => <th key={day} className="p-1 border border-gray-300 dark:border-gray-600 w-6">{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {report.rows.map((row, i) => <tr key={i}>
                        <td className="p-1 border border-gray-300 dark:border-gray-600 text-left">{row.monitoringParameter}</td>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => <td key={day} className="p-1 border border-gray-300 dark:border-gray-600">{row.days[day]}</td>)}
                    </tr>)}
                </tbody>
            </table>
        </div>
        <Signatures data={report.footer} />
    </ReportWrapper>
};

const WeeklyPerformanceMonitoringDisplay: React.FC<{ report: AiWeeklyPerformanceMonitoringReport }> = ({ report }) => {
     return <ReportWrapper title="EOHS - WEEKLY PERFORMANCE MONITORING REPORT">
        <Preamble data={report.preamble} />
         <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left border-collapse">
                 <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        <th rowSpan={2} className="p-1 border border-gray-300 dark:border-gray-600">Monitoring Location</th>
                        <th rowSpan={2} className="p-1 border border-gray-300 dark:border-gray-600">Parameter</th>
                        <th rowSpan={2} className="p-1 border border-gray-300 dark:border-gray-600">Units</th>
                        <th rowSpan={2} className="p-1 border border-gray-300 dark:border-gray-600">PCB Limits</th>
                        <th colSpan={4} className="p-1 border border-gray-300 dark:border-gray-600 text-center">Set 1</th>
                        <th colSpan={4} className="p-1 border border-gray-300 dark:border-gray-600 text-center">Set 2</th>
                        <th colSpan={4} className="p-1 border border-gray-300 dark:border-gray-600 text-center">Set 3</th>
                    </tr>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        {Array.from({length: 3}).flatMap(() => ["W1", "W2", "W3", "W4"]).map((w,i) => <th key={i} className="p-1 border border-gray-300 dark:border-gray-600">{w}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {report.rows.map((row, i) => <tr key={i}>
                        <td className="p-1 border border-gray-300 dark:border-gray-600">{row.monitoringLocation}</td>
                        <td className="p-1 border border-gray-300 dark:border-gray-600">{row.monitoringParameter}</td>
                        <td className="p-1 border border-gray-300 dark:border-gray-600">{row.units}</td>
                        <td className="p-1 border border-gray-300 dark:border-gray-600">{row.pcbLimits}</td>
                        {Object.values(row.set1).map((val, i) => <td key={`s1-${i}`} className="p-1 border border-gray-300 dark:border-gray-600">{val}</td>)}
                        {Object.values(row.set2).map((val, i) => <td key={`s2-${i}`} className="p-1 border border-gray-300 dark:border-gray-600">{val}</td>)}
                        {Object.values(row.set3).map((val, i) => <td key={`s3-${i}`} className="p-1 border border-gray-300 dark:border-gray-600">{val}</td>)}
                    </tr>)}
                </tbody>
            </table>
        </div>
        <Signatures data={report.footer} />
    </ReportWrapper>
};

const ExecutiveSummaryDisplay: React.FC<{ report: AiExecutiveSummaryReport }> = ({ report }) => {
    return <ReportWrapper title="Executive Summary Report">
        <Preamble data={report.preamble} />
        <div className="mt-4 space-y-4">
            <div>
                <h4 className="font-bold text-lg mb-2">Summary</h4>
                <p className="text-sm">{report.summary}</p>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-2">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {report.keyMetrics.map(metric => (
                        <div key={metric.metric} className="p-3 bg-gray-500/10 rounded-lg text-center">
                            <p className="font-semibold text-gray-600 dark:text-gray-300">{metric.metric}</p>
                            <p className="text-2xl font-bold text-disa-red">{metric.value}</p>
                            <p className={`text-sm font-semibold ${metric.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{metric.change}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-2">AI Insights</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    {report.insights.map((insight, i) => <li key={i}>{insight}</li>)}
                </ul>
            </div>
             <div>
                <h4 className="font-bold text-lg mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    {report.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
            </div>
        </div>
    </ReportWrapper>
};

export default ReportsView;