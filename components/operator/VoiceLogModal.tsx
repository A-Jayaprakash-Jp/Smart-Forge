

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { ProductionLog } from '../../types';
import { parseVoiceCommand } from '../../services/geminiService';
import { MicrophoneIcon, ArrowPathIcon, ExclamationCircleIcon } from '../common/Icons';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';

interface VoiceLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (parsedData: Partial<ProductionLog>) => void;
}

const VoiceLogModal: React.FC<VoiceLogModalProps> = ({ isOpen, onClose, onComplete }) => {
    const { text, isListening, startListening, stopListening, hasRecognitionSupport, error: recognitionError } = useVoiceRecognition();
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !isListening) {
            startListening();
        }
        return () => {
            if(isListening) stopListening();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const processCommand = async () => {
        if (!text) return;
        setIsLoading(true);
        setApiError(null);
        try {
            const result = await parseVoiceCommand(text);
            if (result && Object.keys(result).length > 0) {
                onComplete(result);
                onCloseAndReset();
            } else {
                throw new Error("AI could not understand the command. Please be more specific or enter manually.");
            }
        } catch (e: any) {
            setApiError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const onCloseAndReset = () => {
        stopListening();
        setApiError(null);
        setIsLoading(false);
        onClose();
    };

    const displayError = apiError || recognitionError;

    return (
        <Modal isOpen={isOpen} onClose={onCloseAndReset} title="Log via Voice Command">
            <div className="space-y-4 text-center">
                <div className={`relative w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-disa-red/20' : 'bg-gray-500/20'}`}>
                    <MicrophoneIcon className={`w-16 h-16 transition-colors ${isListening ? 'text-disa-red' : 'text-gray-500'}`} />
                    {isListening && <div className="absolute inset-0 border-4 rounded-full border-disa-red animate-ping"></div>}
                </div>

                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {isListening ? "Listening..." : "Click microphone to start"}
                </p>

                <p className="min-h-[5rem] p-3 rounded-lg bg-gray-100 dark:bg-black/20 text-gray-700 dark:text-gray-300">
                    {text || "Say something like: 'Log 150 good parts and 5 rejects.'"}
                </p>

                {!hasRecognitionSupport && (
                    <div className="flex items-center gap-2 p-3 text-sm text-yellow-700 bg-yellow-100 rounded-lg dark:bg-yellow-900/20 dark:text-yellow-300">
                        <ExclamationCircleIcon className="w-5 h-5" /> Your browser does not support voice recognition.
                    </div>
                )}

                {displayError && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-300">
                        <ExclamationCircleIcon className="w-5 h-5" /> {displayError}
                    </div>
                )}
                
                <div className="flex justify-center gap-4 pt-4">
                    <button onClick={isListening ? stopListening : startListening} className="px-4 py-2 font-semibold text-gray-800 transition-colors bg-gray-300 rounded-lg dark:text-white dark:bg-gray-600 hover:bg-gray-400">
                        {isListening ? 'Stop' : 'Start'} Listening
                    </button>
                    <button onClick={processCommand} disabled={isLoading || !text} className="flex items-center justify-center gap-2 px-4 py-2 font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-500">
                        {isLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : 'Process Command'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default VoiceLogModal;