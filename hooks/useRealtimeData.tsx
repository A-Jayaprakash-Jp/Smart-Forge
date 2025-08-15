import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Machine, Anomaly } from '../types';
import { MOCK_MACHINES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

interface RealtimeDataContextType {
    liveMachines: Machine[];
    anomalies: Anomaly[];
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

export const RealtimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [liveMachines, setLiveMachines] = useState<Machine[]>(MOCK_MACHINES);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

    const checkAnomalies = useCallback((machine: Machine) => {
        const newAnomalies: Anomaly[] = [];
        const { id, name, operatingParameters: params, liveData: data } = machine;

        // Moulding Pressure
        if (data.mouldingPressure > params.mouldingPressure.critical_max) {
            newAnomalies.push({ id: uuidv4(), machineId: id, machineName: name, parameter: 'Moulding Pressure', value: data.mouldingPressure, expected: `< ${params.mouldingPressure.critical_max}`, severity: 'Critical', timestamp: new Date() });
        } else if (data.mouldingPressure > params.mouldingPressure.max || data.mouldingPressure < params.mouldingPressure.min) {
            newAnomalies.push({ id: uuidv4(), machineId: id, machineName: name, parameter: 'Moulding Pressure', value: data.mouldingPressure, expected: `${params.mouldingPressure.min}-${params.mouldingPressure.max}`, severity: 'Warning', timestamp: new Date() });
        }
        
        // Sand Temperature
        if (data.sandTemperature > params.sandTemperature.critical_max) {
            newAnomalies.push({ id: uuidv4(), machineId: id, machineName: name, parameter: 'Sand Temperature', value: data.sandTemperature, expected: `< ${params.sandTemperature.critical_max}`, severity: 'Critical', timestamp: new Date() });
        } else if (data.sandTemperature > params.sandTemperature.max || data.sandTemperature < params.sandTemperature.min) {
            newAnomalies.push({ id: uuidv4(), machineId: id, machineName: name, parameter: 'Sand Temperature', value: data.sandTemperature, expected: `${params.sandTemperature.min}-${params.sandTemperature.max}`, severity: 'Warning', timestamp: new Date() });
        }

        // Cycle Time Variance
        if (data.cycleTimeVariancePercent > params.cycleTimeVariancePercent.critical_max) {
            newAnomalies.push({ id: uuidv4(), machineId: id, machineName: name, parameter: 'Cycle Time Variance', value: data.cycleTimeVariancePercent, expected: `< ${params.cycleTimeVariancePercent.critical_max}%`, severity: 'Critical', timestamp: new Date() });
        } else if (data.cycleTimeVariancePercent > params.cycleTimeVariancePercent.max) {
            newAnomalies.push({ id: uuidv4(), machineId: id, machineName: name, parameter: 'Cycle Time Variance', value: data.cycleTimeVariancePercent, expected: `< ${params.cycleTimeVariancePercent.max}%`, severity: 'Warning', timestamp: new Date() });
        }

        return newAnomalies;
    }, []);
    
    useEffect(() => {
        const interval = setInterval(() => {
            let allNewAnomalies: Anomaly[] = [];

            setLiveMachines(prevMachines => {
                return prevMachines.map(machine => {
                    if (machine.status !== 'Running') {
                        return machine; // Don't update non-running machines
                    }

                    const params = machine.operatingParameters;
                    const pressureFuzz = (params.mouldingPressure.max - params.mouldingPressure.min) * 0.1;
                    const tempFuzz = (params.sandTemperature.max - params.sandTemperature.min) * 0.1;

                    // Simulate new data
                    const newPressure = params.mouldingPressure.ideal + (Math.random() - 0.5) * 2 * pressureFuzz;
                    const newTemp = params.sandTemperature.ideal + (Math.random() - 0.5) * 2 * tempFuzz;
                    const newVariance = Math.random() * (params.cycleTimeVariancePercent.max * 0.8);
                    
                    const updatedMachine = { ...machine, liveData: { mouldingPressure: newPressure, sandTemperature: newTemp, cycleTimeVariancePercent: newVariance }};

                    // Introduce random spikes to trigger anomalies
                    if (Math.random() > 0.98) {
                        updatedMachine.liveData.mouldingPressure *= (1 + (Math.random() * 0.4)); // up to 40% spike
                    }
                    if (Math.random() > 0.98) {
                        updatedMachine.liveData.sandTemperature *= (1 + (Math.random() * 0.3)); // up to 30% spike
                    }
                    if (Math.random() > 0.95) {
                        updatedMachine.liveData.cycleTimeVariancePercent = params.cycleTimeVariancePercent.max + Math.random() * 5;
                    }
                    
                    allNewAnomalies.push(...checkAnomalies(updatedMachine));
                    return updatedMachine;
                });
            });

            if (allNewAnomalies.length > 0) {
                 setAnomalies(prev => [...allNewAnomalies, ...prev].slice(0, 50)); // Keep max 50 anomalies
            }
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [checkAnomalies]);


    return (
        <RealtimeDataContext.Provider value={{ liveMachines, anomalies }}>
            {children}
        </RealtimeDataContext.Provider>
    );
};

export const useRealtimeData = (): RealtimeDataContextType => {
    const context = useContext(RealtimeDataContext);
    if (context === undefined) {
        throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
    }
    return context;
};