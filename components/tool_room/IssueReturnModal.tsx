
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Tool, User, Machine } from '../../types';

interface IssueReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: 'issue' | 'return';
    tool: Tool;
    operators: User[];
    machines: Machine[];
    onIssue: (toolId: string, issuedToUserId: string, machineId: string) => void;
    onReturn: (toolId: string) => void;
}

const IssueReturnModal: React.FC<IssueReturnModalProps> = ({ isOpen, onClose, action, tool, operators, machines, onIssue, onReturn }) => {
    const [issuedToUserId, setIssuedToUserId] = useState('');
    const [machineId, setMachineId] = useState('');

    useEffect(() => {
        if (isOpen && operators.length > 0) {
            setIssuedToUserId(operators[0].uid);
        }
        if (isOpen && machines.length > 0) {
            setMachineId(machines[0].id);
        }
    }, [isOpen, operators, machines]);

    const handleSubmit = () => {
        if (action === 'issue') {
            if (!issuedToUserId || !machineId) {
                alert('Please select an operator and a machine.');
                return;
            }
            onIssue(tool.id, issuedToUserId, machineId);
        } else {
            onReturn(tool.id);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={action === 'issue' ? `Issue Tool: ${tool.name}` : `Return Tool: ${tool.name}`}>
            <div className="space-y-4">
                <p>Tool Serial Number: <span className="font-mono">{tool.serialNumber}</span></p>
                {action === 'issue' ? (
                    <>
                        <SelectField label="Issue to Operator" value={issuedToUserId} onChange={e => setIssuedToUserId(e.target.value)}>
                            {operators.map(op => <option key={op.uid} value={op.uid}>{op.name}</option>)}
                        </SelectField>
                        <SelectField label="For Machine" value={machineId} onChange={e => setMachineId(e.target.value)}>
                            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </SelectField>
                    </>
                ) : (
                    <p>Confirm the return of this tool to the tool crib.</p>
                )}
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                        {action === 'issue' ? 'Confirm Issue' : 'Confirm Return'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const SelectField: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <select value={value} onChange={onChange} className="w-full p-2.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
            {children}
        </select>
    </div>
);

export default IssueReturnModal;