

import React, { useState } from 'react';
import Card from '../components/common/Card';
import { SparklesIcon, RecycleIcon, ArrowPathIcon } from '../components/common/Icons';
import { SlagReuseIdea } from '../types';
import { getSlagReuseIdeas } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

const InnovationHubView: React.FC = () => {
    const [slagInput, setSlagInput] = useState('Standard iron casting furnace slag, primarily composed of silicates and oxides.');
    const [ideas, setIdeas] = useState<SlagReuseIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateIdeas = async () => {
        if (!slagInput.trim()) {
            setError('Please provide some details about the slag.');
            return;
        }
        setIsLoading(true);
        setError('');
        setIdeas([]);

        try {
            const result = await getSlagReuseIdeas(slagInput);
            if(result && result.length > 0) {
                setIdeas(result);
            } else {
                setError('The AI could not generate any ideas for this input. Please try being more specific.');
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred while communicating with the AI. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <div className="text-center">
                    <RecycleIcon className="w-16 h-16 mx-auto text-disa-accent-green" />
                    <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Innovation Hub: Circular Economy</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Discover innovative and sustainable reuse applications for industrial by-products like furnace slag.
                    </p>
                </div>

                <div className="mt-8">
                    <label htmlFor="slagInput" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">
                        Describe the Slag Composition or Type
                    </label>
                    <textarea
                        id="slagInput"
                        value={slagInput}
                        onChange={e => setSlagInput(e.target.value)}
                        rows={3}
                        className="w-full p-3 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                        placeholder="e.g., High in iron oxide, from a gray iron foundry..."
                    />
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={handleGenerateIdeas}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-3 px-6 py-3 mx-auto font-bold text-white transition-colors duration-300 rounded-lg bg-gradient-to-r from-disa-accent-purple to-disa-accent-blue hover:opacity-90 disabled:from-gray-500"
                    >
                        {isLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                        {isLoading ? 'Thinking...' : 'Generate Reuse Ideas'}
                    </button>
                </div>
                 {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            </Card>
            
            <AnimatePresence>
            {ideas.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                >
                    {ideas.map((idea, index) => (
                        <IdeaCard key={index} idea={idea} />
                    ))}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};


const IdeaCard: React.FC<{ idea: SlagReuseIdea }> = ({ idea }) => {
    
    const FeasibilityPill: React.FC<{label: string, level: 'High' | 'Medium' | 'Low'}> = ({ label, level }) => {
        const colors = {
            High: 'bg-green-500/20 text-green-600 dark:text-green-400',
            Medium: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
            Low: 'bg-red-500/20 text-red-600 dark:text-red-400',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[level]}`}>{label}: {level}</span>;
    };
    
    return (
        <Card>
            <h3 className="text-xl font-bold text-disa-accent-blue">{idea.title}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InfoItem label="Application" value={idea.application} />
                <InfoItem label="Processing Required" value={idea.processingRequired} />
                <InfoItem label="Potential Buyers" value={idea.potentialBuyers} />
                <InfoItem label="Next Steps" value={idea.nextSteps} />
            </div>
            
            <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Feasibility</p>
                <div className="flex flex-wrap gap-2 mt-1">
                    <FeasibilityPill label="Economic" level={idea.feasibility.economic} />
                    <FeasibilityPill label="Logistical" level={idea.feasibility.logistical} />
                    <FeasibilityPill label="Environmental" level={idea.feasibility.environmental} />
                </div>
            </div>
        </Card>
    );
};

const InfoItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-gray-800 dark:text-white">{value}</p>
    </div>
);

export default InnovationHubView;