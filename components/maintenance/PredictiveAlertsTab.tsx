
import React from 'react';
import { useProductionData } from '../../hooks/useProductionData';
import { PredictiveAlert, User } from '../../types';
import Card from '../common/Card';
import { ExclamationTriangleIcon } from '../common/Icons';

const PredictiveAlertsTab: React.FC<{ user: User }> = ({ user }) => {
    const { predictiveAlerts, acknowledgePredictiveAlert } = useProductionData();

    const sortedAlerts = [...predictiveAlerts].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Open' ? -1 : 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {sortedAlerts.map(alert => (
                <AlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onAcknowledge={() => acknowledgePredictiveAlert(alert.id, user.uid)} 
                />
            ))}
            {sortedAlerts.length === 0 && (
                <Card className="text-center py-12 text-gray-500">
                    No predictive alerts at this time.
                </Card>
            )}
        </div>
    );
};

const AlertCard: React.FC<{ alert: PredictiveAlert, onAcknowledge: () => void }> = ({ alert, onAcknowledge }) => {
    const severityStyles = {
        Critical: 'border-red-500 bg-red-500/10',
        Warning: 'border-yellow-500 bg-yellow-500/10',
    };
    
    return (
        <Card className={`!p-4 border-l-4 ${severityStyles[alert.severity]} ${alert.status === 'Acknowledged' ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-800 dark:text-white">{alert.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Machine: {alert.machineId} | Severity: {alert.severity}
                    </p>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{alert.description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                     <p className="font-semibold">{alert.status}</p>
                    <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
            </div>
            {alert.status === 'Open' && (
                <div className="flex justify-end mt-2">
                    <button onClick={onAcknowledge} className="px-3 py-1.5 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                        Acknowledge
                    </button>
                </div>
            )}
        </Card>
    );
};


export default PredictiveAlertsTab;