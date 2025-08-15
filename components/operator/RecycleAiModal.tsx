import React, { useState } from 'react';
import Modal from '../common/Modal';
import { getRecyclingSuggestion } from '../../services/geminiService';
import { REJECTION_REASONS } from '../../constants';
import { SparklesIcon, ArrowPathIcon } from '../common/Icons';

interface RecycleAiModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RecycleAiModal: React.FC<RecycleAiModalProps> = ({ isOpen, onClose }) => {
    const [material, setMaterial] = useState<'Iron' | 'Steel' | 'Brass' | 'Aluminum'>('Iron');
    const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGetSuggestion = async () => {
        setIsLoading(true);
        setError('');
        setSuggestion('');
        try {
            const result = await getRecyclingSuggestion(material, rejectionReason);
            setSuggestion(result);
        } catch (e: any) {
            setError(e.message || 'An error occurred while fetching the suggestion.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Mold Recycling Assistant">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto -mr-3 pr-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Select the material and defect type to get an AI-powered recommendation on how to best recycle or rework the rejected part.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField label="Material" value={material} onChange={e => setMaterial(e.target.value as any)}>
                        <option>Iron</option>
                        <option>Steel</option>
                        <option>Brass</option>
                        <option>Aluminum</option>
                    </SelectField>
                    <SelectField label="Rejection Reason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}>
                        {REJECTION_REASONS.map(reason => <option key={reason}>{reason}</option>)}
                    </SelectField>
                </div>
                <button
                    onClick={handleGetSuggestion}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-500"
                >
                    {isLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                    {isLoading ? 'Generating...' : 'Get Suggestion'}
                </button>

                {suggestion && (
                    <div className="p-4 mt-4 space-y-2 prose prose-sm dark:prose-invert max-w-none rounded-lg bg-gray-100 dark:bg-black/20">
                        <h4 className="font-bold">Recommendation:</h4>
                        <p style={{whiteSpace: 'pre-wrap'}}>{suggestion}</p>
                    </div>
                )}
                {error && <p className="text-red-500">{error}</p>}
            </div>
        </Modal>
    );
};

const SelectField: React.FC<{ label: string, value: any, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <select value={value} onChange={onChange} className="w-full p-3.5 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border">
            {children}
        </select>
    </div>
);


export default RecycleAiModal;