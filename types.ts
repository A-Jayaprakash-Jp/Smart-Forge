// Feature Set: Team Management
export interface Team {
  id: string;
  name: string;
  supervisorId: string; // User.uid of supervisor
  operatorIds: string[]; // User.uid[]
  projectIds: string[]; // Project.id[]
}
export enum Role {
  Admin = 'Admin',
  Operator = 'Operator',
  Supervisor = 'Supervisor',
  Manager = 'Manager',
  QualityEngineer = 'Quality Engineer',
  SafetyOfficer = 'Safety Officer',
  ToolRoomOperator = 'Tool Room Operator',
}

export type Theme = 'light' | 'dark';

export type FontPreference = 'Inter' | 'Roboto Mono' | 'Lato' | 'Oswald' | 'Source Code Pro' | 'Nunito' | 'Montserrat' | 'Poppins' | 'Open Sans' | 'Raleway';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  desktop: boolean;
  sms: boolean;
}

export interface TrainingRecord {
    id: string;
    name: string;
    completedDate: Date;
    expiresDate?: Date;
}

export interface Shift {
    id: string;
    name: 'Morning' | 'Evening' | 'Night';
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
}

export interface User {
  uid: string; // Firebase Auth User ID
  employeeId: string;
  name:string;
  email: string; // Firebase Auth uses email
  password?: string;
  role: Role;
  assignedMachineId?: string;
  profilePicUrl?: string; // base64 string or URL
  fontPreference?: FontPreference;
  fontSize?: number; // in pixels
  biodata?: string;
  isOnline?: boolean;
  notificationPreferences?: NotificationPreferences;
  shiftId?: string;
  trainingRecords?: TrainingRecord[];
}

export interface OperatingParameters {
    mouldingPressure: { min: number; ideal: number; max: number; critical_max: number };
    sandTemperature: { min: number; ideal: number; max: number; critical_max: number };
    cycleTimeVariancePercent: { max: number; critical_max: number };
}

export interface LiveData {
    mouldingPressure: number;
    sandTemperature: number;
    cycleTimeVariancePercent: number;
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  status: 'Running' | 'Idle' | 'Down';
  idealCycleTime: number; // seconds
  location: string;
  mouldsPerHour: number;
  energyConsumptionKwh: number; // average per hour
  // New for live monitoring
  operatingParameters: OperatingParameters;
  liveData: LiveData;
}

export interface ProductionLog {
  id: string;
  machineId: string;
  userId: string; // Corresponds to User.uid
  shiftId: string;
  timestamp: Date;
  goodMoulds: number;
  rejectedMoulds: number;
  batchNumber?: string;
  jobOrderNumber?: string;
  partId?: string;
  rejectionReason?: string[];
  mouldTemperature?: number;
  sandMixId?: string;
  defectPhotoUrl?: string; // base64 string
  cost?: number;
  // New detailed fields
  mouldType: 'Green Sand Vertical' | 'Horizontal Flaskless';
  mouldSize?: string;
  actualCycleTime: number; // seconds
  energyConsumedKwh: number;
  notes?: string;
  material?: 'Iron' | 'Steel' | 'Brass' | 'Aluminum';
  // New for validation workflow
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedByUserId?: string;
  reviewTimestamp?: Date;
  rejectionNotes?: string;
  editedBySupervisor?: boolean;
  // New for detailed historical analysis
  mouldingPressure?: number;
  sandTemperature?: number;
}

export interface Anomaly {
    id: string;
    machineId: string;
    machineName: string;
    parameter: string;
    value: number;
    expected: string;
    severity: 'Warning' | 'Critical';
    timestamp: Date;
}

export interface DowntimeEvent {
  id: string;
  machineId: string;
  userId: string; // Corresponds to User.uid
  start: Date;
  end?: Date;
  reason: string;
  notes?: string;
}

export interface ProductionData {
  logs: ProductionLog[];
  downtime: DowntimeEvent[];
}

// Extended for new Maintenance View (Screenshot 1)
export interface MaintenanceRequest {
    id: string;
    title: string;
    machineId: string;
    description: string;
    status: 'Open' | 'In Progress' | 'Completed';
    type: 'Corrective' | 'Preventive';
    priority: 'Low' | 'Medium' | 'Critical';
    reportedDate: Date;
    estimatedDurationHours: number;
    estimatedCost: number;
    partsRequired: { id: string; name: string; quantity: number, cost: number }[];
}

export interface MaintenanceTask {
    id: string;
    machineId: string;
    description: string;
    scheduleType: 'calendar' | 'runtime';
    interval: number; // in days or hours
    assignedToUserId?: string;
    lastCompleted: Date;
    nextDue: Date;
    status: 'Upcoming' | 'Due' | 'Overdue' | 'Completed';
    completedByUserId?: string;
    completionNotes?: string;
}

// New type for supervisor-assigned tasks
export interface AssignedTask {
    id: string;
    assignedToUserId: string;
    assignedByUserId: string;
    title: string;
    description: string;
    isCompleted: boolean;
    assignedAt: Date;
    completedAt?: Date;
}


export interface MachineAlert {
    id: string;
    machineId: string;
    timestamp: Date;
    code: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High';
    isAcknowledged: boolean;
}

export interface IncidentLog {
    id: string;
    machineId: string;
    reportedByUserId: string;
    timestamp: Date;
    description: string;
    severity: 'Low' | 'Medium' | 'High';
    resolution?: string;
    resolvedByUserId?: string;
    resolvedAt?: Date;
    rootCause?: string;
    rootCauseAnalysis?: {
        causes: string[];
        aiConfidence: number;
    };
    attachments?: FileAttachment[];
}

// New for Production Orders View (Screenshot 6)
export interface QualityCheck {
    name: 'dimensional_check' | 'surface_finish' | 'pressure_test';
    status: 'pending' | 'passed' | 'failed';
}

export interface ProductionOrder {
    id: string; // e.g., PO-2024-001
    status: 'Pending' | 'In Progress' | 'Paused' | 'Completed';
    priority: 'low' | 'medium' | 'high';
    customer: string;
    partNumber: string;
    partDescription: string;
    quantity: {
        produced: number;
        target: number;
    };
    dueDate: Date;
    qualityChecks?: QualityCheck[];
}

// New for Inventory View (Screenshot 3)
export interface InventoryItem {
    id: string;
    name: string;
    category: 'Raw Materials' | 'Molding Materials' | 'Chemicals' | 'Tools' | 'Castings';
    stockLevel: number;
    unit: 'kg' | 'L' | 'pcs';
    minStock: number;
    maxStock: number;
    stockStatus: 'adequate' | 'low' | 'critical';
    location: string;
    unitCost: number;
    supplier: string;
    lastRestocked: Date;
}

// RENAME DirectMessage to ChatMessage and add group capabilities
export type MessageType = 'text' | 'image' | 'file';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface FileAttachment {
    name: string;
    type: string; // MIME type
    size: number;
    data: string; // base64 encoded or download URL
}

export interface ChatMessage {
    id: string;
    chatId: string; // Can be a user's UID (for DMs) or a group ID
    fromUserId: string; // Corresponds to User.uid
    timestamp: Date;
    status: MessageStatus;
    type: MessageType;
    text?: string;
    attachment?: FileAttachment;
    replyToMessageId?: string;
    isDeleted?: boolean;
    forwardedFrom?: { name: string };
    // These fields distinguish between DM and Group messages
    isGroupMessage: boolean;
    toUserId?: string; // Only for DMs
}

// New type for Group Chats
export interface ChatGroup {
    id: string;
    name: string;
    supervisorId: string; // User who created the group
    memberIds: string[];
    lastMessageTimestamp?: Date;
    avatarUrl?: string; // Optional group avatar
}


export interface OeeData {
    availability: number;
    performance: number;
    quality: number;
    oee: number;
}

export interface AiAssistantMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppSettings {
  appName: string;
  appLogo: string | null;
}

// Types for WebRTC
export type CallType = 'video' | 'audio';

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connected' | 'error';

export interface CallState {
    user: User;
    type: CallType;
}

export interface SignalingMessage {
    type: 'login' | 'offer' | 'answer' | 'candidate' | 'leave' | 'decline';
    payload?: any;
    targetUserId?: string;
}

// Types for Offline Sync (Production Data Only)
export type SyncAction = 'ADD_PRODUCTION_LOG' | 'START_DOWNTIME' | 'END_DOWNTIME' | 
'SEND_MESSAGE' | 'DELETE_MESSAGE' | 
'COMPLETE_MAINTENANCE_TASK' | 'ACKNOWLEDGE_ALERT' | 
'UPDATE_QUALITY_CHECK' | 'ADD_MAINTENANCE_REQUEST' |
'UPDATE_PRODUCTION_ORDER_STATUS' | 'ADD_PRODUCTION_ORDER' | 'UPDATE_MACHINE_STATUS' |
'ADD_INVENTORY_ITEM' | 'UPDATE_INVENTORY_ITEM' | 'REMOVE_INVENTORY_ITEM' | 'ORDER_INVENTORY_ITEM' |
'ADD_INCIDENT_LOG' | 'APPROVE_PRODUCTION_LOG' | 'REJECT_PRODUCTION_LOG' | 'UPDATE_PRODUCTION_LOG' |
'ADD_ASSIGNED_TASK' | 'UPDATE_ASSIGNED_TASK_STATUS' |
'ADD_BREAKDOWN_REPORT' | 'ADD_SAFETY_PERMIT' | 'ADD_MAINTENANCE_TASK' | 'UPDATE_MAINTENANCE_TASK' |
'ACKNOWLEDGE_PREDICTIVE_ALERT' | 'RESOLVE_INCIDENT' | 'ADD_TOOL_USAGE_LOG' | 'UPDATE_TOOL_STATUS' |
'ADD_MULTIPLE_PRODUCTION_LOGS';


export interface SyncQueueItem {
    id: string;
    action: SyncAction;
    payload: any;
    timestamp: number;
    entityId?: string;
}


// Types for AI Generated Report
export interface AiInsight {
    point: string;
    impact: 'Positive' | 'Negative' | 'Neutral';
    evidence: string[];
}

export interface AiRecommendation {
    action: string;
    priority: 'High' | 'Medium' | 'Low';
    justification: string;
}

export interface AiReport {
    executiveSummary: string;
    keyInsights: AiInsight[];
    recommendations: AiRecommendation[];
    dataDeepDive: string;
}

// Feature Set 1: Product Layout Inspection
export interface InspectionDimension {
  id: string;
  name: string;
  planValue: number;
  actualValue?: number;
  tolerance: { plus: number; minus: number };
  deviation?: number;
  isOutOfSpec?: boolean;
}

export interface LayoutInspection {
  id: string;
  partNumber: string;
  drawingRevision: string;
  batchNumber: string;
  inspectedByUserId: string;
  signedOffByUserId?: string;
  inspectionDate: Date;
  signOffDate?: Date;
  dimensions: InspectionDimension[];
  photoUrl?: string; // base64
  cadFileUrl?: string; // for future use
}

// Feature Set 2: Breakdown Reporting & Safety
export type BreakdownType = 'Mechanical' | 'Electrical' | 'Hydraulic' | 'Pneumatic' | 'Other';
export type SafetyPermitType = 'Hot Work' | 'Confined Space' | 'Lockout-Tagout' | 'Working at Height';
export type PermitStatus = 'Pending' | 'Issued' | 'Active' | 'Closed' | 'Cancelled';

export interface SafetyWorkPermit {
    id: string;
    breakdownId: string;
    type: SafetyPermitType;
    status: PermitStatus;
    issuedByUserId: string; // Safety Officer
    receivedByUserId: string; // Maintenance staff
    issueTimestamp: Date;
    closeTimestamp?: Date;
    validTo: Date;
    safetyChecks: { check: string; completed: boolean }[];
}

export interface BreakdownReport {
    id: string;
    machineId: string;
    reportedByUserId: string;
    reportTimestamp: Date;
    type: BreakdownType;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
    status: 'Open' | 'Acknowledged' | 'In Progress' | 'Resolved';
    resolvedTimestamp?: Date;
    maintenanceRequestId?: string; // Link to a formal maintenance request
    safetyPermitId?: string;
}

// Feature Set 4: Paperless QC/QA Docs
export type QualityDocumentType = 'Control Plan' | 'In-Process Checklist' | 'Non-Conformance Report' | 'Gauge Calibration Record' | 'Corrective Action Report';

// Content types for Quality Documents
export interface NcrContent {
    qcReferenceId: string;
    severity: 'Minor' | 'Major' | 'Critical';
    description: string;
    assignedTo: string;
    status: 'Open' | 'In Progress' | 'Verified' | 'Closed';
}

export interface CapaContent {
    ncrId: string;
    causeAnalysis: string;
    correctiveActions: { action: string, responsible: string, dueDate: Date }[];
    verificationEvidence?: string;
}

export interface GaugeCalibrationContent {
    gaugeId: string;
    lastCalibratedAt: Date;
    nextDueAt: Date;
    certificateUrl?: string;
}

export interface QualityDocument {
    id: string;
    type: QualityDocumentType;
    title: string;
    partNumber?: string;
    machineId?: string;
    createdByUserId: string;
    creationDate: Date;
    version: number;
    status: 'Draft' | 'Pending Approval' | 'Approved' | 'Archived';
    approverUserId?: string;
    approvalDate?: Date;
    content: NcrContent | CapaContent | GaugeCalibrationContent | any; // Flexible content based on type
    filePath?: string; // For attached files
}

// Feature Set 5: Machine Program Management
export interface ProgramVersion {
    version: number;
    uploadTimestamp: Date;
    uploadedByUserId: string;
    notes: string;
    filePath: string; // Link to file, or content could be stored directly
}
export interface MachineProgram {
    id: string;
    machineId: string;
    programName: string;
    fileType: 'CNC' | 'PLC' | 'Parameters' | 'Other';
    description: string;
    isPasswordProtected: boolean;
    versions: ProgramVersion[];
}

// Feature Set 6: Digital Tooling Management
export type ToolType = 'Cutting' | 'Holding' | 'Measuring' | 'Fixture';
export interface Tool {
    id: string;
    name: string;
    type: ToolType;
    serialNumber: string;
    location: string; // e.g., Tool Crib A-1
    maxUsageCycles: number;
    currentUsageCycles: number;
    status: 'Available' | 'In Use' | 'Needs Regrinding' | 'Needs Replacement' | 'Scrapped';
}

export interface ToolUsageLog {
    id: string;
    toolId: string;
    issuedToUserId: string;
    issuedByUserId: string;
    issueTimestamp: Date;
    returnTimestamp?: Date;
    machineId?: string;
    jobOrderNumber?: string;
}

// Feature Set 8: Project Management
export type ProjectTaskStatus = 'To Do' | 'In Progress' | 'On Hold' | 'Done' | 'Overdue';
export interface ProjectTask {
    id: string;
    title: string;
    assignedToUserId: string;
    status: ProjectTaskStatus;
    plannedStartDate: Date;
    plannedEndDate: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    dependencies: string[]; // array of task IDs
    progressProofUrl?: string; // image/doc upload
}
export interface Project {
    id: string;
    name: string;
    projectManagerId: string;
    startDate: Date;
    endDate: Date;
    status: 'Planning' | 'Active' | 'Completed' | 'Delayed';
    tasks: ProjectTask[];
}

// Feature Set 9: AI Innovation
export interface SlagReuseIdea {
    title: string;
    application: string;
    processingRequired: string;
    potentialBuyers: string;
    feasibility: {
        economic: 'High' | 'Medium' | 'Low';
        logistical: 'High' | 'Medium' | 'Low';
        environmental: 'High' | 'Medium' | 'Low';
    };
    nextSteps: string;
}

// PM/PdM Module
export interface PredictiveAlert {
    id: string;
    machineId: string;
    timestamp: Date;
    title: string;
    description: string;
    severity: 'Warning' | 'Critical';
    status: 'Open' | 'Acknowledged';
    acknowledgedByUserId?: string;
    acknowledgedAt?: Date;
}

// NEW: Shift Handover
export interface ShiftHandoverReport {
    id: string;
    fromShiftId: string;
    toShiftId: string;
    fromSupervisorId: string;
    toSupervisorId?: string; // Can be acknowledged by the next supervisor
    handoverTimestamp: Date;
    productionSummary: string;
    maintenanceSummary: string; // Key issues, upcoming tasks
    safetySummary: string; // Incidents, permits
    notesForNextShift: string;
    isAcknowledged: boolean;
}

// --- AI Report Types for ReportsView and geminiService ---

export interface AiDmmParameterReport {
  preamble: {
    partName: string;
    partNo: string;
    date: string;
    dieNo: string;
    machine: string;
    incharge: string;
  };
  shifts: {
    shift1: Array<{
      coreMaskThickness: string;
      coreMaskHeightOutside: string;
      coreMaskHeightInside: string;
      sandShotPressure: string;
      shotTimeCorrection: string;
      squeezePressure: string;
      ppStrippingAcceleration: string;
      ppStrippingDistance: string;
      spStrippingAcceleration: string;
      spStrippingDistance: string;
      mouldThickness: string;
      closeUpForce: string;
      remarks: string;
    }>;
    shift2: Array<{
      coreMaskThickness: string;
      coreMaskHeightOutside: string;
      coreMaskHeightInside: string;
      sandShotPressure: string;
      shotTimeCorrection: string;
      squeezePressure: string;
      ppStrippingAcceleration: string;
      ppStrippingDistance: string;
      spStrippingAcceleration: string;
      spStrippingDistance: string;
      mouldThickness: string;
      closeUpForce: string;
      remarks: string;
    }>;
    shift3: Array<{
      coreMaskThickness: string;
      coreMaskHeightOutside: string;
      coreMaskHeightInside: string;
      sandShotPressure: string;
      shotTimeCorrection: string;
      squeezePressure: string;
      ppStrippingAcceleration: string;
      ppStrippingDistance: string;
      spStrippingAcceleration: string;
      spStrippingDistance: string;
      mouldThickness: string;
      closeUpForce: string;
      remarks: string;
    }>;
  };
}

export interface AiDailyProductionPerformanceReport {
  preamble: {
    date: string;
    shift: string;
  };
  summary: {
    pouredMouldsValue: number;
    gasted: number;
    tonnage: number;
  };
  rows: Array<{
    sNo: number;
    patternCode: string;
    itemDescription: string;
    item: string;
    noOfCavity: number;
    mouldsPoured: number;
    mouldsProduced: number;
    pouredWeightKg: number;
    planned: number;
    unplanned: number;
    total: number;
  }>;
  unplannedReasons: string;
  footer: {
    incharge: string;
    hof: string;
    hodProduction: string;
  };
}

export interface AiNcrReport {
  rows: Array<{
    sNo: number;
    date: string;
    nonConformitiesDetails: string;
    correction: string;
    rootCause: string;
    correctiveAction: string;
    targetDate: string;
    responsibility: string;
    sign: string;
    status: string;
  }>;
}

export interface AiSettingAdjustmentReport {
  rows: Array<{
    date: string;
    counterNumber: string;
    noOfMoulds: string;
    workCarriedOut: string;
    preventiveWorkCarried: string;
    signature: string;
    remarks: string;
  }>;
}

export interface AiDisaMachineChecklistReport {
  preamble: {
    machine: string;
    month: string;
  };
  rows: Array<{
    slNo: number;
    checkPoint: string;
    checkMethod: string;
    days: { [day: number]: string };
  }>;
  footer: {
    operatorSign: string;
    hodMouSign: string;
  };
}

export interface AiRorVerificationReport {
  preamble: {
    line: string;
    date: string;
    disa: string;
  };
  rows: Array<{
    errorProofName: string;
    natureOfErrorProof: string;
    frequency: string;
    shift1_Observation: string;
    shift2_Observation: string;
    shift3_Observation: string;
  }>;
  footer: {
    verifiedBy: string;
    hod: string;
  };
}

export interface AiDailyPerformanceMonitoringReport {
  preamble: {
    department: string;
    monitoringLocation: string;
    units: string;
    pcbLimits: string;
  };
  rows: Array<{
    monitoringParameter: string;
    days: { [day: number]: string };
  }>;
  footer: {
    hodSign: string;
  };
}

export interface AiWeeklyPerformanceMonitoringReport {
  preamble: {
    department: string;
    responsibility: string;
    shiftIncharge: string;
  };
  rows: Array<{
    monitoringLocation: string;
    monitoringParameter: string;
    units: string;
    pcbLimits: string;
    set1: { w1: string; w2: string; w3: string; w4: string };
    set2: { w1: string; w2: string; w3: string; w4: string };
    set3: { w1: string; w2: string; w3: string; w4: string };
  }>;
  footer: {
    sign: string;
  };
}

export interface AiExecutiveSummaryReport {
  preamble: {
    reportDate: string;
    period: string;
    preparedFor: string;
  };
  summary: string;
  keyMetrics: Array<{
    metric: string;
    value: string;
    change: string;
  }>;
  insights: string[];
  recommendations: string[];
}