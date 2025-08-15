import React, { useMemo, useState } from 'react';
import { User, QualityDocument, NcrContent, GaugeCalibrationContent } from '../types';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { motion } from 'framer-motion';
import { BeakerIcon, ChartPieIcon, ClipboardDocumentListIcon, ShieldCheckIcon, CalendarDaysIcon } from '../components/common/Icons';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSettings } from '../hooks/useSettings';
import { useUsers } from '../hooks/useUsers';

const QualityDashboard: React.FC<{ user: User }> = ({ user }) => {
    const { data, qualityDocuments, layoutInspections, machines } = useProductionData();
    const { theme } = useSettings();

    const qualityKpis = useMemo(() => {
        const recentLogs = data.logs.slice(0, 500); // Analyze recent 500 logs for performance
        const totalProduced = recentLogs.reduce((sum, log) => sum + log.goodMoulds + log.rejectedMoulds, 0);
        const totalRejected = recentLogs.reduce((sum, log) => sum + log.rejectedMoulds, 0);
        const firstPassYield = totalProduced > 0 ? ((totalProduced - totalRejected) / totalProduced) * 100 : 100;
        
        const openNCRs = qualityDocuments.filter(doc => 
            doc.type === 'Non-Conformance Report' && 
            (doc.content as NcrContent).status !== 'Closed'
        ).length;

        const pendingInspections = layoutInspections.filter(i => !i.signedOffByUserId).length;
        const ppm = totalProduced > 0 ? (totalRejected / totalProduced) * 1000000 : 0;

        return { firstPassYield, openNCRs, pendingInspections, ppm };
    }, [data.logs, qualityDocuments, layoutInspections]);

    const rejectionTrendData = useMemo(() => {
        const trend: { [key: string]: { date: Date, count: number } } = {};
        data.logs.slice(0,100).forEach(log => {
            if (log.rejectedMoulds > 0) {
                const day = new Date(log.timestamp).toISOString().split('T')[0];
                if (!trend[day]) {
                    trend[day] = { date: new Date(day), count: 0 };
                }
                trend[day].count += log.rejectedMoulds;
            }
        });
        return Object.values(trend).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-30);
    }, [data.logs]);

     const rejectionsByMachineData = useMemo(() => {
        const machineRejections: { [key: string]: number } = {};
        data.logs.forEach(log => {
            if (log.rejectedMoulds > 0) {
                const machineName = machines.find(m => m.id === log.machineId)?.name || log.machineId;
                machineRejections[machineName] = (machineRejections[machineName] || 0) + log.rejectedMoulds;
            }
        });
        return Object.entries(machineRejections).map(([name, Rejections]) => ({ name, Rejections }));
    }, [data.logs, machines]);
    
    const upcomingCalibrations = useMemo(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        return qualityDocuments.filter((doc): doc is QualityDocument & { content: GaugeCalibrationContent } => {
            if (doc.type !== 'Gauge Calibration Record' || !doc.content?.nextDueAt) return false;
            const nextCalDate = new Date(doc.content.nextDueAt);
            return nextCalDate > now && nextCalDate <= thirtyDaysFromNow;
        }).sort((a, b) => new Date(a.content.nextDueAt).getTime() - new Date(b.content.nextDueAt).getTime());
    }, [qualityDocuments]);

    const openNcrs = useMemo(() => {
        return qualityDocuments.filter((doc): doc is QualityDocument & { content: NcrContent } => 
            doc.type === 'Non-Conformance Report' && doc.content.status !== 'Closed'
        );
    }, [qualityDocuments]);


    const tooltipStyle = useMemo(() => (
        theme === 'light'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem' }
            : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem' }
    ), [theme]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="First Pass Yield" value={`${qualityKpis.firstPassYield.toFixed(1)}%`} icon={BeakerIcon} />
                <KpiCard title="PPM (Defective)" value={qualityKpis.ppm.toFixed(0)} icon={ChartPieIcon} />
                <KpiCard title="Open NCRs" value={qualityKpis.openNCRs} icon={ClipboardDocumentListIcon} />
                <KpiCard title="Pending Layout Inspections" value={qualityKpis.pendingInspections} icon={ShieldCheckIcon} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-bold mb-4">Action Center: Open NCRs</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {openNcrs.map(doc => (
                            <ActionItem key={doc.id} title={doc.title} subtitle={`Part: ${doc.partNumber || 'N/A'}`} status={doc.content.status} />
                        ))}
                         {openNcrs.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No open NCRs.</p>}
                    </div>
                 </Card>
                  <Card>
                    <h3 className="font-bold mb-4">Action Center: Upcoming Calibrations (30 Days)</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {upcomingCalibrations.map(doc => (
                            <ActionItem key={doc.id} title={doc.title} subtitle={`Gauge ID: ${doc.content.gaugeId}`} status={`Due: ${new Date(doc.content.nextDueAt).toLocaleDateString()}`} />
                        ))}
                        {upcomingCalibrations.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No calibrations due soon.</p>}
                    </div>
                 </Card>
            </div>
             <Card className="lg:col-span-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div>
                        <h3 className="font-bold mb-4">Rejection Trend (Recent Logs)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={rejectionTrendData}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} />
                                <YAxis allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Line type="monotone" dataKey="count" name="Rejections" stroke="#F59E0B" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4">Rejections by Machine</h3>
                         <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={rejectionsByMachineData}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="Rejections" fill="#C8102E" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};


const KpiCard: React.FC<{title: string, value: string | number, icon: React.ElementType}> = ({ title, value, icon: Icon }) => (
    <Card className="text-center">
        <Icon className="w-12 h-12 mx-auto text-disa-accent-blue" />
        <p className="mt-2 text-3xl font-bold text-disa-red">{value}</p>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
    </Card>
);

const ActionItem: React.FC<{title: string, subtitle: string, status: string}> = ({title, subtitle, status}) => {
    const statusColors: {[key: string]: string} = {
        'Open': 'bg-yellow-500/20 text-yellow-600',
        'In Progress': 'bg-blue-500/20 text-blue-500',
        'Verified': 'bg-purple-500/20 text-purple-500',
    }
    return (
        <div className="p-3 rounded-lg bg-gray-500/10 flex justify-between items-center">
            <div>
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColors[status] || 'bg-gray-500/20 text-gray-500'}`}>{status}</span>
        </div>
    );
};


export default QualityDashboard;
