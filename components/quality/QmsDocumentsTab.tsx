import React, { useState } from 'react';
import { QualityDocument, User } from '../../types';
import { useProductionData } from '../../hooks/useProductionData';
import Card from '../common/Card';
import { PlusIcon } from '../common/Icons';

const QmsDocumentsTab: React.FC<{ user: User }> = ({ user }) => {
    const { qualityDocuments } = useProductionData();

    if (!qualityDocuments) return null; // Handle case where data might not be loaded yet

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                    <PlusIcon className="w-5 h-5"/> New Document
                </button>
            </div>
            
            <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm text-left">
                     <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="p-3 font-semibold">Document Title</th>
                            <th className="p-3 font-semibold">Type</th>
                            <th className="p-3 font-semibold">Part No.</th>
                            <th className="p-3 font-semibold">Version</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Created Date</th>
                            <th className="p-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                     <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {qualityDocuments.map(doc => (
                           <DocumentRow key={doc.id} doc={doc} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DocumentRow: React.FC<{ doc: QualityDocument }> = ({ doc }) => {
    const statusColors = {
        Draft: 'bg-gray-500/20 text-gray-600',
        'Pending Approval': 'bg-yellow-500/20 text-yellow-600',
        Approved: 'bg-green-500/20 text-green-600',
        Archived: 'bg-gray-500/20 text-gray-500 opacity-70',
    };
    
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td className="p-3 font-semibold">{doc.title}</td>
            <td className="p-3">{doc.type}</td>
            <td className="p-3">{doc.partNumber || 'N/A'}</td>
            <td className="p-3 text-center">{doc.version}</td>
            <td className="p-3">
                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[doc.status]}`}>
                    {doc.status}
                </span>
            </td>
            <td className="p-3">{new Date(doc.creationDate).toLocaleDateString()}</td>
            <td className="p-3">
                 <button className="px-2 py-1 text-xs font-semibold rounded-md bg-gray-500/20 hover:bg-gray-500/30">View</button>
            </td>
        </tr>
    );
};

export default QmsDocumentsTab;