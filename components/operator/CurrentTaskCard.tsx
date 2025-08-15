import React from 'react';
import { User, Machine, ProductionOrder, DowntimeEvent } from '../../types';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { PlusCircleIcon, ClockIcon, PlayIcon, CubeIcon, CpuChipIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon } from '../common/Icons';

interface CurrentTaskCardProps {
    user: User;
    machine?: Machine;
    productionOrder?: ProductionOrder;
    activeDowntime?: DowntimeEvent | null;
    onLogProduction: () => void;
    onStartDowntime: () => void;
    onEndDowntime: () => void;
    onReportIssue: () => void;
    onRequestMaintenance: () => void;
    onSelectWorkstation: () => void;
}

const CurrentTaskCard: React.FC<CurrentTaskCardProps> = ({
    user,
    machine,
    productionOrder,
    activeDowntime,
    onLogProduction,
    onStartDowntime,
    onEndDowntime,
    onReportIssue,
    onRequestMaintenance,
    onSelectWorkstation,
}) => {
    
    if (!machine) {
        return (
            <Card>
                <div className="text-center py-8">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">YOUR WORKSTATION</p>
                    <CpuChipIcon className="w-16 h-16 mx-auto my-4 text-gray-400" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No Workstation Assigned</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Select a machine to begin logging production and viewing tasks.
                    </p>
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={onSelectWorkstation} 
                        className="mt-6 flex items-center justify-center gap-2 px-6 py-3 mx-auto font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500"
                    >
                        <PlusCircleIcon className="w-6 h-6" />
                        Select Workstation
                    </motion.button>
                </div>
            </Card>
        );
    }
    
    if (!productionOrder) {
        return (
            <Card className="flex flex-col items-center justify-center text-center py-12">
                 <div className="text-center">
                    <div className="flex justify-center items-center gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">YOUR WORKSTATION</p>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                <CpuChipIcon className="w-8 h-8"/> {machine.name}
                            </h2>
                        </div>
                         <button onClick={onSelectWorkstation} className="self-end pb-1 text-sm font-semibold text-disa-accent-blue hover:underline">Change</button>
                    </div>
                </div>
                <CubeIcon className="w-16 h-16 my-4 text-gray-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No Active Production Order</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    There are currently no production orders in progress.
                </p>
            </Card>
        );
    }
    
    const progress = productionOrder.quantity.target > 0 
        ? (productionOrder.quantity.produced / productionOrder.quantity.target) * 100 
        : 0;

    return (
        <Card>
            <div className="text-center">
                <div className="flex justify-center items-center gap-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">YOUR WORKSTATION</p>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                            <CpuChipIcon className="w-8 h-8"/> {machine.name}
                        </h2>
                    </div>
                    <button onClick={onSelectWorkstation} className="self-end pb-1 text-sm font-semibold text-disa-accent-blue hover:underline">Change</button>
                </div>
                 <motion.div 
                    layout 
                    className={`inline-block px-4 py-1 my-2 text-lg font-bold rounded-full ${ machine?.status === 'Running' ? 'bg-disa-accent-green text-white' : machine?.status === 'Idle' ? 'bg-disa-accent-yellow text-black' : 'bg-disa-red text-white' }`}
                >
                    {machine?.status || 'N/A'}
                </motion.div>
                 {activeDowntime && <p className="font-semibold text-disa-accent-yellow">{activeDowntime.reason}</p>}
            </div>

            <div className="mt-8">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">CURRENT PRODUCTION ORDER</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{productionOrder.id}</h3>
                <p className="text-gray-600 dark:text-gray-300">{productionOrder.partDescription}</p>
                <div className="mt-4">
                    <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-4 dark:bg-gray-700 mt-1">
                        <div className="bg-disa-accent-blue h-4 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ width: `${progress}%` }}>
                             {progress > 10 && `${progress.toFixed(0)}%`}
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{productionOrder.quantity.produced.toLocaleString()} / {productionOrder.quantity.target.toLocaleString()} units</span>
                        <span>Due: {new Date(productionOrder.dueDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={onLogProduction} 
                    disabled={!!activeDowntime}
                    className="col-span-2 flex items-center justify-center w-full gap-3 px-6 py-4 text-xl font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    <PlusCircleIcon className="inline w-7 h-7" />
                    Log Production
                </motion.button>

                {activeDowntime ? (
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={onEndDowntime}
                        className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-green hover:bg-green-600">
                        <PlayIcon className="w-6 h-6"/>
                        End Downtime
                    </motion.button>
                ) : (
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={onStartDowntime}
                        className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-gray-600 hover:bg-gray-700">
                        <ClockIcon className="w-6 h-6"/>
                        Start Downtime
                    </motion.button>
                )}
                
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={onReportIssue}
                    title="Report Issue"
                    className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-yellow hover:bg-yellow-500">
                    <ExclamationTriangleIcon className="w-6 h-6"/>
                    Report Issue
                </motion.button>

                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={onRequestMaintenance}
                    title="Request Maintenance"
                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700">
                    <WrenchScrewdriverIcon className="w-6 h-6"/>
                    Request Maintenance
                </motion.button>
            </div>
        </Card>
    );
};

export default CurrentTaskCard;