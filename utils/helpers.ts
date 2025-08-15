import { ProductionLog, DowntimeEvent, Machine } from './types';

export const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
};

export const toLocalISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const safeParseDate = (dateInput: any): Date => {
    if (!dateInput) return new Date();
    
    // Attempt to parse with new Date() constructor, which is quite powerful
    const d = new Date(dateInput);
    
    // Check if the date is valid. An invalid date's time is NaN.
    if (!isNaN(d.getTime())) {
        return d;
    }

    // If parsing fails, warn and return a safe default (current time)
    console.warn(`Could not parse date: "${dateInput}". Defaulting to current time.`);
    return new Date();
};

export const jsonDateReviver = (key: string, value: any) => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    if (typeof value === 'string' && isoDateRegex.test(value)) {
        return new Date(value);
    }
    return value;
};

export const calculateOEE = (
    logs: ProductionLog[],
    downtime: DowntimeEvent[],
    allMachines: Machine[],
    periodStart: Date,
    periodEnd: Date,
    machineIdFilter: string
): number => {
    const plannedProductionTime = (periodEnd.getTime() - periodStart.getTime()) / 1000;
    if (plannedProductionTime <= 0) return 0;

    const totalDowntime = downtime.reduce((acc, dt) => {
        const start = new Date(dt.start).getTime();
        const end = dt.end ? new Date(dt.end).getTime() : periodEnd.getTime();
        return acc + ((end - start) / 1000);
    }, 0);

    const runTime = plannedProductionTime - totalDowntime;
    if (runTime <= 0) return 0;

    const availability = runTime / plannedProductionTime;
    
    let totalMoulds = 0;
    let totalGoodMoulds = 0;
    let totalIdealRunTime = 0;

    const relevantMachines = machineIdFilter === 'all' 
        ? allMachines 
        : allMachines.filter(m => m.id === machineIdFilter);
    
    const machineMap = new Map(relevantMachines.map(m => [m.id, m]));

    logs.forEach(log => {
        const machine = machineMap.get(log.machineId);
        if (machine) {
            const partCount = log.goodMoulds + log.rejectedMoulds;
            totalMoulds += partCount;
            totalGoodMoulds += log.goodMoulds;
            totalIdealRunTime += partCount * machine.idealCycleTime;
        }
    });

    const performance = totalIdealRunTime / runTime;
    const quality = totalMoulds > 0 ? totalGoodMoulds / totalMoulds : 0;

    // Performance can exceed 100% if cycles are faster than ideal. Cap it at 1 for OEE calculation.
    return availability * Math.min(1, performance) * quality;
};
