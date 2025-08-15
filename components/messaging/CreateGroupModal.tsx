
import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { User, Role } from '../../types';
import { useUsers } from '../../hooks/useUsers';
import { MagnifyingGlassIcon } from '../common/Icons';

interface CreateGroupModalProps {
    currentUser: User;
    onClose: () => void;
    onCreateGroup: (name: string, supervisorId: string, memberIds: string[]) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ currentUser, onClose, onCreateGroup }) => {
    const { users } = useUsers();
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const operators = useMemo(() => {
        return users.filter(u => u.role === Role.Operator && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [users, searchTerm]);

    const handleToggleMember = (uid: string) => {
        setSelectedMembers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
    };

    const handleCreate = () => {
        if (!groupName.trim() || selectedMembers.length === 0) {
            alert('Please provide a group name and select at least one member.');
            return;
        }
        onCreateGroup(groupName, currentUser.uid, selectedMembers);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Create New Group">
            <div className="space-y-4">
                <div>
                    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Group Name</label>
                    <input
                        type="text"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        placeholder="e.g., Line 1 - Morning Shift"
                        className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Add Members</label>
                    <div className="relative mb-2">
                        <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 top-1/2 left-3" />
                        <input
                            type="text"
                            placeholder="Search operators..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border"
                        />
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-1 border-2 rounded-lg border-disa-light-border dark:border-disa-dark-border">
                        {operators.map(op => (
                            <button
                                key={op.uid}
                                onClick={() => handleToggleMember(op.uid)}
                                className={`flex items-center w-full gap-3 p-2 text-left transition-colors rounded-lg ${selectedMembers.includes(op.uid) ? 'bg-disa-accent-blue/50' : 'hover:bg-gray-200/50 dark:hover:bg-black/20'}`}
                            >
                                <img src={op.profilePicUrl || `https://i.pravatar.cc/150?u=${op.employeeId}`} alt={op.name} className="object-cover w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{op.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{op.employeeId}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleCreate} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">Create Group</button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateGroupModal;
