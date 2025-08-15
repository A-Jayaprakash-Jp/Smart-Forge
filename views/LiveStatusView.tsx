import React from 'react';
import { useRealtimeData } from '../hooks/useRealtimeData';
import Card from '../components/common/Card';
import Gauge from '../components/monitoring/Gauge';
import AnomalyFeed from '../components/monitoring/AnomalyFeed';
import { motion } from 'framer-motion';
import { CpuChipIcon } from '../components/common/Icons';
import { Machine } from '../types';

const LiveStatusView: React.FC = () => {
    const { liveMachines, anomalies } = useRealtimeData();

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full"
        >
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {liveMachines.map((machine, index) => (
                        <motion.div
                            key={machine.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <LiveMachineCard machine={machine} />
                        </motion.div>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-1 h-full">
                <AnomalyFeed anomalies={anomalies} />
            </div>
        </motion.div>
    );
};

const LiveMachineCard = ({ machine }: { machine: Machine }) => {
    const { name, status, liveData, operatingParameters: params } = machine;
    
    const statusClasses = {
        Running: 'border-green-500',
        Idle: 'border-yellow-500',
        Down: 'border-red-500'
    };

    return (
        <Card className={`border-l-4 ${statusClasses[status]}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><CpuChipIcon className="w-6 h-6" /> {name}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${machine.status === 'Running' ? 'bg-green-500/20 text-green-600' : machine.status === 'Idle' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-red-600'}`}>
                    {status}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Gauge 
                    value={liveData.mouldingPressure}
                    min={params.mouldingPressure.min}
                    ideal={params.mouldingPressure.ideal}
                    max={params.mouldingPressure.max}
                    criticalMax={params.mouldingPressure.critical_max}
                    label="Mould Pressure"
                    unit="bar"
                />
                <Gauge 
                    value={liveData.sandTemperature}
                    min={params.sandTemperature.min}
                    ideal={params.sandTemperature.ideal}
                    max={params.sandTemperature.max}
                    criticalMax={params.sandTemperature.critical_max}
                    label="Sand Temp"
                    unit="°C"
                />
            </div>
             <div className="mt-4">
                <h4 className="text-sm font-semibold text-center text-gray-600 dark:text-gray-300">Cycle Time Variance</h4>
                <p className={`text-2xl font-bold text-center ${liveData.cycleTimeVariancePercent > params.cycleTimeVariancePercent.max ? 'text-disa-red' : 'text-disa-accent-green'}`}>
                    {liveData.cycleTimeVariancePercent.toFixed(1)}%
                </p>
            </div>
        </Card>
    );
};

export default LiveStatusView;