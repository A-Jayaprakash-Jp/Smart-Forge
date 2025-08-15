
import React, { useMemo } from 'react';
import Modal from '../common/Modal';
import { Machine } from '../../types';
import { useProductionData } from '../../hooks/useProductionData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSettings } from '../../hooks/useSettings';

interface MachineDetailModalProps {
    machine: Machine;
    onClose: () => void;
}

const MachineDetailModal: React.FC<MachineDetailModalProps> = ({ machine, onClose }) => {
    const { getMachineData } = useProductionData();
    const { theme } = useSettings();
    const machineLogs = useMemo(() => getMachineData(machine.id), [getMachineData, machine.id]);

    const chartData = useMemo(() => {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return machineLogs
            .filter(log => log.timestamp > last24h)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .map(log => ({
                time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                Good: log.goodMoulds,
                Rejected: log.rejectedMoulds,
            }))
            .slice(-20); // Last 20 logs
    }, [machineLogs]);

    const tooltipStyle = useMemo(() => (
        theme === 'light'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#1f2937', borderRadius: '0.75rem' }
            : { backgroundColor: 'rgba(31, 41, 55, 0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#f3f4f6', borderRadius: '0.75rem' }
    ), [theme]);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Details for ${machine.name}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Machine Type" value={machine.type} />
                    <InfoItem label="Status" value={machine.status} />
                    <InfoItem label="Location" value={machine.location} />
                    <InfoItem label="Ideal Cycle Time" value={`${machine.idealCycleTime}s`} />
                    <InfoItem label="Moulds per Hour" value={machine.mouldsPerHour} />
                    <InfoItem label="Avg. Energy Use" value={`${machine.energyConsumptionKwh} kWh`} />
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Production Trend (Last 24h)</h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="time" stroke="currentColor" strokeOpacity={0.7} fontSize={12} />
                                <YAxis stroke="currentColor" strokeOpacity={0.7} fontSize={12} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Line type="monotone" dataKey="Good" stroke="#10B981" strokeWidth={2} />
                                <Line type="monotone" dataKey="Rejected" stroke="#C8102E" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Close</button>
                </div>
            </div>
        </Modal>
    );
};

const InfoItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold text-gray-800 dark:text-white">{value}</p>
    </div>
);

export default MachineDetailModal;
