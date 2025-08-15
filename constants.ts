import { User, Role, Machine, ProductionData, ProductionLog, DowntimeEvent, MaintenanceTask, MachineAlert, ProductionOrder, InventoryItem, MaintenanceRequest, Shift, TrainingRecord, IncidentLog, BreakdownReport, SafetyWorkPermit, LayoutInspection, QualityDocument, MachineProgram, Tool, Project, ProjectTask, PredictiveAlert, ToolUsageLog, NcrContent, GaugeCalibrationContent, AssignedTask } from './types';

export const ADMIN_EMAIL = 'admin@disa.com';

export const MOCK_SHIFTS: Shift[] = [
    { id: 'shift-morning', name: 'Morning', startTime: '06:00', endTime: '14:00' },
    { id: 'shift-evening', name: 'Evening', startTime: '14:00', endTime: '22:00' },
    { id: 'shift-night', name: 'Night', startTime: '22:00', endTime: '06:00' },
];

export const MOCK_TRAINING_RECORDS: TrainingRecord[] = [
    { id: 'train-01', name: 'Basic Machine Operation', completedDate: new Date('2023-01-15'), expiresDate: new Date('2025-01-15') },
    { id: 'train-02', name: 'Advanced Safety Protocols', completedDate: new Date('2023-03-20'), expiresDate: new Date('2024-03-20') }, // Expired
    { id: 'train-03', name: 'Quality Control Fundamentals', completedDate: new Date('2023-05-10') },
    { id: 'train-04', name: 'Lockout-Tagout Procedure', completedDate: new Date('2024-06-01'), expiresDate: new Date('2025-06-01') },
];

export const MOCK_USERS: User[] = [
    { uid: 'admin01', employeeId: 'admin', name: 'Admin User', email: ADMIN_EMAIL, role: Role.Admin, isOnline: true, profilePicUrl: 'https://i.pravatar.cc/150?u=admin01', password: 'adminpass', shiftId: 'shift-morning' },
    { uid: 'mgr01', employeeId: 'M301', name: 'Manager Mike', email: 'm301@disa.com', role: Role.Manager, isOnline: true, profilePicUrl: 'https://i.pravatar.cc/150?u=mgr01', password: 'managerpass', shiftId: 'shift-morning' },
    { uid: 'sup01', employeeId: 'S201', name: 'Supervisor Sam', email: 's201@disa.com', role: Role.Supervisor, isOnline: true, profilePicUrl: 'https://i.pravatar.cc/150?u=sup01', password: 'S201', shiftId: 'shift-evening' },
    { uid: 'op01', employeeId: 'E101', name: 'Operator Olivia', email: 'e101@disa.com', role: Role.Operator, assignedMachineId: 'DISA-01', isOnline: true, profilePicUrl: 'https://i.pravatar.cc/150?u=op01', password: 'E101', shiftId: 'shift-evening', trainingRecords: MOCK_TRAINING_RECORDS },
    { uid: 'op02', employeeId: 'E102', name: 'Operator Oscar', email: 'e102@disa.com', role: Role.Operator, assignedMachineId: 'DISA-02', isOnline: false, profilePicUrl: 'https://i.pravatar.cc/150?u=op02', password: 'E102', shiftId: 'shift-night', trainingRecords: [MOCK_TRAINING_RECORDS[0]] },
    { uid: 'qe01', employeeId: 'Q401', name: 'Quality Quinn', email: 'q401@disa.com', role: Role.QualityEngineer, isOnline: true, profilePicUrl: 'https://i.pravatar.cc/150?u=qe01', password: 'Q401', shiftId: 'shift-morning' },
    { uid: 'safe01', employeeId: 'F501', name: 'Safety Sofia', email: 'f501@disa.com', role: Role.SafetyOfficer, isOnline: false, profilePicUrl: 'https://i.pravatar.cc/150?u=safe01', password: 'F501', shiftId: 'shift-morning' },
    { uid: 'tool01', employeeId: 'T601', name: 'Toolroom Tom', email: 't601@disa.com', role: Role.ToolRoomOperator, isOnline: true, profilePicUrl: 'https://i.pravatar.cc/150?u=tool01', password: 'T601', shiftId: 'shift-evening' },
];

export const REJECTION_REASONS: string[] = [
  'Sand Inclusion', 'Misrun', 'Mold Shift', 'Porosity', 'Hot Tear',
  'Distortion', 'Blowhole', 'Shrinkage', 'Core Breakage', 'Surface Finish Defect'
];

export const DOWNTIME_REASONS: string[] = [
  'Pattern Change', 'Core Setter Jam', 'PLC/HMI Failure', 'Sand Supply Issue',
  'Weekly Lubrication', 'Shift Changeover', 'Mould Cooling Time', 'Unplanned Maintenance'
];

export const FONT_OPTIONS: { name: string, family: string }[] = [
    { name: 'Inter', family: 'font-sans' },
    { name: 'Roboto Mono', family: 'font-mono' },
    { name: 'Lato', family: 'font-lato' },
    { name: 'Oswald', family: 'font-oswald' },
    { name: 'Source Code Pro', family: 'font-source-code-pro' },
    { name: 'Nunito', family: 'font-nunito' },
    { name: 'Montserrat', family: 'font-montserrat' },
    { name: 'Poppins', family: 'font-poppins' },
    { name: 'Open Sans', family: 'font-open-sans' },
    { name: 'Raleway', family: 'font-raleway' },
];

export const MOCK_MACHINES: Machine[] = [
    // Molding solutions
    { 
        id: 'DISA-D-01', name: 'DISAMATIC D3-Z425', type: 'Molding solutions', status: 'Running', idealCycleTime: 17, location: 'Foundry Line 1', mouldsPerHour: 210, energyConsumptionKwh: 150,
        operatingParameters: { mouldingPressure: { min: 80, ideal: 100, max: 120, critical_max: 130 }, sandTemperature: { min: 35, ideal: 40, max: 45, critical_max: 50 }, cycleTimeVariancePercent: { max: 5, critical_max: 10 } },
        liveData: { mouldingPressure: 100, sandTemperature: 40, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'DISA-C-01', name: 'DISAMATIC C3-X350', type: 'Molding solutions', status: 'Down', idealCycleTime: 18, location: 'Foundry Line 1', mouldsPerHour: 200, energyConsumptionKwh: 140,
        operatingParameters: { mouldingPressure: { min: 85, ideal: 105, max: 125, critical_max: 135 }, sandTemperature: { min: 36, ideal: 41, max: 46, critical_max: 51 }, cycleTimeVariancePercent: { max: 5, critical_max: 11 } },
        liveData: { mouldingPressure: 105, sandTemperature: 41, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'DISA-MATCH-01', name: 'DISA MATCH 28/32', type: 'Molding solutions', status: 'Idle', idealCycleTime: 20, location: 'Foundry Line 2', mouldsPerHour: 180, energyConsumptionKwh: 120,
        operatingParameters: { mouldingPressure: { min: 70, ideal: 90, max: 110, critical_max: 120 }, sandTemperature: { min: 38, ideal: 42, max: 48, critical_max: 52 }, cycleTimeVariancePercent: { max: 6, critical_max: 12 } },
        liveData: { mouldingPressure: 90, sandTemperature: 42, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'DISA-FLEX-01', name: 'DISA FLEX 70', type: 'Molding solutions', status: 'Running', idealCycleTime: 25, location: 'Specialty Casting', mouldsPerHour: 150, energyConsumptionKwh: 180,
        operatingParameters: { mouldingPressure: { min: 60, ideal: 75, max: 90, critical_max: 100 }, sandTemperature: { min: 40, ideal: 45, max: 50, critical_max: 55 }, cycleTimeVariancePercent: { max: 7, critical_max: 15 } },
        liveData: { mouldingPressure: 75, sandTemperature: 45, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'DISA-ARPA-01', name: 'DISA ARPA 450', type: 'Molding solutions', status: 'Idle', idealCycleTime: 30, location: 'Foundry Line 3', mouldsPerHour: 120, energyConsumptionKwh: 100,
        operatingParameters: { mouldingPressure: { min: 50, ideal: 65, max: 80, critical_max: 90 }, sandTemperature: { min: 40, ideal: 45, max: 50, critical_max: 55 }, cycleTimeVariancePercent: { max: 8, critical_max: 15 } },
        liveData: { mouldingPressure: 65, sandTemperature: 45, cycleTimeVariancePercent: 0 }
    },

    // Sand preparation and cast cooling
    { 
        id: 'DISAMIX-01', name: 'DISAMIX TM 190-55', type: 'Sand preparation and cast cooling', status: 'Running', idealCycleTime: 1, location: 'Sand Plant 1', mouldsPerHour: 0, energyConsumptionKwh: 80,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 20, ideal: 25, max: 35, critical_max: 40 }, cycleTimeVariancePercent: { max: 0, critical_max: 0 } },
        liveData: { mouldingPressure: 0, sandTemperature: 25, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'SMC-01', name: 'Sand Multi Controller (SMC)', type: 'Sand preparation and cast cooling', status: 'Running', idealCycleTime: 1, location: 'Sand Plant 1', mouldsPerHour: 0, energyConsumptionKwh: 10,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 0, critical_max: 0 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'DISACOOL-01', name: 'DISACOOL A3', type: 'Sand preparation and cast cooling', status: 'Running', idealCycleTime: 1, location: 'Cooling Line 1', mouldsPerHour: 0, energyConsumptionKwh: 50,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 40, ideal: 50, max: 60, critical_max: 70 }, cycleTimeVariancePercent: { max: 0, critical_max: 0 } },
        liveData: { mouldingPressure: 0, sandTemperature: 50, cycleTimeVariancePercent: 0 }
    },

    // Shot blasting equipment
    { 
        id: 'WB-TUMBLAST-01', name: 'SmartLine Tumblast Machine', type: 'Shot blasting equipment', status: 'Idle', idealCycleTime: 180, location: 'Finishing Area', mouldsPerHour: 20, energyConsumptionKwh: 250,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 10, critical_max: 20 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'WB-HANGER-01', name: 'SmartLine Overhead Rail Shot Blast Machine', type: 'Shot blasting equipment', status: 'Idle', idealCycleTime: 240, location: 'Finishing Area 2', mouldsPerHour: 15, energyConsumptionKwh: 300,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 10, critical_max: 20 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },
     { 
        id: 'WB-ROLLER-01', name: 'Roller Conveyor Type G', type: 'Shot blasting equipment', status: 'Running', idealCycleTime: 120, location: 'Large Castings Line', mouldsPerHour: 30, energyConsumptionKwh: 400,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 10, critical_max: 20 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'WB-PEENING-01', name: 'RDS Spring Peening Machine', type: 'Shot blasting equipment', status: 'Idle', idealCycleTime: 300, location: 'Specialty Finishing', mouldsPerHour: 12, energyConsumptionKwh: 350,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 8, critical_max: 16 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'WB-AIRBLAST-01', name: 'SmartLine Airblast Cabinet', type: 'Shot blasting equipment', status: 'Idle', idealCycleTime: 600, location: 'Manual Finishing', mouldsPerHour: 6, energyConsumptionKwh: 100,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 5, critical_max: 10 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },
     { 
        id: 'WB-CONTINUOUS-01', name: 'CT Through-Feed Blast Cleaning Machine', type: 'Shot blasting equipment', status: 'Running', idealCycleTime: 15, location: 'Continuous Line', mouldsPerHour: 240, energyConsumptionKwh: 450,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 10, critical_max: 20 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },
    
    // Core making
    { 
        id: 'DISA-CORE-01', name: 'DISA CORE 20 FP', type: 'Core making', status: 'Idle', idealCycleTime: 45, location: 'Core Shop', mouldsPerHour: 80, energyConsumptionKwh: 90,
        operatingParameters: { mouldingPressure: { min: 4, ideal: 5, max: 6, critical_max: 7 }, sandTemperature: { min: 20, ideal: 25, max: 30, critical_max: 35 }, cycleTimeVariancePercent: { max: 5, critical_max: 10 } },
        liveData: { mouldingPressure: 5, sandTemperature: 25, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'DISA-CORE-02', name: 'Core Shooting Machine TP series', type: 'Core making', status: 'Down', idealCycleTime: 60, location: 'Core Shop', mouldsPerHour: 60, energyConsumptionKwh: 75,
        operatingParameters: { mouldingPressure: { min: 3, ideal: 4, max: 5, critical_max: 6 }, sandTemperature: { min: 20, ideal: 25, max: 30, critical_max: 35 }, cycleTimeVariancePercent: { max: 5, critical_max: 10 } },
        liveData: { mouldingPressure: 4, sandTemperature: 25, cycleTimeVariancePercent: 0 }
    },

    // Automation
    { 
        id: 'AUTO-AMC-01', name: 'Automatic Mould Conveyor (AMC)', type: 'Automation', status: 'Running', idealCycleTime: 5, location: 'Foundry Line 1', mouldsPerHour: 0, energyConsumptionKwh: 40,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 2, critical_max: 5 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },
    { 
        id: 'AUTO-APC-01', name: 'Automatic Pattern Changer (APC)', type: 'Automation', status: 'Idle', idealCycleTime: 120, location: 'Foundry Line 2', mouldsPerHour: 0, energyConsumptionKwh: 30,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 3, critical_max: 6 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },

    // Industrial filters
    { 
        id: 'FILTER-01', name: 'Cartridge Filter ES-8', type: 'Industrial filters', status: 'Running', idealCycleTime: 1, location: 'Dust Collection', mouldsPerHour: 0, energyConsumptionKwh: 20,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 0, critical_max: 0 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    },

    // Digital solutions
    { 
        id: 'DIGITAL-01', name: 'Monitizer® | DISCOVER®', type: 'Digital solutions', status: 'Running', idealCycleTime: 1, location: 'Control Room', mouldsPerHour: 0, energyConsumptionKwh: 5,
        operatingParameters: { mouldingPressure: { min: 0, ideal: 0, max: 0, critical_max: 0 }, sandTemperature: { min: 0, ideal: 0, max: 0, critical_max: 0 }, cycleTimeVariancePercent: { max: 0, critical_max: 0 } },
        liveData: { mouldingPressure: 0, sandTemperature: 0, cycleTimeVariancePercent: 0 }
    }
];

const now = new Date();
const generateLogs = (machineId: string, userId: string, days: number): ProductionLog[] => {
    const logs: ProductionLog[] = [];
    const machine = MOCK_MACHINES.find(m => m.id === machineId);
    if (!machine) return [];

    for(let i=0; i<days*8; i++){ // 8 logs per day
        const timestamp = new Date(now.getTime() - i * 3 * 60 * 60 * 1000); // every 3 hours
        const goodMoulds = Math.floor(Math.random() * 50) + 100;
        const rejectedMoulds = Math.floor(Math.random() * 10);
        const rejectionReason: string[] = [];
        if (rejectedMoulds > 0) {
            const reason1 = REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)];
            rejectionReason.push(reason1);
            if (Math.random() > 0.7) {
                 const reason2 = REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)];
                 if (reason1 !== reason2) {
                     rejectionReason.push(reason2);
                 }
            }
        }
        
        const cost = (goodMoulds * (Math.random() * 4 + 8)) + (rejectedMoulds * (Math.random() * 2 + 5));
        const actualCycleTime = machine.idealCycleTime + (Math.random() * 4 - 2); // +/- 2s from ideal
        const energyConsumedKwh = (goodMoulds + rejectedMoulds) * (machine.energyConsumptionKwh / machine.mouldsPerHour) * 1.05; // 5% overhead
        
        const mouldingPressure = machine.operatingParameters.mouldingPressure.ideal + (Math.random() * 20 - 10); // +/- 10 from ideal
        const sandTemperature = machine.operatingParameters.sandTemperature.ideal + (Math.random() * 4 - 2); // +/- 2 from ideal

        const randomStatus = Math.random();
        let status: ProductionLog['status'];
        if (i < 5) { // Ensure some are recent and pending
            status = 'Pending';
        } else if (randomStatus < 0.9) {
            status = 'Approved';
        } else if (randomStatus < 0.98) {
            status = 'Rejected';
        } else {
            status = 'Pending';
        }


        const log: ProductionLog = {
            id: `log-${machineId}-${i}`,
            machineId,
            userId,
            shiftId: MOCK_SHIFTS[i % MOCK_SHIFTS.length].id,
            timestamp,
            goodMoulds,
            rejectedMoulds,
            batchNumber: `B${timestamp.getFullYear()}${(timestamp.getMonth()+1).toString().padStart(2, '0')}${timestamp.getDate().toString().padStart(2, '0')}-${machineId.slice(-2)}`,
            jobOrderNumber: `JOB-${Math.floor(timestamp.getTime() / 1000000)}`,
            partId: `P-${machineId.slice(-2)}-${Math.floor(Math.random() * 5) + 1}`,
            rejectionReason,
            cost,
            mouldType: machine.type === 'DISA MATCH' ? 'Horizontal Flaskless' : 'Green Sand Vertical',
            mouldSize: '500x400x300',
            actualCycleTime,
            energyConsumedKwh,
            material: ['Iron', 'Steel', 'Brass', 'Aluminum'][i % 4] as any,
            notes: Math.random() > 0.95 ? 'Slight vibration noticed at high speed.' : undefined,
            status,
            reviewedByUserId: status === 'Approved' || status === 'Rejected' ? 'sup01' : undefined,
            reviewTimestamp: status === 'Approved' || status === 'Rejected' ? new Date(timestamp.getTime() + 1000*60*60) : undefined,
            rejectionNotes: status === 'Rejected' ? 'Incorrect mould temperature recorded.' : undefined,
            mouldingPressure,
            sandTemperature,
        };
        logs.push(log);
    }
    return logs;
}


export const MOCK_PRODUCTION_DATA: ProductionData = {
    logs: [
        ...generateLogs('DISA-D-01', 'op01', 120),
        ...generateLogs('DISA-MATCH-01', 'op02', 120),
        ...generateLogs('DISA-C-01', 'op01', 120),
        ...generateLogs('DISA-FLEX-01', 'op02', 120)
    ],
    downtime: [
        { id: 'dt-1', machineId: 'DISA-C-01', userId: 'op01', start: new Date(now.getTime() - 2 * 60 * 60 * 1000), end: new Date(now.getTime() - 1 * 60 * 60 * 1000), reason: 'Core Setter Jam', notes: 'Operator reported jam, maintenance cleared.' },
        { id: 'dt-2', machineId: 'DISA-C-01', userId: 'op01', start: new Date(now.getTime() - 30 * 60 * 1000), reason: 'Pattern Change' },
        { id: 'dt-3', machineId: 'DISA-D-01', userId: 'op01', start: new Date(now.getTime() - 26 * 60 * 60 * 1000), end: new Date(now.getTime() - 25 * 60 * 60 * 1000), reason: 'Weekly Lubrication', notes: 'Performed by maintenance team as scheduled.' },
        { id: 'dt-4', machineId: 'DISA-MATCH-01', userId: 'op02', start: new Date(now.getTime() - 48 * 60 * 60 * 1000), end: new Date(now.getTime() - 47.5 * 60 * 60 * 1000), reason: 'Sand Supply Issue' },
        { id: 'dt-5', machineId: 'DISA-FLEX-01', userId: 'op02', start: new Date(now.getTime() - 72 * 60 * 60 * 1000), end: new Date(now.getTime() - 71 * 60 * 60 * 1000), reason: 'PLC/HMI Failure' },
    ]
};

export const MOCK_MAINTENANCE_TASKS: MaintenanceTask[] = [
    { id: 'maint-1', machineId: 'DISA-D-01', description: 'Weekly Hydraulic Fluid Check', scheduleType: 'calendar', interval: 7, lastCompleted: new Date(now.getTime() - 6 * 24 * 3600 * 1000), nextDue: new Date(now.getTime() + 1 * 24 * 3600 * 1000), status: 'Upcoming', assignedToUserId: 'op01' },
    { id: 'maint-2', machineId: 'DISA-MATCH-01', description: 'Filter Replacement (500hrs)', scheduleType: 'runtime', interval: 500, lastCompleted: new Date(now.getTime() - 450 * 3600 * 1000), nextDue: new Date(now.getTime() + 50 * 3600 * 1000), status: 'Upcoming', assignedToUserId: 'op02' },
    { id: 'maint-3', machineId: 'DISA-C-01', description: 'Monthly Electrical System Inspection', scheduleType: 'calendar', interval: 30, lastCompleted: new Date(now.getTime() - 32 * 24 * 3600 * 1000), nextDue: new Date(now.getTime() - 2 * 24 * 3600 * 1000), status: 'Overdue', assignedToUserId: 'sup01' },
    { id: 'maint-4', machineId: 'DISA-D-01', description: 'Shot Valve Calibration (100hrs)', scheduleType: 'runtime', interval: 100, lastCompleted: new Date(now.getTime() - 98 * 3600 * 1000), nextDue: new Date(now.getTime() + 2 * 3600 * 1000), status: 'Due', assignedToUserId: 'op01' },
    { id: 'maint-5', machineId: 'DISA-FLEX-01', description: 'Bi-Weekly Wear Plate Check', scheduleType: 'calendar', interval: 14, lastCompleted: new Date(now.getTime() - 1 * 24 * 3600 * 1000), nextDue: new Date(now.getTime() + 13 * 24 * 3600 * 1000), status: 'Completed', completedByUserId: 'op02', completionNotes: 'Plates show minimal wear. Checked and cleaned.' },
];

export const MOCK_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
    {
        id: 'req-1',
        title: 'Unusual noise from conveyor belt',
        machineId: 'DISA-D-01',
        description: 'A loud grinding noise is coming from the main conveyor belt, especially under load. Seems to be getting worse.',
        status: 'Open',
        type: 'Corrective',
        priority: 'Medium',
        reportedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        estimatedDurationHours: 2,
        estimatedCost: 250,
        partsRequired: [{ id: 'belt-bearing-123', name: 'Conveyor Bearing', quantity: 2, cost: 100 }]
    },
    {
        id: 'req-2',
        title: 'Panel screen unresponsive',
        machineId: 'DISA-C-01',
        description: 'The main operator HMI panel is frozen and not responding to touch inputs. A restart did not solve the issue.',
        status: 'In Progress',
        type: 'Corrective',
        priority: 'Critical',
        reportedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        estimatedDurationHours: 4,
        estimatedCost: 1200,
        partsRequired: [{ id: 'hmi-panel-456', name: 'HMI Touchscreen', quantity: 1, cost: 1000 }]
    },
];

export const MOCK_MACHINE_ALERTS: MachineAlert[] = [
    { id: 'alert-1', machineId: 'DISA-C-01', timestamp: new Date(now.getTime() - 15 * 60 * 1000), code: 'E-102', description: 'Sand pressure below threshold', severity: 'High', isAcknowledged: false },
    { id: 'alert-2', machineId: 'DISA-D-01', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), code: 'W-045', description: 'Hydraulic fluid temperature elevated', severity: 'Medium', isAcknowledged: false },
    { id: 'alert-3', machineId: 'DISA-MATCH-01', timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), code: 'I-001', description: 'Cycle time deviation > 5%', severity: 'Low', isAcknowledged: true },
];

export const MOCK_INCIDENT_LOGS: IncidentLog[] = [
    { id: 'inc-1', machineId: 'DISA-D-01', reportedByUserId: 'op01', timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), description: 'Minor sand spillage during mould transfer.', severity: 'Low', resolution: 'Cleaned up by operator, process not halted.', resolvedByUserId: 'op01', resolvedAt: new Date(now.getTime() - 2.9 * 60 * 60 * 1000) },
    { id: 'inc-2', machineId: 'DISA-C-01', reportedByUserId: 'sup01', timestamp: new Date(now.getTime() - 28 * 60 * 60 * 1000), description: 'Sudden pressure drop in hydraulic system.', severity: 'High' },
    { id: 'inc-3', machineId: 'DISA-FLEX-01', reportedByUserId: 'op02', timestamp: new Date(now.getTime() - 50 * 60 * 60 * 1000), description: 'Safety guard sensor C-12 is malfunctioning.', severity: 'Medium' },
];

export const MOCK_PRODUCTION_ORDERS: ProductionOrder[] = [
    { id: 'PO-24-CYLHEAD', status: 'In Progress', priority: 'high', customer: 'Tata Motors', partNumber: 'CYL-HEAD-T4', partDescription: 'Automotive Cylinder Head', quantity: { produced: 387, target: 500 }, dueDate: new Date('2024-08-10'), qualityChecks: [{name: 'dimensional_check', status: 'passed'}, {name: 'surface_finish', status: 'pending'}, {name: 'pressure_test', status: 'pending'}]},
    { id: 'PO-24-PUMPHSG', status: 'Completed', priority: 'medium', customer: 'Kirloskar Brothers', partNumber: 'PMP-HSG-K2', partDescription: 'Centrifugal Pump Housing', quantity: { produced: 200, target: 200 }, dueDate: new Date('2024-07-30')},
    { id: 'PO-24-CALIPER', status: 'Pending', priority: 'medium', customer: 'Brembo Brakes', partNumber: 'BRK-CAL-B1', partDescription: 'Brake Caliper', quantity: { produced: 0, target: 1000 }, dueDate: new Date('2024-08-25')},
    { id: 'PO-24-MANIFOLD', status: 'Paused', priority: 'low', customer: 'Generic Auto Parts', partNumber: 'MANIFOLD-G1', partDescription: 'Exhaust Manifold', quantity: { produced: 50, target: 300 }, dueDate: new Date('2024-09-01')},
];

export const MOCK_INVENTORY_ITEMS: InventoryItem[] = [
    { id: 'fe-sg-ingot', name: 'SG Iron Ingots', category: 'Raw Materials', stockLevel: 3000, unit: 'kg', minStock: 1000, maxStock: 5000, stockStatus: 'adequate', location: 'Warehouse A-1', unitCost: 1.2, supplier: 'Tata Metaliks', lastRestocked: new Date('2024-07-15')},
    { id: 'fe-scrap', name: 'Scrap Steel', category: 'Raw Materials', stockLevel: 8000, unit: 'kg', minStock: 5000, maxStock: 15000, stockStatus: 'adequate', location: 'Yard 2', unitCost: 0.8, supplier: 'Local Scrap Co.', lastRestocked: new Date('2024-07-20')},
    { id: 'sand-silica', name: 'Silica Sand (AFS 50)', category: 'Molding Materials', stockLevel: 15000, unit: 'kg', minStock: 5000, maxStock: 25000, stockStatus: 'adequate', location: 'Silo 1', unitCost: 0.15, supplier: 'Rajasthan Minerals', lastRestocked: new Date('2024-07-05')},
    { id: 'clay-bentonite', name: 'Bentonite Clay', category: 'Molding Materials', stockLevel: 800, unit: 'kg', minStock: 1000, maxStock: 3000, stockStatus: 'low', location: 'Silo 3', unitCost: 0.4, supplier: 'Gujarat Clays', lastRestocked: new Date('2024-07-22')},
    { id: 'chem-inoc', name: 'Inoculant (FeSi)', category: 'Chemicals', stockLevel: 200, unit: 'kg', minStock: 150, maxStock: 500, stockStatus: 'adequate', location: 'ChemStore-A', unitCost: 3.5, supplier: 'ChemTreat Inc.', lastRestocked: new Date('2024-07-25')},
    { id: 'tool-thermo', name: 'Thermocouple Tip K-Type', category: 'Tools', stockLevel: 15, unit: 'pcs', minStock: 20, maxStock: 50, stockStatus: 'critical', location: 'Tool Crib', unitCost: 25, supplier: 'SensorTech', lastRestocked: new Date('2024-06-30')},
    { id: 'cast-cylhead', name: 'Cylinder Head Casting', category: 'Castings', stockLevel: 85, unit: 'pcs', minStock: 50, maxStock: 200, stockStatus: 'adequate', location: 'Warehouse C-4', unitCost: 45, supplier: 'Internal', lastRestocked: new Date(now) },
    { id: 'cast-caliper', name: 'Brake Caliper Casting', category: 'Castings', stockLevel: 48, unit: 'pcs', minStock: 50, maxStock: 300, stockStatus: 'low', location: 'Warehouse C-5', unitCost: 22, supplier: 'Internal', lastRestocked: new Date(now) },
];

export const MOCK_ASSIGNED_TASKS: AssignedTask[] = [
    { id: 'task-1', assignedToUserId: 'op01', assignedByUserId: 'sup01', title: 'Perform daily lubrication on DISA-01', description: 'Use grade 4 lubricant on all marked points. Check for leaks.', isCompleted: false, assignedAt: new Date(now.getTime() - 2 * 3600 * 1000) },
    { id: 'task-2', assignedToUserId: 'op01', assignedByUserId: 'sup01', title: 'Check sand temperature sensor', description: 'The sensor on DISA-01 has been reporting erratically. Clean and check connection.', isCompleted: true, assignedAt: new Date(now.getTime() - 26 * 3600 * 1000), completedAt: new Date(now.getTime() - 24 * 3600 * 1000) },
    { id: 'task-3', assignedToUserId: 'op02', assignedByUserId: 'sup01', title: 'Prepare pattern P-02-B for next job', description: 'Pattern needs to be cleaned and inspected before the next shift starts.', isCompleted: false, assignedAt: new Date(now.getTime() - 1 * 3600 * 1000) },
];

// NEW MOCK DATA
export const MOCK_BREAKDOWN_REPORTS: BreakdownReport[] = [
    { id: 'br-1', machineId: 'DISA-C-01', reportedByUserId: 'op01', reportTimestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), type: 'Electrical', severity: 'Critical', description: 'Main HMI panel is completely blank and unresponsive.', status: 'In Progress', safetyPermitId: 'sp-1' },
    { id: 'br-2', machineId: 'DISA-D-01', reportedByUserId: 'op01', reportTimestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000), type: 'Mechanical', severity: 'High', description: 'Loud grinding noise from main conveyor under load.', status: 'Acknowledged' },
    { id: 'br-3', machineId: 'DISA-MATCH-01', reportedByUserId: 'op02', reportTimestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000), type: 'Hydraulic', severity: 'Medium', description: 'Slow hydraulic fluid leak observed near the primary cylinder.', status: 'Resolved', resolvedTimestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
];

export const MOCK_SAFETY_PERMITS: SafetyWorkPermit[] = [
    { id: 'sp-1', breakdownId: 'br-1', type: 'Lockout-Tagout', status: 'Active', issuedByUserId: 'safe01', receivedByUserId: 'sup01', issueTimestamp: new Date(now.getTime() - 1.8 * 60 * 60 * 1000), validTo: new Date(now.getTime() + 6.2 * 60 * 60 * 1000), safetyChecks: [{check: 'Energy sources isolated', completed: true}, {check: 'Machine locked and tagged', completed: true}] },
    { id: 'sp-2', breakdownId: 'br-2', type: 'Hot Work', status: 'Active', issuedByUserId: 'safe01', receivedByUserId: 'sup01', issueTimestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), validTo: new Date(now.getTime() + 1 * 60 * 60 * 1000), safetyChecks: [{check: 'Fire extinguisher present', completed: true}, {check: 'Area cleared of flammables', completed: false}] },
    { id: 'sp-3', breakdownId: 'br-3', type: 'Confined Space', status: 'Closed', issuedByUserId: 'safe01', receivedByUserId: 'op02', issueTimestamp: new Date(now.getTime() - 25 * 60 * 60 * 1000), closeTimestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), validTo: new Date(now.getTime() - 20 * 60 * 60 * 1000), safetyChecks: [{check: 'Atmosphere checked', completed: true}, {check: 'Rescue plan in place', completed: true}] },
];

export const MOCK_LAYOUT_INSPECTIONS: LayoutInspection[] = [
    { id: 'li-1', partNumber: 'CYL-HEAD-T4', drawingRevision: 'v2.1', batchNumber: 'B240729-01', inspectedByUserId: 'qe01', inspectionDate: new Date(), dimensions: [
        { id: 'd1', name: 'Overall Length', planValue: 350, actualValue: 350.1, tolerance: { plus: 0.2, minus: 0.2 }, deviation: 0.1, isOutOfSpec: false },
        { id: 'd2', name: 'Bore Diameter', planValue: 85, actualValue: 85.05, tolerance: { plus: 0.05, minus: 0.05 }, deviation: 0.05, isOutOfSpec: false },
        { id: 'd3', name: 'Port Height', planValue: 40, actualValue: 40.3, tolerance: { plus: 0.1, minus: 0.1 }, deviation: 0.3, isOutOfSpec: true },
    ], signedOffByUserId: 'sup01', signOffDate: new Date() },
];

export const MOCK_QUALITY_DOCUMENTS: QualityDocument[] = [
    { id: 'qd-1', type: 'Non-Conformance Report', title: 'NCR-2024-088', partNumber: 'PMP-HSG-K2', createdByUserId: 'qe01', creationDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), version: 1, status: 'Pending Approval', content: { qcReferenceId: 'qc-123', severity: 'Major', description: 'Surface porosity found on 5% of castings from batch B240728-02.', assignedTo: 'sup01', status: 'Open' } as NcrContent },
    { id: 'qd-2', type: 'Gauge Calibration Record', title: 'CAL-2024-15', createdByUserId: 'qe01', creationDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), version: 1, status: 'Approved', content: { gaugeId: 'VERNIER-04', lastCalibratedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), nextDueAt: new Date(now.getTime() + 355 * 24 * 60 * 60 * 1000) } as GaugeCalibrationContent },
];

export const MOCK_MACHINE_PROGRAMS: MachineProgram[] = [
    { id: 'mp-1', machineId: 'DISA-D-01', programName: 'CYL-HEAD-T4-v3', fileType: 'Parameters', description: 'Main production program for Tata Cylinder Head.', isPasswordProtected: true, versions: [
        { version: 3, uploadTimestamp: new Date('2024-07-20T10:00:00Z'), uploadedByUserId: 'sup01', notes: 'Increased sand pressure by 2%.', filePath: '/programs/d1-p1-v3.par' },
        { version: 2, uploadTimestamp: new Date('2024-06-15T09:00:00Z'), uploadedByUserId: 'sup01', notes: 'Initial release for production.', filePath: '/programs/d1-p1-v2.par' },
    ]},
];

export const MOCK_TOOLS: Tool[] = [
    { id: 'tool-1', name: 'Core Box Pattern A', type: 'Fixture', serialNumber: 'CB-PATT-A-001', location: 'Tool Crib A-1', maxUsageCycles: 5000, currentUsageCycles: 1250, status: 'Available' },
    { id: 'tool-2', name: 'Thermocouple Lance', type: 'Measuring', serialNumber: 'THERMO-L-042', location: 'In Use - DISA-D-01', maxUsageCycles: 1000, currentUsageCycles: 980, status: 'Needs Replacement' },
];

export const MOCK_PROJECTS: Project[] = [
    { id: 'proj-1', name: 'New Client Onboarding: Brembo', projectManagerId: 'sup01', startDate: new Date('2024-07-01'), endDate: new Date('2024-08-30'), status: 'Active', tasks: [
        { id: 'pt-1', title: 'Finalize Pattern Design', assignedToUserId: 'tool01', status: 'Done', plannedStartDate: new Date('2024-07-01'), plannedEndDate: new Date('2024-07-15'), dependencies: [] },
        { id: 'pt-2', title: 'First Article Inspection', assignedToUserId: 'qe01', status: 'In Progress', plannedStartDate: new Date('2024-07-16'), plannedEndDate: new Date('2024-07-30'), dependencies: ['pt-1'] },
    ]},
];

export const MOCK_PREDICTIVE_ALERTS: PredictiveAlert[] = [
    { id: 'pa-1', machineId: 'DISA-D-01', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), title: 'Hydraulic Pressure Variance High', description: 'AI model predicts a 78% chance of hydraulic pump failure within the next 48 hours based on pressure fluctuations.', severity: 'Critical', status: 'Open' },
];

export const MOCK_TOOL_USAGE_LOGS: ToolUsageLog[] = [
    { id: 'tul-1', toolId: 'tool-2', issuedToUserId: 'op01', issuedByUserId: 'tool01', issueTimestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), machineId: 'DISA-D-01' },
];