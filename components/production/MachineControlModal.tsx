import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Machine } from '../../types';

interface MachineControlModalProps {
    machine: Machine;
    onClose: () => void;
    onSave: (machineId: string, status: Machine['status']) => void;
}

const MachineControlModal: React.FC<MachineControlModalProps> = ({ machine, onClose, onSave }) => {
    const [status, setStatus] = useState<Machine['status']>(machine.status);

    const handleSave = () => {
        onSave(machine.id, status);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Control ${machine.name}`}>
            <div className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Set Machine Status</label>
                    <div className="flex gap-2 p-1 rounded-lg bg-gray-200/50 dark:bg-black/20">
                        {(['Running', 'Idle', 'Down'] as Machine['status'][]).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatus(s)}
                                className={`flex-1 py-2 font-semibold rounded-md transition-colors ${status === s ? 'bg-disa-accent-blue text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">Set Status</button>
                </div>
            </div>
        </Modal>
    );
};

export default MachineControlModal;
