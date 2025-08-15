
import React, { useState, useMemo } from 'react';
import { User, Machine, MachineProgram } from '../types';
import Card from '../components/common/Card';
import { useProductionData } from '../hooks/useProductionData';
import { FolderIcon, CpuChipIcon, PlusIcon, LockClosedIcon, DocumentTextIcon, ClockIcon } from '../components/common/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const ProgramLibraryView: React.FC<{ user: User }> = () => {
    const { machines, machinePrograms } = useProductionData();
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(machines[0] || null);
    
    const programsForSelectedMachine = useMemo(() => {
        if (!machinePrograms) return [];
        return machinePrograms.filter(p => p.machineId === selectedMachine?.id);
    }, [machinePrograms, selectedMachine]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            <div className="lg:col-span-1">
                <Card className="h-full">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Machines</h3>
                    <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-2">
                        {machines.map(machine => (
                            <button
                                key={machine.id}
                                onClick={() => setSelectedMachine(machine)}
                                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${selectedMachine?.id === machine.id ? 'bg-disa-accent-blue/20' : 'hover:bg-gray-500/10'}`}
                            >
                                <CpuChipIcon className="w-6 h-6 text-disa-accent-blue" />
                                <span className="font-semibold">{machine.name}</span>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-3">
                <Card className="h-full">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {selectedMachine ? `Programs for ${selectedMachine.name}` : 'Select a Machine'}
                        </h3>
                        <button className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                            <PlusIcon className="w-5 h-5" /> Upload Program
                        </button>
                    </div>
                    
                    <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                         {selectedMachine ? (
                            programsForSelectedMachine.length > 0 ? (
                                programsForSelectedMachine.map(program => (
                                    <ProgramCard key={program.id} program={program} />
                                ))
                            ) : (
                                <div className="text-center py-16 text-gray-500">
                                    <FolderIcon className="w-16 h-16 mx-auto" />
                                    <p className="mt-2 font-semibold">No programs found for this machine.</p>
                                </div>
                            )
                        ) : (
                             <div className="text-center py-16 text-gray-500">
                                <p>Select a machine from the list to view its programs.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const ProgramCard: React.FC<{ program: MachineProgram }> = ({ program }) => {
    const [isHistoryVisible, setHistoryVisible] = useState(false);
    const latestVersion = program.versions[0];
    
    return (
        <Card className="!p-4 bg-gray-500/5">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-disa-accent-purple" />
                        <h4 className="font-bold text-lg">{program.programName}</h4>
                        {program.isPasswordProtected && <LockClosedIcon className="w-4 h-4 text-gray-500" title="Password Protected" />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{program.description}</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-600 dark:text-gray-300">{program.fileType}</span>
            </div>
            
            <div className="flex justify-between items-center mt-4 text-sm">
                 <div>
                    <span className="font-semibold">Latest Version:</span> {latestVersion.version}
                    <span className="mx-2">|</span>
                    <span className="font-semibold">Updated:</span> {latestVersion.uploadTimestamp.toLocaleDateString()}
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setHistoryVisible(!isHistoryVisible)} className="px-3 py-1 font-semibold text-gray-700 transition-colors rounded-md dark:text-gray-300 bg-gray-500/20 hover:bg-gray-500/30">
                        {isHistoryVisible ? 'Hide' : 'Show'} History
                    </button>
                    <button className="px-3 py-1 font-semibold text-white transition-colors rounded-md bg-disa-accent-green hover:bg-green-500">Download</button>
                 </div>
            </div>
            
            <AnimatePresence>
            {isHistoryVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="mt-4 pt-4 border-t border-gray-500/10">
                         <h5 className="font-bold mb-2 flex items-center gap-2"><ClockIcon className="w-5 h-5" /> Version History</h5>
                         <ul className="space-y-2 text-sm">
                            {program.versions.map(v => (
                                <li key={v.version} className="p-2 rounded-md bg-gray-500/10">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Version {v.version}</span>
                                        <span className="text-xs text-gray-500">{v.uploadTimestamp.toLocaleString()} by {v.uploadedByUserId}</span>
                                    </div>
                                    <p className="text-xs italic text-gray-600 dark:text-gray-400">Notes: {v.notes}</p>
                                </li>
                            ))}
                         </ul>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </Card>
    );
};

export default ProgramLibraryView;