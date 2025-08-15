

import React, { useState, useMemo } from 'react';
import { User, Role, Machine, TrainingRecord, Team } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useUsers } from '../hooks/useUsers';
import { useProductionData } from '../hooks/useProductionData';
import { useTeams } from '../hooks/useTeams';
import { motion } from 'framer-motion';
import { AcademicCapIcon, CheckCircleIcon, InformationCircleIcon, UsersIcon, ExclamationCircleIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '../components/common/Icons';

const getTrainingStatusSummary = (records?: TrainingRecord[]) => {
    if (!records || records.length === 0) {
        return { text: 'No Records', color: 'text-gray-500', icon: InformationCircleIcon };
    }
    
    const now = new Date();
    const expiredCount = records.filter(r => r.expiresDate && new Date(r.expiresDate) < now).length;
    
    if (expiredCount > 0) {
        return { text: `${expiredCount} Expired`, color: 'text-red-500', icon: ExclamationCircleIcon };
    }
    
    return { text: `${records.length} Valid`, color: 'text-green-500', icon: CheckCircleIcon };
};

const KpiCard: React.FC<{title: string, value: string | number}> = ({ title, value }) => (
    <Card className="text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-4xl font-bold text-disa-red">{value}</p>
    </Card>
);

const OperatorCard: React.FC<{operator: User, machine?: Machine, onClick: () => void}> = ({ operator, machine, onClick }) => {
    const trainingStatus = getTrainingStatusSummary(operator.trainingRecords);
    const TrainingIcon = trainingStatus.icon;

    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="cursor-pointer"
        >
            <Card className="h-full">
                <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                        <img src={operator.profilePicUrl || `https://i.pravatar.cc/150?u=${operator.employeeId}`} alt={operator.name} className="object-cover w-16 h-16 rounded-full" />
                        <span className={`absolute bottom-0 right-0 block h-4 w-4 rounded-full ${operator.isOnline ? 'bg-disa-accent-green' : 'bg-gray-400'} border-2 border-white dark:border-gray-800`}></span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-800 truncate dark:text-white">{operator.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {operator.employeeId}</p>
                    </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">Machine:</span>
                        <span className="font-bold text-gray-800 dark:text-white">{machine?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">Training:</span>
                        <span className={`flex items-center gap-1 font-bold ${trainingStatus.color}`}>
                            <TrainingIcon className="w-4 h-4" />
                            {trainingStatus.text}
                        </span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

const getTrainingRecordStatus = (record: TrainingRecord) => {
    if (!record.expiresDate) return { text: 'Valid', color: 'text-green-500 dark:text-green-400' };
    
    const now = new Date();
    const expires = new Date(record.expiresDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    if (expires < now) return { text: 'Expired', color: 'text-red-500 dark:text-red-400' };
    if (expires < thirtyDaysFromNow) return { text: 'Expires Soon', color: 'text-yellow-500 dark:text-yellow-400' };
    
    return { text: 'Valid', color: 'text-green-500 dark:text-green-400' };
};

const OperatorDetailModal: React.FC<{operator: User, machine?: Machine, onClose: () => void}> = ({ operator, machine, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Operator Details: ${operator.name}`}>
            <div className="space-y-6">
                <div className="flex items-center gap-6">
                    <img src={operator.profilePicUrl || `https://i.pravatar.cc/150?u=${operator.employeeId}`} alt={operator.name} className="object-cover w-24 h-24 rounded-full" />
                    <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{operator.name}</p>
                        <p className="text-gray-500 dark:text-gray-400">ID: {operator.employeeId}</p>
                        <p className="text-gray-500 dark:text-gray-400">Assigned: {machine?.name || 'N/A'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                        <AcademicCapIcon className="w-6 h-6" />
                        Training Records
                    </h3>
                    <div className="overflow-x-auto rounded-lg bg-gray-500/5">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-500/10">
                                <tr>
                                    <th className="p-3 font-semibold">Course Name</th>
                                    <th className="p-3 font-semibold">Completed</th>
                                    <th className="p-3 font-semibold">Expires</th>
                                    <th className="p-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operator.trainingRecords && operator.trainingRecords.length > 0 ? operator.trainingRecords.map(record => {
                                    const status = getTrainingRecordStatus(record);
                                    return (
                                        <tr key={record.id} className="border-b border-gray-500/10">
                                            <td className="p-3">{record.name}</td>
                                            <td className="p-3">{new Date(record.completedDate).toLocaleDateString()}</td>
                                            <td className="p-3">{record.expiresDate ? new Date(record.expiresDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className={`p-3 font-bold ${status.color}`}>{status.text}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-gray-500">No training records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">Close</button>
                </div>
            </div>
        </Modal>
    );
}


const TeamView: React.FC<{ user: User }> = ({ user }) => {
    const { users } = useUsers();
    const { machines, projects } = useProductionData();
    const { teams, addTeam, updateTeam, removeTeam, loading } = useTeams();
    const [selectedOperator, setSelectedOperator] = useState<User | null>(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [teamForm, setTeamForm] = useState<Omit<Team, 'id'> | null>(null);
    const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

    const supervisors = useMemo(() => users.filter(u => u.role === Role.Supervisor), [users]);
    const operators = useMemo(() => users.filter(u => u.role === Role.Operator), [users]);

    // KPIs for all operators
    const teamKpis = useMemo(() => {
        const onlineCount = operators.filter(o => o.isOnline).length;
        let validTrainings = 0;
        let totalTrainings = 0;
        operators.forEach(op => {
            if (op.trainingRecords) {
                op.trainingRecords.forEach(tr => {
                    totalTrainings++;
                    if (!tr.expiresDate || new Date(tr.expiresDate) > new Date()) {
                        validTrainings++;
                    }
                });
            }
        });
        const compliance = totalTrainings > 0 ? (validTrainings / totalTrainings) * 100 : 100;
        return {
            totalOperators: operators.length,
            online: onlineCount,
            trainingCompliance: compliance,
        };
    }, [operators]);

    // Supervisor CRUD: Only supervisors can manage teams
    const canManageTeams = user.role === Role.Supervisor;

    const handleOpenCreate = () => {
        setEditingTeam(null);
        setTeamForm({ name: '', supervisorId: user.uid, operatorIds: [], projectIds: [] });
        setShowTeamModal(true);
    };
    const handleOpenEdit = (team: Team) => {
        setEditingTeam(team);
        setTeamForm({ name: team.name, supervisorId: team.supervisorId, operatorIds: [...team.operatorIds], projectIds: [...team.projectIds] });
        setShowTeamModal(true);
    };
    const handleCloseModal = () => {
        setShowTeamModal(false);
        setEditingTeam(null);
        setTeamForm(null);
    };
    const handleFormChange = (field: keyof Omit<Team, 'id'>, value: any) => {
        if (!teamForm) return;
        setTeamForm({ ...teamForm, [field]: value });
    };
    const handleToggleOperator = (uid: string) => {
        if (!teamForm) return;
        const operatorIds = teamForm.operatorIds.includes(uid)
            ? teamForm.operatorIds.filter(id => id !== uid)
            : [...teamForm.operatorIds, uid];
        setTeamForm({ ...teamForm, operatorIds });
    };
    const handleToggleProject = (pid: string) => {
        if (!teamForm) return;
        const projectIds = teamForm.projectIds.includes(pid)
            ? teamForm.projectIds.filter(id => id !== pid)
            : [...teamForm.projectIds, pid];
        setTeamForm({ ...teamForm, projectIds });
    };
    const handleSaveTeam = async () => {
        if (!teamForm) return;
        if (editingTeam) {
            await updateTeam({ ...editingTeam, ...teamForm });
        } else {
            await addTeam(teamForm);
        }
        handleCloseModal();
    };
    const handleDeleteTeam = async () => {
        if (deleteTeamId) {
            await removeTeam(deleteTeamId);
            setDeleteTeamId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Total Operators" value={teamKpis.totalOperators} />
                <KpiCard title="Operators Online" value={teamKpis.online} />
                <KpiCard title="Training Compliance" value={`${teamKpis.trainingCompliance.toFixed(0)}%`} />
            </div>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Teams</h2>
                    {canManageTeams && (
                        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                            <PlusIcon className="w-5 h-5" /> New Team
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <Card key={team.id} className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-lg">{team.name}</span>
                                {canManageTeams && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenEdit(team)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Edit Team"><PencilSquareIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setDeleteTeamId(team.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900" title="Delete Team"><TrashIcon className="w-5 h-5 text-red-500" /></button>
                                    </div>
                                )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Supervisor: {users.find(u => u.uid === team.supervisorId)?.name || 'N/A'}</div>
                            <div className="text-sm mb-1">Operators: {team.operatorIds.map(uid => users.find(u => u.uid === uid)?.name).filter(Boolean).join(', ') || 'None'}</div>
                            <div className="text-sm mb-1">Projects: {team.projectIds.map(pid => projects.find(p => p.id === pid)?.name).filter(Boolean).join(', ') || 'None'}</div>
                        </Card>
                    ))}
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Operator Roster</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                    {operators.map(op => (
                        <OperatorCard 
                            key={op.uid} 
                            operator={op} 
                            machine={machines.find(m => m.id === op.assignedMachineId)} 
                            onClick={() => setSelectedOperator(op)}
                        />
                    ))}
                </div>
            </Card>

            {selectedOperator && (
                <OperatorDetailModal 
                    operator={selectedOperator}
                    machine={machines.find(m => m.id === selectedOperator.assignedMachineId)}
                    onClose={() => setSelectedOperator(null)}
                />
            )}

            {/* Team Create/Edit Modal */}
            {showTeamModal && teamForm && (
                <Modal isOpen={showTeamModal} onClose={handleCloseModal} title={editingTeam ? 'Edit Team' : 'Create Team'}>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-semibold mb-1">Team Name</label>
                            <input type="text" className="w-full p-2 rounded border" value={teamForm.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="Enter team name" title="Team Name" />
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Supervisor</label>
                            <select className="w-full p-2 rounded border" value={teamForm.supervisorId} onChange={e => handleFormChange('supervisorId', e.target.value)} title="Supervisor">
                                {supervisors.map(sup => (
                                    <option key={sup.uid} value={sup.uid}>{sup.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Operators</label>
                            <div className="flex flex-wrap gap-2">
                                {operators.map(op => (
                                    <label key={op.uid} className="flex items-center gap-1">
                                        <input type="checkbox" checked={teamForm.operatorIds.includes(op.uid)} onChange={() => handleToggleOperator(op.uid)} />
                                        {op.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Projects</label>
                            <div className="flex flex-wrap gap-2">
                                {projects.map(proj => (
                                    <label key={proj.id} className="flex items-center gap-1">
                                        <input type="checkbox" checked={teamForm.projectIds.includes(proj.id)} onChange={() => handleToggleProject(proj.id)} />
                                        {proj.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={handleCloseModal} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 font-semibold">Cancel</button>
                            <button onClick={handleSaveTeam} className="px-4 py-2 rounded bg-disa-accent-blue text-white font-semibold">{editingTeam ? 'Update' : 'Create'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTeamId && (
                <Modal isOpen={true} onClose={() => setDeleteTeamId(null)} title="Delete Team?">
                    <div className="space-y-4">
                        <p>Are you sure you want to delete this team? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteTeamId(null)} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 font-semibold">Cancel</button>
                            <button onClick={handleDeleteTeam} className="px-4 py-2 rounded bg-red-600 text-white font-semibold">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default TeamView;
