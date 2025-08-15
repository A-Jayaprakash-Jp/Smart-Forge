import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { ProductionLog, User } from '../../types';
import { parseLogFile } from '../../services/geminiService';
import { ArrowUpTrayIcon, ArrowPathIcon, ExclamationCircleIcon, CheckCircleIcon, CameraIcon } from '../common/Icons';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface OcrLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (parsedData: Partial<ProductionLog>[]) => void;
    user: User;
}

const OcrLogModal: React.FC<OcrLogModalProps> = ({ isOpen, onClose, onComplete, user }) => {
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [preview, setPreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedLogs, setParsedLogs] = useState<Partial<ProductionLog>[] | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setParsedLogs(null);

        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setFileContent(base64.split(',')[1]); 
                setPreview(base64); 
            };
            reader.readAsDataURL(selectedFile);
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target?.result;
                    if (typeof content === 'string') {
                        setFileContent(content);
                        setPreview(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
                    } else if (content instanceof ArrayBuffer) {
                        const workbook = XLSX.read(content, { type: 'buffer' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
                        setFileContent(csvContent);
                        setPreview(csvContent.substring(0, 500) + (csvContent.length > 500 ? '...' : ''));
                    }
                } catch (err) {
                    setError("Could not read or parse the file.");
                }
            };
            if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                 reader.readAsArrayBuffer(selectedFile);
            } else { 
                 reader.readAsText(selectedFile);
            }
        }
    };
    
    const handleCameraScan = async () => {
        if (!Capacitor.isPluginAvailable('Camera')) {
            setError("Camera is not available on this device.");
            return;
        }
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera
            });

            if (image.base64String) {
                setFile(null);
                const mimeType = `image/${image.format}`;
                setFileContent(image.base64String);
                setPreview(`data:${mimeType};base64,${image.base64String}`);
                setFile(new File([], "camera_scan.jpg", { type: mimeType }));
            }
        } catch (e) {
            console.error("Camera error:", e);
            setError("Could not access the camera. Please ensure permissions are granted.");
        }
    };

    const processFile = async () => {
        if (!file || !fileContent) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await parseLogFile(fileContent, file.type);
            if (result && result.length > 0) {
                setParsedLogs(result);
            } else {
                throw new Error("AI could not extract any log data. Please check the file format or content.");
            }
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmImport = () => {
        if (parsedLogs) {
            const logsWithUserInfo = parsedLogs.map(log => ({
                ...log,
                userId: log.userId || user.uid,
                machineId: log.machineId || user.assignedMachineId || '',
                shiftId: log.shiftId || user.shiftId || '',
            }));
            onComplete(logsWithUserInfo);
        }
        onCloseAndReset();
    };

    const onCloseAndReset = () => {
        setFile(null);
        setFileContent('');
        setPreview('');
        setIsLoading(false);
        setError(null);
        setParsedLogs(null);
        onClose();
    };
    
    const renderContent = () => {
        if (parsedLogs) {
            return (
                <div className="text-center">
                    <CheckCircleIcon className="w-16 h-16 mx-auto text-disa-accent-green" />
                    <h3 className="mt-4 text-xl font-bold">Parsing Complete</h3>
                    <p className="mt-2">Successfully extracted <span className="font-bold">{parsedLogs.length}</span> log entries.</p>
                    <p className="text-sm text-gray-500">Do you want to continue? The data will be populated in the log form for your review before submitting.</p>
                     <div className="flex justify-center gap-4 mt-6">
                        <button onClick={onCloseAndReset} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">
                            Cancel
                        </button>
                        <button onClick={handleConfirmImport} className="flex items-center justify-center gap-2 px-4 py-2 font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500">
                            Continue
                        </button>
                    </div>
                </div>
            );
        }

        if (file) {
            return (
                <div>
                    {file.type.startsWith('image/') ? (
                        <img src={preview} alt="Preview" className="object-contain w-full h-48 mx-auto rounded-lg bg-black/20" />
                    ) : (
                        <pre className="p-2 text-xs text-left bg-gray-100 rounded-lg max-h-48 overflow-y-auto dark:bg-black/20">{preview}</pre>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 p-3 mt-2 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-300">
                            <ExclamationCircleIcon className="w-5 h-5" /> {error}
                        </div>
                    )}
                    <div className="flex justify-center gap-4 mt-4">
                        <button onClick={() => { setFile(null); setPreview(''); setFileContent(''); }} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">
                            Change File
                        </button>
                        <button onClick={processFile} disabled={isLoading} className="flex items-center justify-center gap-2 px-4 py-2 font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-500">
                            {isLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : 'Process with AI'}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleCameraScan} className="flex flex-col items-center justify-center h-32 gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer border-disa-light-border dark:border-disa-dark-border hover:border-disa-accent-blue hover:text-disa-accent-blue text-gray-500 dark:text-gray-400">
                    <CameraIcon className="w-10 h-10" />
                    <span className="font-semibold">Scan with Camera</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center h-32 gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer border-disa-light-border dark:border-disa-dark-border hover:border-disa-accent-blue hover:text-disa-accent-blue text-gray-500 dark:text-gray-400">
                    <ArrowUpTrayIcon className="w-10 h-10" />
                    <span className="font-semibold">Upload from File</span>
                    <p className="text-xs">Images, CSV, Excel</p>
                </button>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onCloseAndReset} title="Import Production Logs">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.csv,.xlsx,.xls,.txt" />
            <motion.div
                key={file ? 'preview' : 'upload'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {renderContent()}
            </motion.div>
        </Modal>
    );
};

export default OcrLogModal;