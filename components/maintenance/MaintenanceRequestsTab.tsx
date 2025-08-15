
import React from 'react';
import { useProductionData } from '../../hooks/useProductionData';
import { MaintenanceRequest, User, Machine } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { PlusIcon } from '../common/Icons';

const MaintenanceRequestsTab: React.FC<{ user: User }> = () => {
    const { maintenanceRequests, machines, addMaintenanceRequest } = useProductionData();
    const [isRequestModalOpen, setRequestModalOpen] = React.useState(false);
    
    const sortedRequests = [...maintenanceRequests].sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime());
    
    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <button onClick={() => setRequestModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                    <PlusIcon className="w-5 h-5" />
                    New Request
                </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {sortedRequests.map(req => (
                    <RequestCard key={req.id} request={req} />
                ))}
            </div>
             <NewRequestModal 
                isOpen={isRequestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                onSubmit={addMaintenanceRequest}
                machines={machines}
            />
        </div>
    );
};

const RequestCard: React.FC<{ request: MaintenanceRequest }> = ({ request }) => {
    const priorityStyles = {
        Critical: 'text-red-500',
        Medium: 'text-yellow-500',
        Low: 'text-green-500'
    };

    return (
        <Card className="!p-4">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-800 dark:text-white">{request.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Machine: {request.machineId} | Reported: {new Date(request.reportedDate).toLocaleDateString()}</p>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{request.description}</p>
                </div>
                <div className="text-right">
                     <p className={`font-bold ${priorityStyles[request.priority]}`}>{request.priority}</p>
                     <p className="text-sm text-gray-500">{request.status}</p>
                </div>
            </div>
        </Card>
    );
};


const NewRequestModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSubmit: (request: Omit<MaintenanceRequest, 'id' | 'reportedDate' | 'status'>) => void,
    machines: Machine[],
}> = ({isOpen, onClose, onSubmit, machines}) => {
    const [title, setTitle] = React.useState('');
    const [machineId, setMachineId] = React.useState(machines[0]?.id || '');
    const [description, setDescription] = React.useState('');
    const [type, setType] = React.useState<'Corrective' | 'Preventive'>('Corrective');
    const [priority, setPriority] = React.useState<'Low' | 'Medium' | 'Critical'>('Medium');

    const handleSubmit = () => {
        if (!title || !machineId || !description) {
            alert("Please fill all required fields.");
            return;
        }
        onSubmit({ title, machineId, description, type, priority, estimatedDurationHours: 0, estimatedCost: 0, partsRequired: [] });
        onClose();
        // Reset form
        setTitle('');
        setMachineId(machines[0]?.id || '');
        setDescription('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Maintenance Request">
            <div className="space-y-4">
                <InputField label="Issue Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Hydraulic Leak" />
                <SelectField label="Machine" value={machineId} onChange={e => setMachineId(e.target.value)}>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </SelectField>
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Type" value={type} onChange={e => setType(e.target.value as any)}>
                        <option>Corrective</option>
                        <option>Preventive</option>
                    </SelectField>
                    <SelectField label="Priority" value={priority} onChange={e => setPriority(e.target.value as any)}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>Critical</option>
                    </SelectField>
                </div>
                <div>
                    <label htmlFor="description" className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                        placeholder="Provide details about the issue..."
                    />
                </div>
                <button onClick={handleSubmit} className="w-full py-3 mt-6 font-bold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700">Submit Request</button>
            </div>
        </Modal>
    );
}

const InputField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string}> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" />
    </div>
);

const SelectField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <select value={value} onChange={onChange} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
            {children}
        </select>
    </div>
);

export default MaintenanceRequestsTab;