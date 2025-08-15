import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { Machine } from '../../types';
import { useProductionData } from '../../hooks/useProductionData';
import { MagnifyingGlassIcon, XCircleIcon, CpuChipIcon } from '../common/Icons';

interface MachineSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMachine: (machineId: string) => void;
    onUnassignMachine: () => void;
    currentMachineId?: string;
}

const MachineSelectionModal: React.FC<MachineSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelectMachine,
    onUnassignMachine,
    currentMachineId,
}) => {
    const { machines } = useProductionData();
    const [searchTerm, setSearchTerm] = useState('');

    const groupedMachines = useMemo(() => {
        const filtered = machines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return filtered.reduce((acc, machine) => {
            (acc[machine.type] = acc[machine.type] || []).push(machine);
            return acc;
        }, {} as Record<string, Machine[]>);
    }, [machines, searchTerm]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Your Workstation">
            <div className="space-y-4">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 top-1/2 left-3" />
                    <input
                        type="text"
                        placeholder="Search machines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                    />
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-4 -mr-3 pr-3">
                    {Object.entries(groupedMachines).sort(([a], [b]) => a.localeCompare(b)).map(([type, machineList]) => (
                        <div key={type}>
                            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">{type}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {machineList.map(machine => (
                                    <button
                                        key={machine.id}
                                        onClick={() => onSelectMachine(machine.id)}
                                        className={`flex items-center w-full gap-3 p-3 text-left transition-colors rounded-lg ${currentMachineId === machine.id ? 'bg-disa-accent-blue text-white' : 'bg-gray-500/10 hover:bg-gray-500/20'}`}
                                    >
                                        <CpuChipIcon className="w-6 h-6 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold">{machine.name}</p>
                                            <p className="text-xs opacity-80">{machine.location}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {currentMachineId && (
                    <button
                        onClick={onUnassignMachine}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700"
                    >
                        <XCircleIcon className="w-5 h-5" />
                        Unassign from Workstation
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default MachineSelectionModal;