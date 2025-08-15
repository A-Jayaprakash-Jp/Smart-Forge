import { useMemo } from 'react';
import { User, Role } from '../types';
import { ADMIN_EMAIL } from '../constants';

export const usePermissions = (user: User | null) => {
    const permissions = useMemo(() => {
        if (!user) {
            return {
                isAdmin: false,
                isManager: false,
                isSupervisor: false,
                isOperator: false,
                isQualityEngineer: false,
                isSafetyOfficer: false,
                isToolRoomOperator: false,
                canViewAdminPanel: false,
                canValidateData: false,
                canManageTeam: false,
                canViewFullAnalytics: false,
                canManageProjects: false,
                canAccessInnovationHub: false,
                canManageAllMaintenance: false,
                canAccessCoreSupervisorFeatures: false,
            };
        }

        const isAdmin = user.role === Role.Admin;
        const isManager = user.role === Role.Manager;
        const isSupervisor = user.role === Role.Supervisor;
        const isOperator = user.role === Role.Operator;
        const isQualityEngineer = user.role === Role.QualityEngineer;
        const isSafetyOfficer = user.role === Role.SafetyOfficer;
        const isToolRoomOperator = user.role === Role.ToolRoomOperator;

        // Only managers and supervisors get supervisor features, not admin
        const canAccessCoreSupervisorFeatures = isSupervisor || isManager;

        return {
            // General Roles
            isAdmin,
            isManager,
            isSupervisor,
            isOperator,
            isQualityEngineer,
            isSafetyOfficer,
            isToolRoomOperator,

            // Specific Actions / View Groups
            canViewAdminPanel: isAdmin,
            canValidateData: canAccessCoreSupervisorFeatures,
            canManageTeam: canAccessCoreSupervisorFeatures,
            canViewFullAnalytics: isManager,
            canManageProjects: canAccessCoreSupervisorFeatures,
            canAccessInnovationHub: isManager,
            canManageAllMaintenance: canAccessCoreSupervisorFeatures,
            canAccessCoreSupervisorFeatures,
        };
    }, [user]);

    return permissions;
};