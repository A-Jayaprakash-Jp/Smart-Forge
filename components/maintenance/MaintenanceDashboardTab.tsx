
import React, { useMemo } from 'react';
import { useProductionData } from '../../hooks/useProductionData';
import Card from '../common/Card';
import { BellAlertIcon, ClockIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon } from '../common/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSettings } from '../../hooks/useSettings';

const MaintenanceDashboardTab: React.FC = () => {
    const { maintenanceTasks, predictiveAlerts, breakdownReports, maintenanceRequests } = useProductionData();
    const { theme } = useSettings();

    const kpiData = useMemo(() => {
        const overdue = maintenanceTasks.filter(t => t.status === 'Overdue').length;
        const openAlerts = predictiveAlerts.filter(a => a.status === 'Open').length;
        const openBreakdowns = breakdownReports.filter(b => b.status !== 'Resolved').length;
        return { overdue, openAlerts, openBreakdowns };
    }, [maintenanceTasks, predictiveAlerts, breakdownReports]);

    const upcomingTasks = useMemo(() => {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return maintenanceTasks
            .filter(t => t.status !== 'Completed' && new Date(t.nextDue) <= sevenDaysFromNow)
            .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
            .slice(0, 5);
    }, [maintenanceTasks]);

    const completedWorkData = useMemo(() => {
        const completedTasks = maintenanceTasks.filter(t => t.status === 'Completed').length;
        const completedRequests = maintenanceRequests.filter(r => r.status === 'Completed').length;
        const resolvedBreakdowns = breakdownReports.filter(b => b.status === 'Resolved').length;
        return [
            { name: 'PM Tasks', count: completedTasks },
            { name: 'Requests', count: completedRequests },
            { name: 'Breakdowns', count: resolvedBreakdowns },
        ];
    }, [maintenanceTasks, maintenanceRequests, breakdownReports]);

    const tooltipStyle = useMemo(() => (
        theme === 'light'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem' }
            : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem' }
    ), [theme]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Overdue PM Tasks" value={kpiData.overdue} icon={BellAlertIcon} color="text-disa-red" />
                <KpiCard title="Open Predictive Alerts" value={kpiData.openAlerts} icon={ExclamationTriangleIcon} color="text-disa-accent-yellow" />
                <KpiCard title="Active Breakdowns" value={kpiData.openBreakdowns} icon={WrenchScrewdriverIcon} color="text-disa-accent-purple" />
            </div>
            <Card className="lg:col-span-2">
                <h3 className="font-bold mb-4">Completed Work Summary</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={completedWorkData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                <h3 className="font-bold mb-4">Upcoming Schedule (7 Days)</h3>
                <div className="space-y-3">
                    {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                        <div key={task.id} className="p-3 rounded-lg bg-gray-500/10">
                            <p className="font-semibold">{task.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {task.machineId} - Due: {new Date(task.nextDue).toLocaleDateString()}
                            </p>
                        </div>
                    )) : (
                        <p className="text-sm text-center py-8 text-gray-500">No tasks due in the next 7 days.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

const KpiCard: React.FC<{title: string, value: number, icon: React.ElementType, color: string}> = ({ title, value, icon: Icon, color }) => (
    <Card className="flex items-center gap-6 p-6">
        <Icon className={`w-12 h-12 ${color}`} />
        <div>
            <p className={`text-4xl font-bold ${color}`}>{value}</p>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        </div>
    </Card>
);

export default MaintenanceDashboardTab;