import React from 'react';
import { Anomaly } from '../../types';
import Card from '../common/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { BellAlertIcon, ExclamationTriangleIcon } from '../common/Icons';

interface AnomalyFeedProps {
    anomalies: Anomaly[];
}

const AnomalyFeed: React.FC<AnomalyFeedProps> = ({ anomalies }) => {
    return (
        <Card className="h-full flex flex-col">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                <BellAlertIcon className="w-6 h-6 text-disa-red" />
                Anomaly Feed
            </h3>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                <AnimatePresence>
                    {anomalies.map(anomaly => (
                        <motion.div
                            key={anomaly.id}
                            layout
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.5, type: 'spring' }}
                        >
                           <AnomalyItem anomaly={anomaly} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </Card>
    );
};

const AnomalyItem: React.FC<{ anomaly: Anomaly }> = ({ anomaly }) => {
    const severityClasses = {
        Warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        Critical: 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400',
    };
    const currentSeverity = severityClasses[anomaly.severity];

    return (
        <div className={`p-3 rounded-lg border-l-4 ${currentSeverity}`}>
            <div className="flex justify-between items-start">
                 <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${currentSeverity}`} />
                    <div>
                        <p className="font-bold">{anomaly.machineName}</p>
                        <p className="text-sm">{anomaly.parameter}: <span className="font-semibold">{anomaly.value.toFixed(1)}</span></p>
                        <p className="text-xs opacity-80">Expected: {anomaly.expected}</p>
                    </div>
                </div>
                <span className="text-xs font-mono">{anomaly.timestamp.toLocaleTimeString()}</span>
            </div>
        </div>
    );
};

export default AnomalyFeed;