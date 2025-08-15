


import React, { useState, useEffect, useRef } from 'react';
import { ProductionLog } from '../../types';
import Modal from '../common/Modal';
import { REJECTION_REASONS } from '../../constants';
import { readFileAsBase64 } from '../../utils/helpers';
import { PhotoIcon, XCircleIcon, ArrowUpTrayIcon, MicrophoneIcon } from '../common/Icons';

interface ProductionLogFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<ProductionLog, 'id' | 'timestamp'>) => void;
    initialData?: Partial<ProductionLog>;
    onOpenFileImporter: () => void;
    onOpenVoiceLogger: () => void;
}

const ProductionLogForm: React.FC<ProductionLogFormProps> = ({ isOpen, onClose, onSubmit, initialData, onOpenFileImporter, onOpenVoiceLogger }) => {
    const [logData, setLogData] = useState<Omit<ProductionLog, 'id' | 'timestamp' | 'rejectionReason' | 'defectPhotoUrl' | 'material' | 'notes'>>({
        machineId: '',
        userId: '',
        shiftId: '',
        goodMoulds: 0,
        rejectedMoulds: 0,
        batchNumber: '',
        jobOrderNumber: '',
        partId: '',
        mouldType: 'Green Sand Vertical',
        actualCycleTime: 0,
        energyConsumedKwh: 0,
        status: 'Pending',
    });
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [customReason, setCustomReason] = useState('');
    const [defectPhotoUrl, setDefectPhotoUrl] = useState<string | undefined>(undefined);
    const [notes, setNotes] = useState('');
    const [material, setMaterial] = useState<'Iron' | 'Steel' | 'Brass' | 'Aluminum'>('Iron');
    const photoUploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLogData({
                machineId: initialData?.machineId || '',
                userId: initialData?.userId || '',
                shiftId: initialData?.shiftId || '',
                goodMoulds: initialData?.goodMoulds || 0,
                rejectedMoulds: initialData?.rejectedMoulds || 0,
                batchNumber: initialData?.batchNumber || '',
                jobOrderNumber: initialData?.jobOrderNumber || '',
                partId: initialData?.partId || '',
                sandMixId: initialData?.sandMixId || '',
                mouldTemperature: initialData?.mouldTemperature,
                mouldType: initialData?.mouldType || 'Green Sand Vertical',
                actualCycleTime: initialData?.actualCycleTime || 0,
                energyConsumedKwh: initialData?.energyConsumedKwh || 0,
                status: initialData?.status || 'Pending',
            });
            // Reset rejection details
            setSelectedReasons([]);
            setCustomReason('');
            setDefectPhotoUrl(undefined);
            setNotes(initialData?.notes || '');
            setMaterial(initialData?.material || 'Iron');
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['goodMoulds', 'rejectedMoulds', 'mouldTemperature', 'actualCycleTime', 'energyConsumedKwh'];
        setLogData(prev => ({ ...prev, [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value }));
    };

    const toggleRejectionReason = (reason: string) => {
        setSelectedReasons(prev =>
            prev.includes(reason)
                ? prev.filter(r => r !== reason)
                : [...prev, reason]
        );
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await readFileAsBase64(e.target.files[0]);
            setDefectPhotoUrl(base64);
        }
    };
    
    const handleSubmit = () => {
        const finalReasons = [...selectedReasons];
        if (customReason.trim() && !finalReasons.includes(customReason.trim())) {
            finalReasons.push(customReason.trim());
        }

        const finalLog = {
            ...logData,
            rejectionReason: finalReasons,
            defectPhotoUrl: defectPhotoUrl,
            notes: notes,
            material: material
        };
        onSubmit(finalLog);
    };

    const isSubmitDisabled = (logData.goodMoulds || 0) === 0 && (logData.rejectedMoulds || 0) === 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log Production Batch">
            <div className="absolute top-6 right-16 flex gap-2">
                 <button onClick={onOpenFileImporter} className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10" title="Import from File">
                    <ArrowUpTrayIcon className="w-6 h-6" />
                </button>
                <button onClick={onOpenVoiceLogger} className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10" title="Log with Voice">
                    <MicrophoneIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto -mr-3 pr-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField label="Job/Order Number" name="jobOrderNumber" value={logData.jobOrderNumber} onChange={handleChange} placeholder="e.g., JOB-12345" />
                    <InputField label="Part ID" name="partId" value={logData.partId} onChange={handleChange} placeholder="e.g., P-01-A" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField label="Good Moulds" name="goodMoulds" type="number" value={logData.goodMoulds} onChange={handleChange} />
                    <InputField label="Rejected Moulds" name="rejectedMoulds" type="number" value={logData.rejectedMoulds} onChange={handleChange} />
                </div>
                
                {logData.rejectedMoulds > 0 && (
                    <div className="p-4 space-y-4 border-2 rounded-lg border-disa-red/30 bg-disa-red/5">
                        <h3 className="font-semibold text-gray-800 dark:text-white">Rejection Details</h3>
                         <div>
                            <h4 className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Select Rejection Reason(s)</h4>
                            <div className="grid grid-cols-2 gap-2 mt-2 md:grid-cols-3">
                                {REJECTION_REASONS.map(reason => (
                                    <button key={reason} onClick={() => toggleRejectionReason(reason)} className={`p-3 text-sm text-center rounded-lg transition-all font-semibold border-2 ${selectedReasons.includes(reason) ? 'bg-disa-red text-white border-disa-red' : 'bg-gray-200/50 dark:bg-black/20 text-gray-700 dark:text-gray-300 border-gray-400/50 dark:border-gray-600/50 hover:border-disa-red hover:text-disa-red dark:hover:border-disa-red'}`}>
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <InputField label="Custom Rejection Reason (Optional)" name="customReason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="e.g., Core Breakage" />
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Add Defect Photo (Optional)</label>
                            <input type="file" accept="image/*" capture="environment" ref={photoUploadRef} onChange={handlePhotoChange} className="hidden" />
                            {defectPhotoUrl ? (
                                <div className="relative group">
                                    <img src={defectPhotoUrl} alt="Defect Preview" className="object-cover w-full h-40 rounded-lg" />
                                    <button onClick={() => setDefectPhotoUrl(undefined)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => photoUploadRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg border-disa-light-border dark:border-disa-dark-border hover:border-disa-accent-blue hover:text-disa-accent-blue text-gray-500 dark:text-gray-400">
                                    <PhotoIcon className="w-8 h-8" />
                                    <span className="font-semibold">Add Photo</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField label="Mould Type" name="mouldType" value={logData.mouldType} onChange={handleChange}>
                        <option>Green Sand Vertical</option>
                        <option>Horizontal Flaskless</option>
                    </SelectField>
                    <InputField label="Actual Cycle Time (s)" name="actualCycleTime" type="number" value={logData.actualCycleTime} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                     <InputField label="Energy Consumed (kWh)" name="energyConsumedKwh" type="number" value={logData.energyConsumedKwh} onChange={handleChange} />
                     <InputField label="Batch Number" name="batchNumber" value={logData.batchNumber} onChange={handleChange} placeholder="Optional, e.g., B240720-01" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                     <SelectField label="Material" name="material" value={material} onChange={(e) => setMaterial(e.target.value as any)}>
                        <option>Iron</option>
                        <option>Steel</option>
                        <option>Brass</option>
                        <option>Aluminum</option>
                    </SelectField>
                    <InputField label="Mould Temperature (°C)" name="mouldTemperature" type="number" value={logData.mouldTemperature} onChange={handleChange} placeholder="Optional, e.g., 150.5" />
                </div>
                <div>
                     <label htmlFor="notes" className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                    <textarea id="notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add any relevant observations..." className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red" />
                </div>
            </div>
            <button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full py-3 mt-6 font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
                Submit Log
            </button>
        </Modal>
    );
};

const InputField: React.FC<{
    label: string, 
    name: string,
    value: any,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    type?: string,
    placeholder?: string,
}> = ({ label, name, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label htmlFor={name} className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <input id={name} name={name} type={type} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red" />
    </div>
);

const SelectField: React.FC<{
    label: string, 
    name: string,
    value: any,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    children: React.ReactNode,
}> = ({ label, name, value, onChange, children }) => (
    <div>
        <label htmlFor={name} className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <select id={name} name={name} value={value} onChange={onChange} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red">
            {children}
        </select>
    </div>
);


export default ProductionLogForm;