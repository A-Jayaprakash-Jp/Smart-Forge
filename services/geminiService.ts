import { GoogleGenAI, Type } from "@google/genai";
import { ProductionData, Machine, User, AiAssistantMessage, MaintenanceTask, MachineAlert, ProductionLog, IncidentLog, DowntimeEvent, SlagReuseIdea, QualityDocument, Shift, AiDmmParameterReport, AiDailyProductionPerformanceReport, AiNcrReport, AiSettingAdjustmentReport, AiDisaMachineChecklistReport, AiRorVerificationReport, AiDailyPerformanceMonitoringReport, AiWeeklyPerformanceMonitoringReport, AiExecutiveSummaryReport } from '../types';

let ai: GoogleGenAI | null = null;
let isConfigured = false; 

if (process.env.API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        isConfigured = true;
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI. Please check your API key.", e);
    }
} else {
    console.warn("AI features are running in MOCK MODE. Please configure your API_KEY for full functionality.");
}

const isAIEnabled = () => isConfigured && !!ai;

type ReportContext = {
    user: User;
    productionLogs: ProductionLog[];
    downtimeEvents: DowntimeEvent[];
    incidents: IncidentLog[];
    qualityDocs: QualityDocument[];
    machines: Machine[];
    maintenanceTasks: MaintenanceTask[];
    machineAlerts: MachineAlert[];
    shifts?: Shift[];
    filters: {
        startDate: string;
        endDate: string;
        machineId: string;
    };
};

const getMockRecyclingSuggestion = (material: string, defect: string): string => {
    return `For a rejected **${material}** part with a **${defect}** defect, consider the following (MOCK RESPONSE):\n\n1.  **Remelt:** This is the most common option. The part can be added back to the furnace charge. For ${material}, a ratio of up to 20% scrap-to-virgin material is typically safe without affecting the final chemistry.\n\n2.  **Down-cycling:** If the alloy chemistry is compromised, the material can be used for less critical components with wider tolerance ranges.\n\n3.  **Check Sand System:** Since the defect is '${defect}', inspect the sand preparation system for contaminants or incorrect composition before the next run.`;
};

const logListParseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            goodMoulds: { type: Type.INTEGER, description: "Total count of successfully produced moulds." },
            rejectedMoulds: { type: Type.INTEGER, description: "Total count of rejected moulds." },
            jobOrderNumber: { type: Type.STRING, description: "The job or work order number." },
            partId: { type: Type.STRING, description: "The identifier for the part produced." },
            batchNumber: { type: Type.STRING, description: "The batch number for the run." },
        },
    }
};

export const getRecyclingSuggestion = async (material: string, defect: string): Promise<string> => {
    if (!isAIEnabled()) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return getMockRecyclingSuggestion(material, defect);
    }
    const prompt = `As a foundry metallurgist, provide concise, actionable advice for an operator on how to recycle a rejected part. Material: ${material}, Defect: ${defect}. Provide a short, bulleted list of recommendations.`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text ?? "No suggestion could be generated.";
    } catch (e: any) {
        console.error("Error generating recycling suggestion:", e);
        throw new Error("Could not retrieve AI suggestion.");
    }
};

export const parseLogFile = async (fileContent: string, mimeType: string): Promise<Partial<ProductionLog>[]> => {
    if (!isAIEnabled()) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return Promise.resolve([{ goodMoulds: 142, rejectedMoulds: 8, jobOrderNumber: 'JOB-MOCK-1' }]);
    }
    const prompt = `Analyze the provided image or text of a production log sheet. Extract all data points accurately for each entry: good moulds, rejected moulds, job order number, part ID, batch number. Return a single, valid JSON array of log objects.`;
    const contents = mimeType.startsWith('image/') 
        ? { parts: [{ inlineData: { mimeType, data: fileContent } }, { text: prompt }] }
        : `${prompt}\n\nFile content:\n---\n${fileContent.substring(0, 8000)}\n---`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: contents, config: { responseMimeType: "application/json", responseSchema: logListParseSchema } });
        const jsonText = response.text;
        if (!jsonText) throw new Error("AI returned an empty response.");
        return JSON.parse(jsonText.trim());
    } catch (e: any) {
        console.error("Error processing log file:", e);
        throw new Error("AI failed to process the file.");
    }
};

export const parseVoiceCommand = async (command: string): Promise<Partial<ProductionLog>> => {
     if (!isAIEnabled()) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return Promise.resolve({ goodMoulds: 75, rejectedMoulds: 3, batchNumber: 'B-MOCK-VOICE' });
    }
    const prompt = `Extract production log data from the command: "${command}". Examples: "Log 120 good parts and 3 rejects for job 55A." -> { "goodMoulds": 120, "rejectedMoulds": 3, "jobOrderNumber": "55A" }. Return only the JSON object.`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: logListParseSchema.items } });
        const jsonText = response.text;
        if (!jsonText) throw new Error("AI returned an empty response.");
        return JSON.parse(jsonText.trim());
    } catch (e: any) {
        console.error("Error parsing voice command:", e);
        throw new Error("AI could not understand the command.");
    }
};

export const generateTodaysFocus = async (user: User, productionData: ProductionData, maintenanceTasks: MaintenanceTask[], incidentLogs: IncidentLog[]): Promise<string> => {
     if (!isAIEnabled()) return Promise.resolve('Focus on quality and efficiency across all machines.');
    const recentDowntime = productionData.downtime.slice(0,5).map(d => d.reason).join(', ');
    const prompt = `Based on the user's role and recent data for a DISA metal casting foundry, provide a single, concise, and actionable sentence for them to focus on today. User Role: ${user.role}. Recent Downtime Reasons: ${recentDowntime || 'None'}.`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } });
        return response.text ?? "Focus on quality and efficiency across all machines.";
    } catch (e) {
        console.error("Error generating today's focus:", e);
        return "Focus on quality and efficiency across all machines.";
    }
};

export const getSlagReuseIdeas = async (slagComposition: string): Promise<SlagReuseIdea[]> => {
    if (!isAIEnabled()) return Promise.resolve([]);
    const prompt = `You are an expert in materials science. Given the slag description: "${slagComposition}", generate 3-5 innovative reuse ideas. Return a single, valid JSON array of objects.`;
    const slagReuseIdeaSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, application: { type: Type.STRING }, processingRequired: { type: Type.STRING }, potentialBuyers: { type: Type.STRING }, feasibility: { type: Type.OBJECT, properties: { economic: { type: Type.STRING }, logistical: { type: Type.STRING }, environmental: { type: Type.STRING }}}, nextSteps: { type: Type.STRING }}};
    const schema = { type: Type.ARRAY, items: slagReuseIdeaSchema };
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        if (!response.text) throw new Error("AI returned an empty response.");
        return JSON.parse(response.text.trim());
    } catch (e: any) {
        console.error("Error generating slag reuse ideas:", e);
        throw new Error("Failed to generate AI ideas.");
    }
};

const genericApiCall = async (prompt: string, schema: any): Promise<any> => {
    if (!isAIEnabled()) throw new Error("AI features are disabled.");
    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.2 }
        });
        const jsonText = response.text ? response.text.trim() : '';
        if (!jsonText) throw new Error("AI returned an empty report.");
        return JSON.parse(jsonText);
    } catch (e: any) {
        console.error("Error generating AI report:", e);
        throw new Error("Failed to generate AI report.");
    }
};

export const generateDmmParameterReport = async (context: ReportContext): Promise<AiDmmParameterReport> => {
    const prompt = `Generate a "DMM SETTING PARAMETERS CHECK SHEET". Based on production logs, generate realistic parameter readings for a full day across three shifts. Populate all fields in the JSON schema. Machine: ${context.filters.machineId}. Date: ${context.filters.endDate}. Logs: ${JSON.stringify(context.productionLogs.slice(0, 10))}`;
    const rowSchema = { type: Type.OBJECT, properties: { coreMaskThickness: { type: Type.STRING }, coreMaskHeightOutside: { type: Type.STRING }, coreMaskHeightInside: { type: Type.STRING }, sandShotPressure: { type: Type.STRING }, shotTimeCorrection: { type: Type.STRING }, squeezePressure: { type: Type.STRING }, ppStrippingAcceleration: { type: Type.STRING }, ppStrippingDistance: { type: Type.STRING }, spStrippingAcceleration: { type: Type.STRING }, spStrippingDistance: { type: Type.STRING }, mouldThickness: { type: Type.STRING }, closeUpForce: { type: Type.STRING }, remarks: { type: Type.STRING }}};
    const schema = {
        type: Type.OBJECT,
        properties: {
            preamble: { type: Type.OBJECT, properties: { partName: { type: Type.STRING }, partNo: { type: Type.STRING }, date: { type: Type.STRING }, dieNo: { type: Type.STRING }, machine: { type: Type.STRING }, incharge: { type: Type.STRING }}} ,
            shifts: { type: Type.OBJECT, properties: { shift1: { type: Type.ARRAY, items: rowSchema }, shift2: { type: Type.ARRAY, items: rowSchema }, shift3: { type: Type.ARRAY, items: rowSchema }}}
        }
    };
    return genericApiCall(prompt, schema);
}

export const generateDailyProductionPerformanceReport = async (context: ReportContext): Promise<AiDailyProductionPerformanceReport> => {
    const prompt = `Generate a "DAILY PRODUCTION PERFORMANCE (FOUNDRY - B)" report. Use production logs to fill out the report accurately for one shift. Populate all fields in the JSON schema. Data: ${JSON.stringify(context.productionLogs.slice(0, 30))}`;
    const rowSchema = { type: Type.OBJECT, properties: { sNo: { type: Type.INTEGER }, patternCode: { type: Type.STRING }, itemDescription: { type: Type.STRING }, item: { type: Type.STRING }, noOfCavity: { type: Type.INTEGER }, mouldsPoured: { type: Type.INTEGER }, mouldsProduced: { type: Type.INTEGER }, pouredWeightKg: { type: Type.NUMBER }, planned: { type: Type.INTEGER }, unplanned: { type: Type.INTEGER }, total: { type: Type.INTEGER }}};
    const schema = {
        type: Type.OBJECT,
        properties: {
            preamble: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, shift: { type: Type.STRING }}} ,
            summary: { type: Type.OBJECT, properties: { pouredMouldsValue: { type: Type.INTEGER }, gasted: { type: Type.INTEGER }, tonnage: { type: Type.NUMBER }}} ,
            rows: { type: Type.ARRAY, items: rowSchema },
            unplannedReasons: { type: Type.STRING },
            footer: { type: Type.OBJECT, properties: { incharge: { type: Type.STRING }, hof: { type: Type.STRING }, hodProduction: { type: Type.STRING }}}
        }
    };
    return genericApiCall(prompt, schema);
};

export const generateNcrReport = async (context: ReportContext): Promise<AiNcrReport> => {
    const prompt = `Generate a "Non-Conformance Report". Based on incident logs and rejected production logs, create a summary of recent non-conformities. Populate all fields in the JSON schema, including plausible root causes and corrective actions. Data: ${JSON.stringify({incidents: context.incidents, rejectedLogs: context.productionLogs.filter(l => l.rejectedMoulds > 0).slice(0,10)})}`;
    const rowSchema = { type: Type.OBJECT, properties: { sNo: { type: Type.INTEGER }, date: { type: Type.STRING }, nonConformitiesDetails: { type: Type.STRING }, correction: { type: Type.STRING }, rootCause: { type: Type.STRING }, correctiveAction: { type: Type.STRING }, targetDate: { type: Type.STRING }, responsibility: { type: Type.STRING }, sign: { type: Type.STRING }, status: { type: Type.STRING }}};
    const schema = { type: Type.OBJECT, properties: { rows: { type: Type.ARRAY, items: rowSchema }}};
    return genericApiCall(prompt, schema);
};

export const generateSettingAdjustmentReport = async (context: ReportContext): Promise<AiSettingAdjustmentReport> => {
    const prompt = `Generate a "DISA SETTING ADJUSTMENT RECORD". Based on downtime events (especially 'Pattern Change'), create a log of recent adjustments. Populate all fields in the JSON schema. Data: ${JSON.stringify(context.downtimeEvents)}`;
    const rowSchema = { type: Type.OBJECT, properties: { date: { type: Type.STRING }, counterNumber: { type: Type.STRING }, noOfMoulds: { type: Type.STRING }, workCarriedOut: { type: Type.STRING }, preventiveWorkCarried: { type: Type.STRING }, signature: { type: Type.STRING }, remarks: { type: Type.STRING }}};
    const schema = { type: Type.OBJECT, properties: { rows: { type: Type.ARRAY, items: rowSchema }}};
    return genericApiCall(prompt, schema);
};

export const generateDisaMachineChecklistReport = async (context: ReportContext): Promise<AiDisaMachineChecklistReport> => {
    if (!isAIEnabled()) {
        // Return a mock DISA operator check sheet report
        return {
            preamble: { machine: context.machines[0]?.name || 'DISA-D-01', month: 'August 2025' },
            rows: Array.from({ length: 18 }, (_, i) => ({
                slNo: i + 1,
                checkPoint: `Check Point ${i + 1}`,
                checkMethod: 'Visual',
                days: Object.fromEntries(Array.from({ length: 31 }, (_, d) => [d + 1, Math.random() > 0.1 ? 'OK' : 'Not OK']))
            })),
            footer: { operatorSign: 'Operator', hodMouSign: 'HOD' }
        };
    }
    const prompt = `Generate a "DISA MACHINE OPERATOR CHECK SHEET" for a full month. The checklist has 18 points. For each point, generate a daily status ('OK' or 'Not OK', with most being 'OK') for all 31 days. Populate all fields in the JSON schema.`;
    const rowSchema = { type: Type.OBJECT, properties: { slNo: { type: Type.INTEGER }, checkPoint: { type: Type.STRING }, checkMethod: { type: Type.STRING }, days: { type: Type.OBJECT, properties: {}, additionalProperties: { type: Type.STRING }}}};
    const schema = {
        type: Type.OBJECT,
        properties: {
            preamble: { type: Type.OBJECT, properties: { machine: { type: Type.STRING }, month: { type: Type.STRING }}} ,
            rows: { type: Type.ARRAY, items: rowSchema },
            footer: { type: Type.OBJECT, properties: { operatorSign: { type: Type.STRING }, hodMouSign: { type: Type.STRING }}}
        }
    };
    return genericApiCall(prompt, schema);
};

export const generateRorVerificationReport = async (context: ReportContext): Promise<AiRorVerificationReport> => {
    const prompt = `Generate an "ROR PROOF VERIFICATION CHECK LIST". Generate 3-4 realistic rows for error proofing systems in a foundry. For each, provide plausible observations for three shifts. Populate all fields in the JSON schema.`;
    const rowSchema = { type: Type.OBJECT, properties: { errorProofName: { type: Type.STRING }, natureOfErrorProof: { type: Type.STRING }, frequency: { type: Type.STRING }, shift1_Observation: { type: Type.STRING }, shift2_Observation: { type: Type.STRING }, shift3_Observation: { type: Type.STRING }}};
    const schema = {
        type: Type.OBJECT,
        properties: {
            preamble: { type: Type.OBJECT, properties: { line: { type: Type.STRING }, date: { type: Type.STRING }, disa: { type: Type.STRING }}} ,
            rows: { type: Type.ARRAY, items: rowSchema },
            footer: { type: Type.OBJECT, properties: { verifiedBy: { type: Type.STRING }, hod: { type: Type.STRING }}}
        }
    };
    return genericApiCall(prompt, schema);
};

export const generateDailyPerformanceMonitoringReport = async (context: ReportContext): Promise<AiDailyPerformanceMonitoringReport> => {
    if (!isAIEnabled()) {
        // Return a mock EOHS daily monitoring report
        return {
            preamble: {
                department: 'Foundry',
                monitoringLocation: 'Main Shop Floor',
                units: 'mg/m3',
                pcbLimits: '0.5'
            },
            rows: Array.from({ length: 16 }, (_, i) => ({
                monitoringParameter: `Parameter ${i + 1}`,
                days: Object.fromEntries(Array.from({ length: 31 }, (_, d) => [d + 1, (Math.random() * 0.5).toFixed(2)]))
            })),
            footer: { hodSign: 'HOD' }
        };
    }
    const prompt = `Generate an "EOHS - DAILY PERFORMANCE MONITORING REPORT". Generate 15-20 rows of realistic environmental monitoring parameters and fill in plausible daily readings for a full 31-day month. Populate all fields in the JSON schema.`;
    const rowSchema = { type: Type.OBJECT, properties: { monitoringParameter: { type: Type.STRING }, days: { type: Type.OBJECT, properties: {}, additionalProperties: { type: Type.STRING }}}};
    const schema = {
        type: Type.OBJECT,
        properties: {
            preamble: { type: Type.OBJECT, properties: { department: { type: Type.STRING }, monitoringLocation: { type: Type.STRING }, units: { type: Type.STRING }, pcbLimits: { type: Type.STRING }}} ,
            rows: { type: Type.ARRAY, items: rowSchema },
            footer: { type: Type.OBJECT, properties: { hodSign: { type: Type.STRING }}}
        }
    };
    return genericApiCall(prompt, schema);
}

export const generateWeeklyPerformanceMonitoringReport = async (context: ReportContext): Promise<AiWeeklyPerformanceMonitoringReport> => {
    const prompt = `Generate an "EOHS - WEEKLY PERFORMANCE MONITORING REPORT". Generate 10-15 rows of realistic environmental, health, and safety parameters. Fill in plausible weekly readings for three sets of four weeks. Populate all fields in the JSON schema.`;
    const setSchema = { type: Type.OBJECT, properties: { w1: { type: Type.STRING }, w2: { type: Type.STRING }, w3: { type: Type.STRING }, w4: { type: Type.STRING }}};
    const rowSchema = { type: Type.OBJECT, properties: { monitoringLocation: { type: Type.STRING }, monitoringParameter: { type: Type.STRING }, units: { type: Type.STRING }, pcbLimits: { type: Type.STRING }, set1: setSchema, set2: setSchema, set3: setSchema }};
    const schema = {
        type: Type.OBJECT,
        properties: {
            preamble: { type: Type.OBJECT, properties: { department: { type: Type.STRING }, responsibility: { type: Type.STRING }, shiftIncharge: { type: Type.STRING }}} ,
            rows: { type: Type.ARRAY, items: rowSchema },
            footer: { type: Type.OBJECT, properties: { sign: { type: Type.STRING }}}
        }
    };
    return genericApiCall(prompt, schema);
}

export const generateExecutiveSummaryReport = async (context: ReportContext): Promise<AiExecutiveSummaryReport> => {
    const prompt = `Generate an "Executive Summary Report" for the foundry's performance based on the provided data. Summarize production, downtime, quality, and cost. Provide key insights and actionable recommendations. Populate all fields in the JSON schema. Data: ${JSON.stringify({logs: context.productionLogs.slice(0, 50), downtime: context.downtimeEvents.slice(0, 20)})}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            preamble: { type: Type.OBJECT, properties: { reportDate: { type: Type.STRING }, period: { type: Type.STRING }, preparedFor: { type: Type.STRING }}} ,
            summary: { type: Type.STRING },
            keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { metric: { type: Type.STRING }, value: { type: Type.STRING }, change: { type: Type.STRING }}}},
            insights: { type: Type.ARRAY, items: { type: Type.STRING }},
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }}
        }
    };
    return genericApiCall(prompt, schema);
}

export const generateChatResponse = async (history: AiAssistantMessage[], question: string, user: User, productionData: ProductionData, machines: Machine[], incidentLogs: IncidentLog[]): Promise<string> => {
    if (!isAIEnabled()) return Promise.resolve("AI features are currently disabled.");
    const context = `User: ${user.name} (Role: ${user.role}). Assigned Machine: ${machines.find(m => m.id === user.assignedMachineId)?.name || 'None'}. Recent Logs (sample): ${JSON.stringify(productionData.logs.slice(0, 3))}. Recent Downtime (sample): ${JSON.stringify(productionData.downtime.slice(0, 3))}.`;
    const contents = [ ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })), { role: 'user', parts: [{ text: question }] } ];
    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash', contents,
            config: { systemInstruction: `You are DISA Intellect, an expert AI assistant for a metal casting foundry. Use provided context to answer concisely. Context: ${context}` }
        });
        return response.text ?? "I'm sorry, I couldn't process that request.";
    } catch (e: any) {
        console.error("Error generating chat response:", e);
        throw new Error("Could not get a response from the AI.");
    }
};
