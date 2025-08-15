
import React, { useMemo, useState, useEffect } from 'react';
import { User, IncidentLog, SafetyWorkPermit } from '../types';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, CalendarDaysIcon, ExclamationTriangleIcon, InformationCircleIcon } from '../components/common/Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useSettings } from '../hooks/useSettings';
import IncidentInvestigationModal from '../components/safety/IncidentInvestigationModal';
import { useUsers } from '../hooks/useUsers';

const CountdownTimer: React.FC<{ expiry: Date }> = ({ expiry }) => {
    const [timeLeft, setTimeLeft] = useState(expiry.getTime() - new Date().getTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(expiry.getTime() - new Date().getTime());
        }, 1000);
        return () => clearInterval(timer);
    }, [expiry]);

    if (timeLeft <= 0) return <span className="text-red-500 font-bold">Expired</span>;

    const hours = Math.floor((timeLeft / (1000 * 60 * 60)));
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return (
        <span className={`font-mono font-bold ${hours < 1 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
            {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
    );
};

const SafetyDashboard: React.FC<{ user: User }> = ({ user }) => {
    const { incidentLogs, safetyPermits, machines, resolveIncident } = useProductionData();
    const { users } = useUsers();
    const { theme } = useSettings();
    const [investigatingIncident, setInvestigatingIncident] = useState<IncidentLog | null>(null);

    const safetyKpis = useMemo(() => {
        const sortedIncidents = [...incidentLogs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastIncident = sortedIncidents.find(i => i.severity === 'High');
        let daysSinceLastIncident = 'N/A';
        if (lastIncident) {
            const diffTime = Math.abs(new Date().getTime() - new Date(lastIncident.timestamp).getTime());
            daysSinceLastIncident = Math.floor(diffTime / (1000 * 60 * 60 * 24)).toString();
        }
        
        const openInvestigations = incidentLogs.filter(i => !i.resolvedAt).length;
        const activePermits = safetyPermits.filter(p => p.status === 'Active').length;
        
        return { daysSinceLastIncident, openInvestigations, activePermits };
    }, [incidentLogs, safetyPermits]);
    
     const trainingStatus = useMemo(() => {
        const operators = users.filter(u => u.role === 'Operator');
        let totalRecords = 0;
        let expiredRecords = 0;
        operators.forEach(op => {
            if (op.trainingRecords) {
                totalRecords += op.trainingRecords.length;
                expiredRecords += op.trainingRecords.filter(r => r.expiresDate && new Date(r.expiresDate) < new Date()).length;
            }
        });
        const compliance = totalRecords > 0 ? ((totalRecords - expiredRecords) / totalRecords) * 100 : 100;
        return { compliance, expiredCount: expiredRecords };
    }, [users]);

    const incidentTrendData = useMemo(() => {
        const trend: { [key: string]: { date: Date, count: number } } = {};
        incidentLogs.forEach(log => {
            const day = new Date(log.timestamp).toISOString().split('T')[0];
            if (!trend[day]) {
                trend[day] = { date: new Date(day), count: 0 };
            }
            trend[day].count++;
        });
        return Object.values(trend).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-30);
    }, [incidentLogs]);
    
    const incidentsByMachine = useMemo(() => {
        const machineIncidents: { [key: string]: number } = {};
        incidentLogs.forEach(log => {
            const machineName = machines.find(m => m.id === log.machineId)?.name || log.machineId;
            machineIncidents[machineName] = (machineIncidents[machineName] || 0) + 1;
        });
        return Object.entries(machineIncidents).map(([name, Incidents]) => ({ name, Incidents }));
    }, [incidentLogs, machines]);

    const tooltipStyle = useMemo(() => (
        theme === 'light'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem' }
            : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem' }
    ), [theme]);
    
    const handleResolveIncident = (resolution: string) => {
        if (investigatingIncident) {
            resolveIncident(investigatingIncident.id, resolution, user.uid);
            setInvestigatingIncident(null);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {investigatingIncident && (
                <IncidentInvestigationModal 
                    incident={investigatingIncident} 
                    onClose={() => setInvestigatingIncident(null)}
                    onSubmit={handleResolveIncident}
                />
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Days Since Last High-Severity Incident" value={safetyKpis.daysSinceLastIncident} icon={CalendarDaysIcon} />
                <KpiCard title="Open Incident Investigations" value={safetyKpis.openInvestigations} icon={ExclamationTriangleIcon} />
                <KpiCard title="Active High-Risk Work Permits" value={safetyKpis.activePermits} icon={ShieldCheckIcon} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <h3 className="font-bold mb-4">Incident Trend (Last 30 Days)</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={incidentTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} />
                            <YAxis allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend />
                            <Line type="monotone" dataKey="count" name="Incidents" stroke="#F59E0B" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                 <Card className="lg:col-span-2">
                    <h3 className="font-bold mb-4">Incidents by Machine</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incidentsByMachine}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="Incidents" fill="#C8102E" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-2">
                    <h3 className="font-bold mb-4">Action Center: Open Investigations</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {incidentLogs.filter(i => !i.resolvedAt).length > 0 ? incidentLogs.filter(i => !i.resolvedAt).map(inc => (
                        <ActionItem 
                                key={inc.id}
                                title={`${inc.severity} incident on ${inc.machineId}`}
                                subtitle={inc.description}
                                status="Investigation Pending"
                                onAction={() => setInvestigatingIncident(inc)}
                                actionText="Investigate"
                            />
                        )) : <p className="text-sm text-center py-4 text-gray-500">No open investigations.</p>}
                    </div>
                 </Card>
                  <Card className="lg:col-span-1">
                    <h3 className="font-bold mb-4">Training Compliance</h3>
                    <div className="text-center">
                        <p className={`text-6xl font-bold ${trainingStatus.compliance < 95 ? 'text-disa-red' : 'text-disa-accent-green'}`}>
                            {trainingStatus.compliance.toFixed(1)}%
                        </p>
                        <p className="text-gray-500">Overall Compliance</p>
                    </div>
                     <div className={`mt-4 p-3 rounded-lg flex items-center justify-center gap-3 ${trainingStatus.expiredCount > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        <InformationCircleIcon className="w-6 h-6"/>
                        <p className="font-semibold">{trainingStatus.expiredCount} Expired Certification(s)</p>
                    </div>
                </Card>
            </div>

            <Card>
                <h3 className="font-bold mb-4">Action Center: Active Permits</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {safetyPermits.filter(p => p.status === 'Active').map(permit => (
                        <PermitCard key={permit.id} permit={permit} users={users} />
                    ))}
                    {safetyPermits.filter(p => p.status === 'Active').length === 0 && <p className="text-sm text-center py-4 text-gray-500">No active high-risk permits.</p>}
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

const ActionItem: React.FC<{title: string, subtitle: string, status: string, onAction: () => void, actionText: string}> = ({title, subtitle, status, onAction, actionText}) => {
    return (
        <div className="p-3 rounded-lg bg-gray-500/10 flex justify-between items-center">
            <div className="min-w-0">
                <p className="font-semibold truncate">{title}</p>
                <p className="text-xs text-gray-500 truncate">{subtitle}</p>
            </div>
            <button onClick={onAction} className="flex-shrink-0 ml-4 px-3 py-1 text-xs font-semibold text-white transition-colors rounded-md bg-disa-accent-blue hover:bg-blue-500">{actionText}</button>
        </div>
    );
};

const PermitCard: React.FC<{permit: SafetyWorkPermit, users: User[]}> = ({ permit, users }) => {
    const issuedTo = users.find(u => u.uid === permit.receivedByUserId)?.name || 'Unknown';
    const checksDone = permit.safetyChecks.filter(c => c.completed).length;
    const totalChecks = permit.safetyChecks.length;
    const progress = totalChecks > 0 ? (checksDone / totalChecks) * 100 : 0;
    const expiryTime = new Date(permit.validTo);

    return (
        <div className="p-3 rounded-lg bg-gray-500/10">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{permit.type}</p>
                    <p className="text-sm text-gray-500">Issued to: {issuedTo}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm">Expires in:</p>
                    <CountdownTimer expiry={expiryTime} />
                </div>
            </div>
            <div className="mt-2">
                 <div className="w-full bg-gray-300 rounded-full h-2.5 dark:bg-gray-700 mt-1">
                    <div className="bg-disa-accent-green h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                    {checksDone} of {totalChecks} checks complete
                </p>
            </div>
        </div>
    );
};

export default SafetyDashboard;
