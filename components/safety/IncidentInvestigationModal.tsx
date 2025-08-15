
import React, { useState } from 'react';
import Modal from '../common/Modal';
import { IncidentLog } from '../../types';

interface IncidentInvestigationModalProps {
    incident: IncidentLog;
    onClose: () => void;
    onSubmit: (resolution: string) => void;
}

const IncidentInvestigationModal: React.FC<IncidentInvestigationModalProps> = ({ incident, onClose, onSubmit }) => {
    const [resolution, setResolution] = useState('');

    const handleSubmit = () => {
        if (!resolution.trim()) {
            alert('Please provide resolution notes.');
            return;
        }
        onSubmit(resolution);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Investigate Incident: ${incident.id}`}>
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Machine</p>
                    <p>{incident.machineId}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Description</p>
                    <p>{incident.description}</p>
                </div>
                <div>
                    <label htmlFor="resolution" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Resolution Notes</label>
                    <textarea 
                        id="resolution" 
                        value={resolution}
                        onChange={e => setResolution(e.target.value)}
                        rows={5}
                        className="w-full p-2 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                        placeholder="Enter investigation findings and resolution steps..."
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-green hover:bg-green-500">Resolve Incident</button>
                </div>
            </div>
        </Modal>
    );
};

export default IncidentInvestigationModal;