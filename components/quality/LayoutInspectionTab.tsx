import React, { useState } from 'react';
import { LayoutInspection, User } from '../../types';
import { useProductionData } from '../../hooks/useProductionData';
import Card from '../common/Card';
import { PlusIcon } from '../common/Icons';

const LayoutInspectionTab: React.FC<{ user: User }> = ({ user }) => {
    const { layoutInspections } = useProductionData();

    if (!layoutInspections) return null; // Handle case where data might not be loaded yet

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                    <PlusIcon className="w-5 h-5"/> New Inspection Report
                </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {layoutInspections.map(inspection => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                ))}
            </div>
        </div>
    );
};

const InspectionCard: React.FC<{ inspection: LayoutInspection }> = ({ inspection }) => {
    const outOfSpecCount = inspection.dimensions.filter(d => d.isOutOfSpec).length;
    
    return (
        <Card className="!p-4">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg">{inspection.partNumber} <span className="font-normal text-sm text-gray-500">(Rev: {inspection.drawingRevision})</span></p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Batch: {inspection.batchNumber}</p>
                </div>
                <div>
                    {outOfSpecCount > 0 ? (
                        <span className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-500/20 rounded-full">{outOfSpecCount} Alert(s)</span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-500/20 rounded-full">All OK</span>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-500/10">
                            <th className="p-2 text-left font-semibold">Dimension</th>
                            <th className="p-2 text-right font-semibold">Plan</th>
                            <th className="p-2 text-right font-semibold">Actual</th>
                            <th className="p-2 text-right font-semibold">Deviation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inspection.dimensions.map(dim => (
                            <tr key={dim.id} className={`border-b border-gray-500/5 ${dim.isOutOfSpec ? 'bg-red-500/10' : ''}`}>
                                <td className="p-2">{dim.name}</td>
                                <td className="p-2 text-right">{dim.planValue.toFixed(2)}</td>
                                <td className="p-2 text-right font-semibold">{dim.actualValue?.toFixed(2)}</td>
                                <td className={`p-2 text-right font-bold ${dim.isOutOfSpec ? 'text-red-500' : 'text-green-500'}`}>{dim.deviation?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Inspected by: {inspection.inspectedByUserId} on {new Date(inspection.inspectionDate).toLocaleDateString()}</span>
                <span>Signed off by: {inspection.signedOffByUserId || 'Pending'}</span>
             </div>
        </Card>
    );
}

export default LayoutInspectionTab;