import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { ShieldCheckIcon, UserPlusIcon, PencilSquareIcon, TrashIcon, Cog6ToothIcon, ArrowUpOnSquareIcon, UsersIcon } from '../components/common/Icons';
import SettingsView from './SettingsView';
import { MOCK_USERS } from '../constants';
import { User, Role } from '../types';
import { useAppSettings } from '../hooks/useAppSettings';
import { useUsers } from '../hooks/useUsers';
import { readFileAsBase64 } from '../utils/helpers';
import { useNotifications } from '../hooks/useNotifications';
import { AnimatePresence, motion } from 'framer-motion';

const TabButton: React.FC<{id: string, label: string, icon: React.ElementType, isActive: boolean, onClick: () => void}> = ({id, label, icon: Icon, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 font-semibold transition-colors rounded-t-lg ${isActive ? 'text-disa-red border-b-2 border-disa-red bg-gray-500/5' : 'text-gray-500 hover:text-disa-red border-b-2 border-transparent'}`}
    >
        <Icon className="w-6 h-6" />
        {label}
    </button>
);


const ApplicationSettings: React.FC = () => {
    const { appName, appLogo, setAppName, setAppLogo } = useAppSettings();
    const { addNotification } = useNotifications();
    const [localAppName, setLocalAppName] = useState(appName);
    const [localAppLogo, setLocalAppLogo] = useState<string | null>(appLogo);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await readFileAsBase64(e.target.files[0]);
                setLocalAppLogo(base64);
            } catch (err) {
                console.error("Error reading file:", err);
                addNotification({ title: 'Error', message: 'Could not load image file.', type: 'error' });
            }
        }
    };
    
    const handleSave = () => {
        setAppName(localAppName);
        setAppLogo(localAppLogo);
        addNotification({ title: 'Success', message: 'Application settings have been saved.', type: 'success' });
    };
    
    const isChanged = localAppName !== appName || localAppLogo !== appLogo;

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                 <div className="md:col-span-2 space-y-6">
                     <div>
                        <label htmlFor="appName" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Application Name</label>
                        <input
                            id="appName"
                            type="text"
                            value={localAppName}
                            onChange={e => setLocalAppName(e.target.value)}
                            className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                        />
                     </div>
                 </div>
                 <div className="flex flex-col items-center col-span-1 gap-4">
                     <label id="logo-upload-label" className="font-semibold text-gray-700 dark:text-gray-200">Application Logo</label>
                    <img src={localAppLogo || ''} alt="App Logo Preview" className="object-cover w-32 h-32 p-2 rounded-full bg-gray-200/50 dark:bg-black/20" />
                    <input type="file" accept="image/*,.svg" ref={logoInputRef} onChange={handleLogoChange} className="hidden" aria-labelledby="logo-upload-label" />
                    <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-lg text-gray-800 dark:text-white bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40">
                        <ArrowUpOnSquareIcon className="w-4 h-4" /> Upload Logo
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-end gap-4 mt-6">
                <button onClick={handleSave} disabled={!isChanged} className="px-6 py-3 font-bold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Save App Settings
                </button>
            </div>
        </div>
    );
};

const UserAdministrationPanel: React.FC = () => {
    const { users, addUser, updateUser, removeUser } = useUsers();
    const { addNotification } = useNotifications();
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToRemove, setUserToRemove] = useState<User | null>(null);

    const openAddModal = () => {
        setEditingUser(null);
        setModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleSaveUser = async (formData: Omit<User, 'uid'>) => {
        try {
            if (editingUser) { // This is an update
                await updateUser({ ...editingUser, ...formData });
                 addNotification({ title: 'User Updated', message: `${formData.name} has been successfully updated.`, type: 'success' });
            } else { // This is an addition
                await addUser(formData);
                addNotification({ title: 'User Added', message: `${formData.name} has been added to the system.`, type: 'success' });
            }
            setModalOpen(false);
        } catch (e: any) {
            addNotification({ title: 'Error', message: e.message || 'Failed to save user.', type: 'error' });
        }
    };

    const handleRemoveUser = () => {
        if(userToRemove) {
            removeUser(userToRemove.uid);
            addNotification({ title: 'User Removed', message: `${userToRemove.name} has been removed.`, type: 'info' });
        }
        setUserToRemove(null);
    }

    return (
        <div>
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-end">
                <button onClick={openAddModal} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                    <UserPlusIcon className="w-5 h-5" /> Add User
                </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {users.map(user => (
                    <UserAdminCard
                        key={user.uid}
                        user={user}
                        onEdit={openEditModal}
                        onRemove={setUserToRemove}
                    />
                ))}
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
                <UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => setModalOpen(false)} />
            </Modal>
             <ConfirmationModal
                isOpen={!!userToRemove}
                onClose={() => setUserToRemove(null)}
                onConfirm={handleRemoveUser}
                title="Remove User"
                confirmText="Remove"
            >
                <p>Are you sure you want to permanently remove <span className="font-bold">{userToRemove?.name}</span>? This action cannot be undone.</p>
            </ConfirmationModal>
        </div>
    );
}

const UserForm: React.FC<{ user: User | null, onSave: (data: Omit<User, 'uid' | 'password'>) => Promise<void>, onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<User, 'uid' | 'password'>>({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || Role.Operator,
        employeeId: user?.employeeId || ''
    });
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const isAdminUser = user?.role === Role.Admin;

    const handleSubmit = async () => {
      setError('');
      if (!formData.name || !formData.email || !formData.role || !formData.employeeId) {
        setError("All fields are required.");
        return;
      }
      if (!user && !password) {
        setError("Password is required for new users.");
        return;
      }
      if (isAdminUser && password) {
        setError("Admin password cannot be changed.");
        return;
      }

      const dataToSave: Omit<User, 'uid'> = { ...formData };
      if (!isAdminUser && password) {
          dataToSave.password = password;
      }
      await onSave(dataToSave);
    };

    return (
        <div className="space-y-4">
            {error && <p className="p-3 text-red-700 bg-red-100 rounded-lg">{error}</p>}
            <div>
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">User Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="e.g., Alex Ray"/>
            </div>
            <div>
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="e.g., a.ray@disa.com" disabled={!!user} />
            </div>
             <div>
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Employee ID</label>
                <input type="text" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder="e.g., E123"/>
            </div>
             <div>
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Role</label>
                <select title="Role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full p-3.5 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
                   <option value={Role.Operator}>Operator</option>
                   <option value={Role.Supervisor}>Supervisor</option>
                   <option value={Role.Manager}>Manager</option>
                </select>
            </div>
            <div>
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <input type="password" value={isAdminUser ? '********' : password} onChange={e => !isAdminUser && setPassword(e.target.value)} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border" placeholder={isAdminUser ? "Immutable" : user ? "Leave blank to keep current password" : "Required for new user"} disabled={isAdminUser}/>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button onClick={onCancel} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                <button onClick={handleSubmit} className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">Save User</button>
            </div>
        </div>
    )
};

const UserAdminCard: React.FC<{ user: User; onEdit: (user: User) => void; onRemove: (user: User) => void; }> = React.memo(({ user, onEdit, onRemove }) => {
    return (
        <div className="p-4 rounded-lg bg-gray-200/50 dark:bg-black/20">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.employeeId}`} alt={user.name} className="object-cover w-12 h-12 rounded-full" />
                    <div>
                        <p className="font-bold text-gray-800 dark:text-white">{user.name}</p>
                        <p className="text-sm font-semibold text-disa-red">{user.role}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.employeeId}</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button title="Edit" onClick={() => onEdit(user)} className="p-2 text-gray-500 transition-colors rounded-full hover:bg-blue-500/20 hover:text-blue-500"><PencilSquareIcon className="w-5 h-5" /></button>
                    <button title="Remove" onClick={() => onRemove(user)} className="p-2 text-gray-500 transition-colors rounded-full hover:bg-red-500/20 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
});


interface AdminViewProps { onLogout?: () => void; initialTab?: string; }
const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('admin_users');
    return (
        <div className="space-y-8">
            {onLogout && (
                <div className="flex justify-end mb-2">
                    <button onClick={onLogout} className="px-4 py-2 font-semibold text-white bg-disa-red rounded-lg hover:bg-red-700">Logout</button>
                </div>
            )}
            <Card>
                <div className="pt-6">
                    <UserAdministrationPanel />
                </div>
            </Card>
        </div>
    );
};

export default AdminView;