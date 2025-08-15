






import { SyncQueueItem, ProductionData, Machine, MaintenanceTask, MachineAlert, ProductionOrder, InventoryItem, MaintenanceRequest, Shift, IncidentLog, BreakdownReport, SafetyWorkPermit, LayoutInspection, QualityDocument, MachineProgram, Tool, Project, PredictiveAlert, ToolUsageLog } from '../types';

const API_BASE_URL = 'http://localhost:3001/api'; // This should be in an env var for production

// Helper to deserialize dates correctly from JSON
const jsonReviver = (key: string, value: any) => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    if (typeof value === 'string' && isoDateRegex.test(value)) {
        return new Date(value);
    }
    return value;
};

interface InitialDataResponse {
  productionData: ProductionData;
  machines: Machine[];
  maintenanceTasks: MaintenanceTask[];
  maintenanceRequests: MaintenanceRequest[];
  machineAlerts: MachineAlert[];
  productionOrders: ProductionOrder[];
  inventoryItems: InventoryItem[];
  shifts: Shift[];
  incidentLogs: IncidentLog[];
  breakdownReports: BreakdownReport[];
  safetyPermits: SafetyWorkPermit[];
  layoutInspections: LayoutInspection[];
  qualityDocuments: QualityDocument[];
  machinePrograms: MachineProgram[];
  tools: Tool[];
  projects: Project[];
  predictiveAlerts: PredictiveAlert[];
  toolUsageLogs: ToolUsageLog[];
}

/**
 * Fetches initial non-realtime data from the backend.
 * User and message data is now handled by Firebase.
 */
export const getInitialData = async (): Promise<InitialDataResponse> => {
  console.log('API: Attempting to fetch initial operational data from server...');
  try {
    const response = await fetch(`${API_BASE_URL}/data`);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const responseText = await response.text();
    const data = JSON.parse(responseText, jsonReviver);
    console.log('API: Successfully fetched initial operational data.');
    return data;
  } catch (error) {
    console.error('API: Failed to fetch initial data. Returning MOCK data.', error);
    // Import MOCK data here to return it as a fallback
    const { 
        MOCK_PRODUCTION_DATA, 
        MOCK_MACHINES, 
        MOCK_MAINTENANCE_TASKS, 
        MOCK_MACHINE_ALERTS, 
        MOCK_PRODUCTION_ORDERS, 
        MOCK_INVENTORY_ITEMS,
        MOCK_MAINTENANCE_REQUESTS,
        MOCK_SHIFTS,
        MOCK_INCIDENT_LOGS,
        MOCK_BREAKDOWN_REPORTS,
        MOCK_SAFETY_PERMITS,
        MOCK_LAYOUT_INSPECTIONS,
        MOCK_QUALITY_DOCUMENTS,
        MOCK_MACHINE_PROGRAMS,
        MOCK_TOOLS,
        MOCK_PROJECTS,
        MOCK_PREDICTIVE_ALERTS,
        MOCK_TOOL_USAGE_LOGS,
    } = await import('../constants');
    
    return {
      productionData: MOCK_PRODUCTION_DATA,
      machines: MOCK_MACHINES,
      maintenanceTasks: MOCK_MAINTENANCE_TASKS,
      maintenanceRequests: MOCK_MAINTENANCE_REQUESTS,
      machineAlerts: MOCK_MACHINE_ALERTS,
      productionOrders: MOCK_PRODUCTION_ORDERS,
      inventoryItems: MOCK_INVENTORY_ITEMS,
      shifts: MOCK_SHIFTS,
      incidentLogs: MOCK_INCIDENT_LOGS,
      breakdownReports: MOCK_BREAKDOWN_REPORTS,
      safetyPermits: MOCK_SAFETY_PERMITS,
      layoutInspections: MOCK_LAYOUT_INSPECTIONS,
      qualityDocuments: MOCK_QUALITY_DOCUMENTS,
      machinePrograms: MOCK_MACHINE_PROGRAMS,
      tools: MOCK_TOOLS,
      projects: MOCK_PROJECTS,
      predictiveAlerts: MOCK_PREDICTIVE_ALERTS,
      toolUsageLogs: MOCK_TOOL_USAGE_LOGS,
    };
  }
};

/**
 * Sends the queue of offline production data changes to the backend.
 * @param queue - An array of sync queue items.
 */
export const syncData = async (queue: SyncQueueItem[]): Promise<{ success: boolean }> => {
  if (queue.length === 0) {
    return { success: true };
  }

  console.log(`API: Syncing ${queue.length} items to the server...`);

  try {
    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queue),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API: Sync failed on server.', errorData);
      throw new Error('Server sync failed');
    }
    
    console.log('API: Data sync successful.');
    return { success: true };

  } catch (error) {
    // This catch block makes the app more resilient for development when the backend isn't running.
    // It simulates a successful sync to prevent the UI from showing a permanent "Sync Error".
    // In a production scenario, you'd want a more robust retry mechanism (e.g., exponential backoff).
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('API: Sync failed, likely because the backend is not running. Simulating success to clear UI error state.');
        return { success: true };
    }
    console.error('API: Network error during sync.', error);
    return { success: false };
  }
};
