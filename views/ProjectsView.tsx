
import React, { useState, useMemo } from 'react';
import { User, Project, ProjectTask, Role } from '../types';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useProductionData } from '../hooks/useProductionData';
import { GanttChartIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '../components/common/Icons';
import { useUsers } from '../hooks/useUsers';

const ProjectsView: React.FC<{ user: User }> = ({ user }) => {
    const { projects, dispatch } = useProductionData();
    const { users } = useUsers();
    const [selectedProject, setSelectedProject] = useState<Project | null>(projects?.[0] || null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projectForm, setProjectForm] = useState<Omit<Project, 'id' | 'tasks'> | null>(null);
    const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
    const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
    const [taskForm, setTaskForm] = useState<Omit<ProjectTask, 'id'> | null>(null);
    const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

    const canManageProjects = user.role === Role.Supervisor;

    const projectKpis = useMemo(() => {
        if (!projects) return { active: 0, delayed: 0, completed: 0 };
        const active = projects.filter(p => p.status === 'Active').length;
        const delayed = projects.filter(p => p.status === 'Delayed').length;
        const completed = projects.filter(p => p.status === 'Completed').length;
        return { active, delayed, completed };
    }, [projects]);

    if (!projects) return null;

    // Project CRUD handlers
    const handleOpenCreate = () => {
        setEditingProject(null);
        setProjectForm({ name: '', projectManagerId: user.uid, startDate: new Date(), endDate: new Date(), status: 'Planning' });
        setProjectTasks([]);
        setShowProjectModal(true);
    };
    const handleOpenEdit = (project: Project) => {
        setEditingProject(project);
        setProjectForm({ name: project.name, projectManagerId: project.projectManagerId, startDate: project.startDate, endDate: project.endDate, status: project.status });
        setProjectTasks([...project.tasks]);
        setShowProjectModal(true);
    };
    const handleCloseModal = () => {
        setShowProjectModal(false);
        setEditingProject(null);
        setProjectForm(null);
        setProjectTasks([]);
    };
    const handleFormChange = (field: keyof Omit<Project, 'id' | 'tasks'>, value: any) => {
        if (!projectForm) return;
        setProjectForm({ ...projectForm, [field]: value });
    };
    const handleSaveProject = () => {
        if (!projectForm) return;
        if (editingProject) {
            dispatch({ type: 'UPDATE_STATE', payload: { projects: projects.map(p => p.id === editingProject.id ? { ...editingProject, ...projectForm, tasks: projectTasks } : p) } });
        } else {
            const newId = `proj-${Date.now()}`;
            dispatch({ type: 'UPDATE_STATE', payload: { projects: [{ id: newId, ...projectForm, tasks: projectTasks }, ...projects] } });
        }
        handleCloseModal();
    };
    const handleDeleteProject = () => {
        if (deleteProjectId) {
            dispatch({ type: 'UPDATE_STATE', payload: { projects: projects.filter(p => p.id !== deleteProjectId) } });
            setDeleteProjectId(null);
        }
    };

    // Task CRUD handlers (within modal)
    const handleOpenTaskCreate = () => {
        setEditingTask(null);
        setTaskForm({ title: '', assignedToUserId: '', status: 'To Do', plannedStartDate: new Date(), plannedEndDate: new Date(), dependencies: [] });
        setShowTaskModal(true);
    };
    const handleOpenTaskEdit = (task: ProjectTask) => {
        setEditingTask(task);
        setTaskForm({ title: task.title, assignedToUserId: task.assignedToUserId, status: task.status, plannedStartDate: task.plannedStartDate, plannedEndDate: task.plannedEndDate, dependencies: [...task.dependencies] });
        setShowTaskModal(true);
    };
    const handleCloseTaskModal = () => {
        setShowTaskModal(false);
        setEditingTask(null);
        setTaskForm(null);
    };
    const handleTaskFormChange = (field: keyof Omit<ProjectTask, 'id'>, value: any) => {
        if (!taskForm) return;
        setTaskForm({ ...taskForm, [field]: value });
    };
    const handleSaveTask = () => {
        if (!taskForm) return;
        if (editingTask) {
            setProjectTasks(projectTasks.map(t => t.id === editingTask.id ? { ...editingTask, ...taskForm } : t));
        } else {
            setProjectTasks([{ id: `pt-${Date.now()}`, ...taskForm }, ...projectTasks]);
        }
        handleCloseTaskModal();
    };
    const handleDeleteTask = () => {
        if (deleteTaskId) {
            setProjectTasks(projectTasks.filter(t => t.id !== deleteTaskId));
            setDeleteTaskId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Active Projects" value={projectKpis.active} />
                <KpiCard title="Delayed Projects" value={projectKpis.delayed} />
                <KpiCard title="Completed Projects" value={projectKpis.completed} />
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <GanttChartIcon className="w-6 h-6" /> Project Tracker
                    </h2>
                    {canManageProjects && (
                        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                            <PlusIcon className="w-5 h-5" /> New Project
                        </button>
                    )}
                </div>
                <div className="flex gap-4 flex-wrap">
                    {projects.map(p => (
                        <div key={p.id} className="flex items-center gap-1">
                            <button onClick={() => setSelectedProject(p)}
                                className={`px-3 py-1 font-semibold rounded-md transition-colors ${selectedProject?.id === p.id ? 'bg-disa-red text-white' : 'bg-gray-500/10 hover:bg-gray-500/20'}`}>
                                {p.name}
                            </button>
                            {canManageProjects && (
                                <>
                                    <button onClick={() => handleOpenEdit(p)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Edit Project"><PencilSquareIcon className="w-4 h-4" /></button>
                                    <button onClick={() => setDeleteProjectId(p.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900" title="Delete Project"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                {selectedProject && <ProjectBoard project={selectedProject} canManage={canManageProjects} onEditTask={handleOpenTaskEdit} onDeleteTask={setDeleteTaskId} />}
            </Card>

            {/* Project Create/Edit Modal */}
            {showProjectModal && projectForm && (
                <Modal isOpen={showProjectModal} onClose={handleCloseModal} title={editingProject ? 'Edit Project' : 'Create Project'}>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-semibold mb-1">Project Name</label>
                            <input type="text" className="w-full p-2 rounded border" value={projectForm.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="Enter project name" title="Project Name" />
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Project Manager</label>
                            <select className="w-full p-2 rounded border" value={projectForm.projectManagerId} onChange={e => handleFormChange('projectManagerId', e.target.value)} title="Project Manager">
                                {users.filter(u => u.role === Role.Supervisor || u.role === Role.Manager).map(u => (
                                    <option key={u.uid} value={u.uid}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <label className="block font-semibold mb-1">Start Date</label>
                                <input type="date" className="p-2 rounded border" value={projectForm.startDate.toISOString().slice(0,10)} onChange={e => handleFormChange('startDate', new Date(e.target.value))} title="Start Date" />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">End Date</label>
                                <input type="date" className="p-2 rounded border" value={projectForm.endDate.toISOString().slice(0,10)} onChange={e => handleFormChange('endDate', new Date(e.target.value))} title="End Date" />
                            </div>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Status</label>
                            <select className="w-full p-2 rounded border" value={projectForm.status} onChange={e => handleFormChange('status', e.target.value)} title="Status">
                                <option value="Planning">Planning</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Delayed">Delayed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Tasks</label>
                            <div className="flex flex-col gap-2">
                                {projectTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded p-2">
                                        <span className="font-semibold">{task.title}</span>
                                        <span className="text-xs text-gray-500">{task.status}</span>
                                        <button onClick={() => handleOpenTaskEdit(task)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Edit Task"><PencilSquareIcon className="w-4 h-4" /></button>
                                        <button onClick={() => setDeleteTaskId(task.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900" title="Delete Task"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                                    </div>
                                ))}
                                <button onClick={handleOpenTaskCreate} className="flex items-center gap-1 px-2 py-1 text-sm font-semibold text-white bg-disa-accent-blue rounded hover:bg-blue-500 mt-2 w-fit"><PlusIcon className="w-4 h-4" /> Add Task</button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={handleCloseModal} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 font-semibold">Cancel</button>
                            <button onClick={handleSaveProject} className="px-4 py-2 rounded bg-disa-accent-blue text-white font-semibold">{editingProject ? 'Update' : 'Create'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Project Delete Modal */}
            {deleteProjectId && (
                <Modal isOpen={true} onClose={() => setDeleteProjectId(null)} title="Delete Project?">
                    <div className="space-y-4">
                        <p>Are you sure you want to delete this project? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteProjectId(null)} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 font-semibold">Cancel</button>
                            <button onClick={handleDeleteProject} className="px-4 py-2 rounded bg-red-600 text-white font-semibold">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Task Create/Edit Modal */}
            {showTaskModal && taskForm && (
                <Modal isOpen={showTaskModal} onClose={handleCloseTaskModal} title={editingTask ? 'Edit Task' : 'Add Task'}>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-semibold mb-1">Title</label>
                            <input type="text" className="w-full p-2 rounded border" value={taskForm.title} onChange={e => handleTaskFormChange('title', e.target.value)} placeholder="Task title" title="Task Title" />
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Assignee</label>
                            <select className="w-full p-2 rounded border" value={taskForm.assignedToUserId} onChange={e => handleTaskFormChange('assignedToUserId', e.target.value)} title="Assignee">
                                <option value="">Select user</option>
                                {users.map(u => (
                                    <option key={u.uid} value={u.uid}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <label className="block font-semibold mb-1">Planned Start</label>
                                <input type="date" className="p-2 rounded border" value={taskForm.plannedStartDate.toISOString().slice(0,10)} onChange={e => handleTaskFormChange('plannedStartDate', new Date(e.target.value))} title="Planned Start" />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Planned End</label>
                                <input type="date" className="p-2 rounded border" value={taskForm.plannedEndDate.toISOString().slice(0,10)} onChange={e => handleTaskFormChange('plannedEndDate', new Date(e.target.value))} title="Planned End" />
                            </div>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Status</label>
                            <select className="w-full p-2 rounded border" value={taskForm.status} onChange={e => handleTaskFormChange('status', e.target.value)} title="Status">
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Done">Done</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Dependencies</label>
                            <div className="flex flex-wrap gap-2">
                                {projectTasks.map(t => (
                                    <label key={t.id} className="flex items-center gap-1">
                                        <input type="checkbox" checked={taskForm.dependencies.includes(t.id)} onChange={() => handleTaskFormChange('dependencies', taskForm.dependencies.includes(t.id) ? taskForm.dependencies.filter(id => id !== t.id) : [...taskForm.dependencies, t.id])} />
                                        {t.title}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={handleCloseTaskModal} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 font-semibold">Cancel</button>
                            <button onClick={handleSaveTask} className="px-4 py-2 rounded bg-disa-accent-blue text-white font-semibold">{editingTask ? 'Update' : 'Add'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Task Delete Modal */}
            {deleteTaskId && (
                <Modal isOpen={true} onClose={() => setDeleteTaskId(null)} title="Delete Task?">
                    <div className="space-y-4">
                        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteTaskId(null)} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 font-semibold">Cancel</button>
                            <button onClick={handleDeleteTask} className="px-4 py-2 rounded bg-red-600 text-white font-semibold">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const KpiCard: React.FC<{title: string, value: string | number}> = ({ title, value }) => (
    <Card className="text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-4xl font-bold text-disa-red">{value}</p>
    </Card>
);

const ProjectBoard: React.FC<{ project: Project, canManage: boolean, onEditTask: (task: ProjectTask) => void, onDeleteTask: (id: string) => void }> = ({ project, canManage, onEditTask, onDeleteTask }) => {
    const columns = ['To Do', 'In Progress', 'On Hold', 'Done', 'Overdue'];
    const { users } = useUsers();
    const tasksByStatus = useMemo(() => {
        return project.tasks.reduce((acc, task) => {
            (acc[task.status] = acc[task.status] || []).push(task);
            return acc;
        }, {} as Record<string, ProjectTask[]>);
    }, [project.tasks]);

    return (
        <div className="grid grid-cols-5 gap-4 mt-6 overflow-x-auto">
            {columns.map(col => (
                <div key={col} className="p-2 rounded-lg bg-gray-200/50 dark:bg-black/20 min-w-[250px]">
                    <h3 className="font-bold text-center p-2">{col}</h3>
                    <div className="space-y-2">
                        {(tasksByStatus[col as keyof typeof tasksByStatus] || []).map(task => (
                            <div key={task.id} className="flex items-center gap-2">
                                <TaskCard task={task} users={users} />
                                {canManage && (
                                    <>
                                        <button onClick={() => onEditTask(task)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Edit Task"><PencilSquareIcon className="w-4 h-4" /></button>
                                        <button onClick={() => onDeleteTask(task.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900" title="Delete Task"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const TaskCard: React.FC<{ task: ProjectTask, users: User[] }> = ({ task, users }) => (
    <Card className="!p-3">
        <p className="font-semibold">{task.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Due: {task.plannedEndDate.toLocaleDateString()}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Assignee: {users.find(u => u.uid === task.assignedToUserId)?.name || task.assignedToUserId}</p>
    </Card>
);

export default ProjectsView;