
import React, { useState } from 'react';
import Modal from '../common/Modal';
import { SafetyWorkPermit, BreakdownReport } from '../../types';
// Assume a hook or context provides access to users with specific roles
import { useUsers } from '../../hooks/useUsers';

interface SafetyPermitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (permit: Omit<SafetyWorkPermit, 'id' | 'status' | 'issueTimestamp'>) => void;
    breakdown: BreakdownReport;
}

const SafetyPermitModal: React.FC<SafetyPermitModalProps> = ({ isOpen, onClose, onSubmit, breakdown }) => {
    const { users } = useUsers(); // You would filter this for Safety Officers etc.
    const [permitType, setPermitType] = useState<SafetyWorkPermit['type']>('Lockout-Tagout');
    const [validTo, setValidTo] = useState(() => {
        const eightHoursFromNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
        const offset = eightHoursFromNow.getTimezoneOffset() * 60000;
        const localISOTime = new Date(eightHoursFromNow.getTime() - offset).toISOString().slice(0, 16);
        return localISOTime;
    });
    const [safetyChecks, setSafetyChecks] = useState<{ check: string; completed: boolean }[]>([
        { check: 'Energy sources isolated and verified', completed: false },
        { check: 'Machine is properly locked and tagged', completed: false },
        { check: 'Area is clear of personnel', completed: false },
    ]);
    // These would be dropdowns in a real app
    const issuedByUserId = 'safe01'; 
    const receivedByUserId = 'sup01';

    const handleToggleCheck = (index: number) => {
        const newChecks = [...safetyChecks];
        newChecks[index].completed = !newChecks[index].completed;
        setSafetyChecks(newChecks);
    };

    const handleSubmit = () => {
        if (safetyChecks.some(c => !c.completed)) {
            alert('All safety checks must be completed to issue the permit.');
            return;
        }
        if (!validTo) {
            alert('Please set a validity date and time for the permit.');
            return;
        }
        onSubmit({
            breakdownId: breakdown.id,
            type: permitType,
            issuedByUserId,
            receivedByUserId,
            validTo: new Date(validTo),
            safetyChecks,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Issue Safety Permit for ${breakdown.machineId}`}>
            <div className="space-y-4">
                <p>Breakdown: <span className="font-semibold">{breakdown.description}</span></p>
                <SelectField label="Permit Type" value={permitType} onChange={e => setPermitType(e.target.value as any)}>
                    <option>Lockout-Tagout</option>
                    <option>Hot Work</option>
                    <option>Confined Space</option>
                    <option>Working at Height</option>
                </SelectField>

                 <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Valid Until</label>
                    <input
                        type="datetime-local"
                        value={validTo}
                        onChange={e => setValidTo(e.target.value)}
                        className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Safety Checklist</label>
                    <div className="space-y-2">
                        {safetyChecks.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-500/10">
                                <input type="checkbox" checked={item.completed} onChange={() => handleToggleCheck(index)} className="h-5 w-5 rounded accent-disa-red" />
                                <label>{item.check}</label>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-green hover:bg-green-600">Issue Permit</button>
                </div>
            </div>
        </Modal>
    );
};

const SelectField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <select value={value} onChange={onChange} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
            {children}
        </select>
    </div>
);

export default SafetyPermitModal;
