import React, { useState } from 'react';
import { BreakdownReport, User, Machine, SafetyWorkPermit } from '../../types';
import { useProductionData } from '../../hooks/useProductionData';
import Card from '../common/Card';
import { motion } from 'framer-motion';
import { PlusIcon, SafetyCertificateIcon } from '../common/Icons';
import BreakdownReportModal from './BreakdownReportModal';
import SafetyPermitModal from './SafetyPermitModal';

const BreakdownsTab: React.FC<{ user: User }> = ({ user }) => {
    const { breakdownReports, safetyPermits, machines, addBreakdownReport, addSafetyPermit } = useProductionData();
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [isPermitModalOpen, setPermitModalOpen] = useState(false);
    const [selectedBreakdown, setSelectedBreakdown] = useState<BreakdownReport | null>(null);

    const handleOpenPermitModal = (breakdown: BreakdownReport) => {
        setSelectedBreakdown(breakdown);
        setPermitModalOpen(true);
    };
    
    return (
        <div className="space-y-4">
             <BreakdownReportModal
                isOpen={isReportModalOpen}
                onClose={() => setReportModalOpen(false)}
                onSubmit={addBreakdownReport}
                user={user}
                machines={machines}
            />
            {selectedBreakdown && <SafetyPermitModal
                isOpen={isPermitModalOpen}
                onClose={() => setPermitModalOpen(false)}
                onSubmit={addSafetyPermit}
                breakdown={selectedBreakdown}
            />}

            <div className="flex justify-end">
                <button onClick={() => setReportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700">
                    <PlusIcon className="w-5 h-5"/> Report Breakdown
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {breakdownReports.map(report => (
                    <BreakdownCard 
                        key={report.id} 
                        report={report} 
                        permit={safetyPermits.find(p => p.id === report.safetyPermitId)}
                        onIssuePermit={() => handleOpenPermitModal(report)}
                    />
                ))}
            </div>
        </div>
    );
};

const BreakdownCard: React.FC<{ report: BreakdownReport; permit: SafetyWorkPermit | undefined; onIssuePermit: () => void }> = ({ report, permit, onIssuePermit }) => {
    const statusColors = {
        Open: 'border-red-500',
        Acknowledged: 'border-yellow-500',
        'In Progress': 'border-blue-500',
        Resolved: 'border-green-500',
    };
    
    return (
        <Card className={`border-l-4 ${statusColors[report.status]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{report.machineId}</p>
                    <p className="text-sm font-semibold">{report.type} - {report.severity}</p>
                </div>
                 <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20">{report.status}</span>
            </div>
            <p className="my-2 text-sm text-gray-600 dark:text-gray-300">{report.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reported: {report.reportTimestamp.toLocaleString()}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-500/10">
                {permit ? (
                    <div className="flex items-center gap-2 text-sm">
                        <SafetyCertificateIcon className="w-5 h-5 text-green-500"/>
                        <span className="font-semibold">Permit {permit.status}</span>
                    </div>
                ) : (
                    <button onClick={onIssuePermit} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white transition-colors rounded-md bg-disa-accent-yellow hover:bg-yellow-600">
                        <SafetyCertificateIcon className="w-5 h-5"/>
                        Issue Safety Permit
                    </button>
                )}
            </div>
        </Card>
    );
};

export default BreakdownsTab;