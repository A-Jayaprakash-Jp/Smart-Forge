import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { ProductionData, Machine, SyncQueueItem, MaintenanceTask, MachineAlert, ProductionOrder, InventoryItem, MaintenanceRequest, Shift, IncidentLog, AssignedTask, BreakdownReport, SafetyWorkPermit, LayoutInspection, QualityDocument, MachineProgram, Tool, Project, PredictiveAlert, ToolUsageLog, SyncAction, ProductionLog, DowntimeEvent, QualityCheck } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useOnlineStatus } from './useOnlineStatus';
import { getInitialData, syncData } from '../services/apiService';
import { jsonDateReviver } from '../utils/helpers';
import { MOCK_ASSIGNED_TASKS } from '../constants';

type State = {
  isLoading: boolean;
  loadingMessage: string;
  data: ProductionData;
  machines: Machine[];
  shifts: Shift[];
  incidentLogs: IncidentLog[];
  maintenanceTasks: MaintenanceTask[];
  maintenanceRequests: MaintenanceRequest[];
  machineAlerts: MachineAlert[];
  productionOrders: ProductionOrder[];
  inventoryItems: InventoryItem[];
  assignedTasks: AssignedTask[];
  breakdownReports: BreakdownReport[];
  safetyPermits: SafetyWorkPermit[];
  layoutInspections: LayoutInspection[];
  qualityDocuments: QualityDocument[];
  machinePrograms: MachineProgram[];
  tools: Tool[];
  projects: Project[];
  predictiveAlerts: PredictiveAlert[];
  toolUsageLogs: ToolUsageLog[];
  syncQueue: SyncQueueItem[];
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
};

type Action =
  | { type: 'INITIAL_LOAD_START' }
  | { type: 'INITIAL_LOAD_SUCCESS'; payload: Omit<State, 'isLoading' | 'loadingMessage' | 'syncQueue' | 'syncStatus'> }
  | { type: 'INITIAL_LOAD_FAILURE' }
  | { type: 'ADD_TO_SYNC_QUEUE'; payload: { action: SyncAction, payload: any, entityId?: string } }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_SUCCESS' }
  | { type: 'SYNC_FAILURE' }
  | { type: 'SET_OFFLINE' }
  | { type: 'UPDATE_STATE'; payload: Partial<State> };


const initialState: State = {
  isLoading: true,
  loadingMessage: 'Initializing Application...',
  data: { logs: [], downtime: [] },
  machines: [],
  shifts: [],
  incidentLogs: [],
  maintenanceTasks: [],
  maintenanceRequests: [],
  machineAlerts: [],
  productionOrders: [],
  inventoryItems: [],
  assignedTasks: [],
  breakdownReports: [],
  safetyPermits: [],
  layoutInspections: [],
  qualityDocuments: [],
  machinePrograms: [],
  tools: [],
  projects: [],
  predictiveAlerts: [],
  toolUsageLogs: [],
  syncQueue: [],
  syncStatus: 'synced',
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INITIAL_LOAD_START':
      return { ...state, isLoading: true, loadingMessage: 'Loading operational data...' };
    case 'INITIAL_LOAD_SUCCESS':
      return { ...state, ...action.payload, isLoading: false, loadingMessage: 'Application ready.' };
    case 'INITIAL_LOAD_FAILURE':
      return { ...state, isLoading: false, loadingMessage: 'Failed to load data.' };
    case 'ADD_TO_SYNC_QUEUE':
      const newSyncItem: SyncQueueItem = { id: uuidv4(), ...action.payload, timestamp: Date.now() };
      return { ...state, syncQueue: [...state.syncQueue, newSyncItem] };
    case 'SYNC_START':
      return { ...state, syncStatus: 'syncing' };
    case 'SYNC_SUCCESS':
      return { ...state, syncQueue: [], syncStatus: 'synced' };
    case 'SYNC_FAILURE':
      return { ...state, syncStatus: 'error' };
    case 'SET_OFFLINE':
      return { ...state, syncStatus: 'offline' };
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

// Define the shape of the context value
interface DataContextType extends State {
    dispatch: React.Dispatch<Action>;
    addProductionLog: (logData: Omit<ProductionLog, 'id' | 'timestamp'>) => void;
    addMultipleProductionLogs: (logs: Partial<ProductionLog>[]) => void;
    startDowntime: (downtimeData: Omit<DowntimeEvent, 'id' | 'start'>) => void;
    endDowntime: (machineId: string) => void;
    getDowntimeData: (machineId: string) => DowntimeEvent[];
    getMachineData: (machineId: string) => ProductionLog[];
    addIncidentLog: (incidentData: Omit<IncidentLog, 'id' | 'timestamp'>) => void;
    addMaintenanceRequest: (requestData: Omit<MaintenanceRequest, 'id'|'reportedDate'|'status'>) => void;
    toggleAssignedTask: (taskId: string) => void;
    acknowledgeAlert: (alertId: string) => void;
    addAssignedTask: (taskData: Omit<AssignedTask, 'id' | 'isCompleted' | 'assignedAt'>) => void;
    addProductionOrder: (orderData: Omit<ProductionOrder, 'id' | 'status'>) => void;
    updateProductionOrderStatus: (orderId: string, status: ProductionOrder['status']) => void;
    updateMachineStatus: (machineId: string, status: Machine['status']) => void;
    addInventoryItem: (itemData: Omit<InventoryItem, 'id'>) => void;
    updateInventoryItem: (itemData: InventoryItem) => void;
    removeInventoryItem: (itemId: string) => void;
    orderInventoryItem: (itemId: string, quantity: number) => void;
    addBreakdownReport: (reportData: Omit<BreakdownReport, 'id' | 'reportTimestamp' | 'status'>) => void;
    addSafetyPermit: (permitData: Omit<SafetyWorkPermit, 'id' | 'status' | 'issueTimestamp'>) => void;
    addMaintenanceTask: (taskData: Omit<MaintenanceTask, 'id' | 'lastCompleted' | 'nextDue' | 'status'>) => void;
    updateMaintenanceTask: (taskData: MaintenanceTask) => void;
    completeMaintenanceTask: (taskId: string, notes: string, userId: string) => void;
    acknowledgePredictiveAlert: (alertId: string, userId: string) => void;
    updateProductionOrderQualityCheck: (orderId: string, checkName: QualityCheck['name'], status: QualityCheck['status']) => void;
    approveProductionLog: (logId: string, reviewerId: string) => void;
    rejectProductionLog: (logId: string, reviewerId: string, notes: string) => void;
    updateProductionLog: (log: ProductionLog) => void;
    issueTool: (toolId: string, issuedToUserId: string, issuedByUserId: string, machineId: string) => void;
    returnTool: (toolId: string) => void;
    resolveIncident: (incidentId: string, resolution: string, resolvedByUserId: string) => void;
}


const DataContext = React.createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'disa-app-state';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'INITIAL_LOAD_START' });
      
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState, jsonDateReviver);
          dispatch({ type: 'INITIAL_LOAD_SUCCESS', payload: parsed });
          return;
        }
      } catch (error) {
        console.error("Failed to load state from localStorage", error);
      }

      try {
        const apiData = await getInitialData();
        dispatch({ type: 'INITIAL_LOAD_SUCCESS', payload: {
          data: apiData.productionData,
          machines: apiData.machines,
          shifts: apiData.shifts,
          incidentLogs: apiData.incidentLogs,
          maintenanceTasks: apiData.maintenanceTasks,
          maintenanceRequests: apiData.maintenanceRequests,
          machineAlerts: apiData.machineAlerts,
          productionOrders: apiData.productionOrders,
          inventoryItems: apiData.inventoryItems,
          assignedTasks: MOCK_ASSIGNED_TASKS,
          breakdownReports: apiData.breakdownReports,
          safetyPermits: apiData.safetyPermits,
          layoutInspections: apiData.layoutInspections,
          qualityDocuments: apiData.qualityDocuments,
          machinePrograms: apiData.machinePrograms,
          tools: apiData.tools,
          projects: apiData.projects,
          predictiveAlerts: apiData.predictiveAlerts,
          toolUsageLogs: apiData.toolUsageLogs,
        } });
      } catch (error) {
        console.error("Fatal: Could not load initial data from API.", error);
        dispatch({ type: 'INITIAL_LOAD_FAILURE' });
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      const stateToSave = { ...state, isLoading: undefined, loadingMessage: undefined, syncStatus: undefined };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [state]);

  useEffect(() => {
    if (isOnline && state.syncQueue.length > 0 && state.syncStatus !== 'syncing') {
      dispatch({ type: 'SYNC_START' });
      syncData(state.syncQueue).then(result => {
        if (result.success) {
          dispatch({ type: 'SYNC_SUCCESS' });
        } else {
          dispatch({ type: 'SYNC_FAILURE' });
        }
      });
    } else if (!isOnline) {
      dispatch({ type: 'SET_OFFLINE' });
    }
  }, [isOnline, state.syncQueue, state.syncStatus]);

  // --- Action Functions ---
  const genericUpdater = useCallback((key: keyof State, data: any, action: SyncAction, entityId?: string) => {
    dispatch({ type: 'UPDATE_STATE', payload: { [key]: data } });
    if(action) {
      dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: { action, payload: data, entityId } });
    }
  }, []);

  const addProductionLog = useCallback((logData: Omit<ProductionLog, 'id' | 'timestamp'>) => {
      const newLog: ProductionLog = { ...logData, id: uuidv4(), timestamp: new Date() };
      dispatch({ type: 'UPDATE_STATE', payload: { data: { ...state.data, logs: [newLog, ...state.data.logs] } } });
      dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: { action: 'ADD_PRODUCTION_LOG', payload: newLog, entityId: newLog.id } });
  }, [state.data]);

  const addMultipleProductionLogs = useCallback((logs: Partial<ProductionLog>[]) => {
      const newLogs: ProductionLog[] = logs.map(log => ({
          ...log,
          id: uuidv4(),
          timestamp: new Date(),
          status: 'Pending',
      } as ProductionLog));
      dispatch({ type: 'UPDATE_STATE', payload: { data: { ...state.data, logs: [...newLogs, ...state.data.logs] } } });
      dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: { action: 'ADD_MULTIPLE_PRODUCTION_LOGS', payload: newLogs } });
  }, [state.data.logs]);
  
  const startDowntime = useCallback((downtimeData: Omit<DowntimeEvent, 'id'|'start'>) => {
      const newEvent: DowntimeEvent = { ...downtimeData, id: uuidv4(), start: new Date() };
      dispatch({ type: 'UPDATE_STATE', payload: { data: { ...state.data, downtime: [newEvent, ...state.data.downtime] } } });
      dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: { action: 'START_DOWNTIME', payload: newEvent, entityId: newEvent.id } });
  }, [state.data]);

  const endDowntime = useCallback((machineId: string) => {
      let eventToEnd: DowntimeEvent | undefined;
      const updatedDowntime = state.data.downtime.map(dt => {
          if (dt.machineId === machineId && !dt.end) {
              eventToEnd = { ...dt, end: new Date() };
              return eventToEnd;
          }
          return dt;
      });
      if (eventToEnd) {
        dispatch({ type: 'UPDATE_STATE', payload: { data: { ...state.data, downtime: updatedDowntime } } });
        dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: { action: 'END_DOWNTIME', payload: eventToEnd, entityId: eventToEnd.id } });
      }
  }, [state.data]);

  const addIncidentLog = useCallback((incidentData: Omit<IncidentLog, 'id' | 'timestamp'>) => {
      const newIncident: IncidentLog = { ...incidentData, id: uuidv4(), timestamp: new Date() };
      genericUpdater('incidentLogs', [newIncident, ...state.incidentLogs], 'ADD_INCIDENT_LOG', newIncident.id);
  }, [state.incidentLogs, genericUpdater]);

  const addMaintenanceRequest = useCallback((requestData: Omit<MaintenanceRequest, 'id'|'reportedDate'|'status'>) => {
      const newRequest: MaintenanceRequest = { ...requestData, id: uuidv4(), reportedDate: new Date(), status: 'Open' };
      genericUpdater('maintenanceRequests', [newRequest, ...state.maintenanceRequests], 'ADD_MAINTENANCE_REQUEST', newRequest.id);
  }, [state.maintenanceRequests, genericUpdater]);
  
  const toggleAssignedTask = useCallback((taskId: string) => {
      const updatedTasks = state.assignedTasks.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date() : undefined } : t);
      genericUpdater('assignedTasks', updatedTasks, 'UPDATE_ASSIGNED_TASK_STATUS', taskId);
  }, [state.assignedTasks, genericUpdater]);
  
  const acknowledgeAlert = useCallback((alertId: string) => {
      const updatedAlerts = state.machineAlerts.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a);
      genericUpdater('machineAlerts', updatedAlerts, 'ACKNOWLEDGE_ALERT', alertId);
  }, [state.machineAlerts, genericUpdater]);

  const addAssignedTask = useCallback((taskData: Omit<AssignedTask, 'id'|'isCompleted'|'assignedAt'>) => {
      const newTask: AssignedTask = { ...taskData, id: uuidv4(), isCompleted: false, assignedAt: new Date() };
      genericUpdater('assignedTasks', [newTask, ...state.assignedTasks], 'ADD_ASSIGNED_TASK', newTask.id);
  }, [state.assignedTasks, genericUpdater]);

  // Implement other functions similarly...
  const getDowntimeData = useCallback((machineId: string) => state.data.downtime.filter(d => d.machineId === machineId), [state.data.downtime]);
  const getMachineData = useCallback((machineId: string) => state.data.logs.filter(l => l.machineId === machineId), [state.data.logs]);
  
  const approveProductionLog = useCallback((logId: string, reviewerId: string) => {
    const logs = state.data.logs.map(l => l.id === logId ? {...l, status: 'Approved' as const, reviewedByUserId: reviewerId, reviewTimestamp: new Date()} : l);
    dispatch({type: 'UPDATE_STATE', payload: { data: {...state.data, logs} }});
    dispatch({type: 'ADD_TO_SYNC_QUEUE', payload: {action: 'APPROVE_PRODUCTION_LOG', payload: { logId, reviewerId }, entityId: logId }});
  }, [state.data]);

  const rejectProductionLog = useCallback((logId: string, reviewerId: string, notes: string) => {
    const logs = state.data.logs.map(l => l.id === logId ? {...l, status: 'Rejected' as const, reviewedByUserId: reviewerId, reviewTimestamp: new Date(), rejectionNotes: notes} : l);
    dispatch({type: 'UPDATE_STATE', payload: { data: {...state.data, logs} }});
    dispatch({type: 'ADD_TO_SYNC_QUEUE', payload: {action: 'REJECT_PRODUCTION_LOG', payload: { logId, reviewerId, notes }, entityId: logId }});
  }, [state.data]);

  const updateProductionLog = useCallback((log: ProductionLog) => {
    const logs = state.data.logs.map(l => l.id === log.id ? log : l);
    dispatch({type: 'UPDATE_STATE', payload: { data: {...state.data, logs} }});
    dispatch({type: 'ADD_TO_SYNC_QUEUE', payload: {action: 'UPDATE_PRODUCTION_LOG', payload: log, entityId: log.id }});
  }, [state.data]);
  
  // Placeholder implementations for the rest
  const addProductionOrder = useCallback((orderData: Omit<ProductionOrder, 'id' | 'status'>) => {
    const newOrder: ProductionOrder = { ...orderData, id: `PO-${Date.now()}`, status: 'Pending' };
    genericUpdater('productionOrders', [newOrder, ...state.productionOrders], 'ADD_PRODUCTION_ORDER', newOrder.id);
  }, [state.productionOrders, genericUpdater]);
  
  const updateProductionOrderStatus = useCallback((orderId: string, status: ProductionOrder['status']) => {
    const updatedOrders = state.productionOrders.map(o => o.id === orderId ? { ...o, status } : o);
    genericUpdater('productionOrders', updatedOrders, 'UPDATE_PRODUCTION_ORDER_STATUS', orderId);
  }, [state.productionOrders, genericUpdater]);
  
  const updateMachineStatus = useCallback((machineId: string, status: Machine['status']) => {
    const updatedMachines = state.machines.map(m => m.id === machineId ? { ...m, status } : m);
    genericUpdater('machines', updatedMachines, 'UPDATE_MACHINE_STATUS', machineId);
  }, [state.machines, genericUpdater]);
  
  const addInventoryItem = useCallback((itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { ...itemData, id: uuidv4() };
    genericUpdater('inventoryItems', [newItem, ...state.inventoryItems], 'ADD_INVENTORY_ITEM', newItem.id);
  }, [state.inventoryItems, genericUpdater]);

  const updateInventoryItem = useCallback((itemData: InventoryItem) => {
    const updatedItems = state.inventoryItems.map(i => i.id === itemData.id ? itemData : i);
    genericUpdater('inventoryItems', updatedItems, 'UPDATE_INVENTORY_ITEM', itemData.id);
  }, [state.inventoryItems, genericUpdater]);

  const removeInventoryItem = useCallback((itemId: string) => {
    const updatedItems = state.inventoryItems.filter(i => i.id !== itemId);
    genericUpdater('inventoryItems', updatedItems, 'REMOVE_INVENTORY_ITEM', itemId);
  }, [state.inventoryItems, genericUpdater]);

  const orderInventoryItem = useCallback((itemId: string, quantity: number) => {
    // This would likely just be a sync queue action in a real app
    dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: { action: 'ORDER_INVENTORY_ITEM', payload: { itemId, quantity }, entityId: itemId } });
  }, []);
  
  const addBreakdownReport = useCallback((reportData: Omit<BreakdownReport, 'id' | 'reportTimestamp' | 'status'>) => {
    const newReport: BreakdownReport = { ...reportData, id: uuidv4(), reportTimestamp: new Date(), status: 'Open' };
    genericUpdater('breakdownReports', [newReport, ...state.breakdownReports], 'ADD_BREAKDOWN_REPORT', newReport.id);
  }, [state.breakdownReports, genericUpdater]);

  const addSafetyPermit = useCallback((permitData: Omit<SafetyWorkPermit, 'id' | 'status' | 'issueTimestamp'>) => {
    const newPermit: SafetyWorkPermit = { ...permitData, id: uuidv4(), status: 'Active', issueTimestamp: new Date() };
    genericUpdater('safetyPermits', [newPermit, ...state.safetyPermits], 'ADD_SAFETY_PERMIT', newPermit.id);
  }, [state.safetyPermits, genericUpdater]);
  
  const addMaintenanceTask = useCallback((taskData: Omit<MaintenanceTask, 'id' | 'lastCompleted' | 'nextDue' | 'status'>) => {
      const newTask: MaintenanceTask = { ...taskData, id: uuidv4(), lastCompleted: new Date(), nextDue: new Date(), status: 'Upcoming' };
      // complex logic to calculate nextDue would go here
      genericUpdater('maintenanceTasks', [newTask, ...state.maintenanceTasks], 'ADD_MAINTENANCE_TASK', newTask.id);
  }, [state.maintenanceTasks, genericUpdater]);

  const updateMaintenanceTask = useCallback((taskData: MaintenanceTask) => {
      const updatedTasks = state.maintenanceTasks.map(t => t.id === taskData.id ? taskData : t);
      genericUpdater('maintenanceTasks', updatedTasks, 'UPDATE_MAINTENANCE_TASK', taskData.id);
  }, [state.maintenanceTasks, genericUpdater]);
  
  const completeMaintenanceTask = useCallback((taskId: string, notes: string, userId: string) => {
      const updatedTasks = state.maintenanceTasks.map(t => t.id === taskId ? { ...t, status: 'Completed' as const, completionNotes: notes, completedByUserId: userId, lastCompleted: new Date() } : t);
      genericUpdater('maintenanceTasks', updatedTasks, 'COMPLETE_MAINTENANCE_TASK', taskId);
  }, [state.maintenanceTasks, genericUpdater]);

  const acknowledgePredictiveAlert = useCallback((alertId: string, userId: string) => {
      const updatedAlerts = state.predictiveAlerts.map(a => a.id === alertId ? { ...a, status: 'Acknowledged' as const, acknowledgedByUserId: userId, acknowledgedAt: new Date() } : a);
      genericUpdater('predictiveAlerts', updatedAlerts, 'ACKNOWLEDGE_PREDICTIVE_ALERT', alertId);
  }, [state.predictiveAlerts, genericUpdater]);

  const updateProductionOrderQualityCheck = useCallback((orderId: string, checkName: QualityCheck['name'], status: QualityCheck['status']) => {
    const updatedOrders = state.productionOrders.map(o => {
      if (o.id === orderId) {
        const updatedChecks = o.qualityChecks?.map(qc => qc.name === checkName ? { ...qc, status } : qc) || [];
        return { ...o, qualityChecks: updatedChecks };
      }
      return o;
    });
    genericUpdater('productionOrders', updatedOrders, 'UPDATE_QUALITY_CHECK', orderId);
  }, [state.productionOrders, genericUpdater]);

  const issueTool = useCallback((toolId: string, issuedToUserId: string, issuedByUserId: string, machineId: string) => {
    const newLog: ToolUsageLog = { id: uuidv4(), toolId, issuedToUserId, issuedByUserId, issueTimestamp: new Date(), machineId };
    const updatedTools = state.tools.map(t => t.id === toolId ? {...t, status: 'In Use' as const, location: `In Use - ${machineId}`} : t);
    dispatch({type: 'UPDATE_STATE', payload: { tools: updatedTools, toolUsageLogs: [newLog, ...state.toolUsageLogs] }});
    dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: { action: 'ADD_TOOL_USAGE_LOG', payload: newLog, entityId: toolId } });
  }, [state.tools, state.toolUsageLogs]);

  const returnTool = useCallback((toolId: string) => {
    const updatedLogs = state.toolUsageLogs.map(l => (l.toolId === toolId && !l.returnTimestamp) ? {...l, returnTimestamp: new Date()} : l);
    const updatedTools = state.tools.map(t => t.id === toolId ? {...t, status: 'Available' as const, location: 'Tool Crib'} : t);
     dispatch({type: 'UPDATE_STATE', payload: { tools: updatedTools, toolUsageLogs: updatedLogs }});
     dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: { action: 'UPDATE_TOOL_STATUS', payload: { toolId, status: 'Available' }, entityId: toolId } });
  }, [state.tools, state.toolUsageLogs]);

  const resolveIncident = useCallback((incidentId: string, resolution: string, resolvedByUserId: string) => {
    const updatedIncidents = state.incidentLogs.map(i => i.id === incidentId ? { ...i, resolution, resolvedByUserId, resolvedAt: new Date() } : i);
    genericUpdater('incidentLogs', updatedIncidents, 'RESOLVE_INCIDENT', incidentId);
  }, [state.incidentLogs, genericUpdater]);


  const contextValue = useMemo(() => ({
    ...state,
    dispatch,
    addProductionLog,
    addMultipleProductionLogs,
    startDowntime,
    endDowntime,
    getDowntimeData,
    getMachineData,
    addIncidentLog,
    addMaintenanceRequest,
    toggleAssignedTask,
    acknowledgeAlert,
    addAssignedTask,
    addProductionOrder,
    updateProductionOrderStatus,
    updateMachineStatus,
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem,
    orderInventoryItem,
    addBreakdownReport,
    addSafetyPermit,
    addMaintenanceTask,
    updateMaintenanceTask,
    completeMaintenanceTask,
    acknowledgePredictiveAlert,
    updateProductionOrderQualityCheck,
    approveProductionLog,
    rejectProductionLog,
    updateProductionLog,
    issueTool,
    returnTool,
    resolveIncident,
  }), [state, addProductionLog, addMultipleProductionLogs, startDowntime, endDowntime, getDowntimeData, getMachineData, addIncidentLog, addMaintenanceRequest, toggleAssignedTask, acknowledgeAlert, addAssignedTask, addProductionOrder, updateProductionOrderStatus, updateMachineStatus, addInventoryItem, updateInventoryItem, removeInventoryItem, orderInventoryItem, addBreakdownReport, addSafetyPermit, addMaintenanceTask, updateMaintenanceTask, completeMaintenanceTask, acknowledgePredictiveAlert, updateProductionOrderQualityCheck, approveProductionLog, rejectProductionLog, updateProductionLog, issueTool, returnTool, resolveIncident]);


  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useProductionData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useProductionData must be used within a DataProvider');
  }
  return context;
};
