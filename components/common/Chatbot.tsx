import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PaperAirplaneIcon, ArrowPathIcon } from './Icons';
import { useProductionData } from '../../hooks/useProductionData';
import { generateChatResponse } from '../../services/geminiService';
import { User, AiAssistantMessage } from '../../types';

interface ChatbotProps {
    user: User;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ user, isOpen, setIsOpen }) => {
    const { data, machines, incidentLogs } = useProductionData();
    
    const initialMessage: AiAssistantMessage = { role: 'model', text: `Hi ${user.name}! I'm DISA Intellect, your AI assistant. How can I help you today?` };

    const [messages, setMessages] = useState<AiAssistantMessage[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if(isOpen){
            scrollToBottom();
        }
    }, [messages, isOpen]);
    
    const handleRefresh = () => {
        setMessages([initialMessage]);
        setInput('');
        setIsLoading(false);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: AiAssistantMessage = { role: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await generateChatResponse(newMessages, currentInput, user, data, machines, incidentLogs);
            const modelMessage: AiAssistantMessage = { role: 'model', text: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error: any) {
            const errorMessage: AiAssistantMessage = { role: 'model', text: error.message || 'Sorry, I ran into an issue. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed bottom-6 right-4 sm:right-6 md:right-8 w-[calc(100%-2rem)] max-w-md h-[70vh] max-h-[600px] z-40"
                >
                    <div className="flex flex-col h-full rounded-2xl glass-card shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                            <h3 className="font-bold text-gray-900 dark:text-white">DISA Intellect Assistant</h3>
                            <div>
                                <button onClick={handleRefresh} title="Clear conversation" className="p-1 mr-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10">
                                    <ArrowPathIcon className="w-6 h-6" />
                                </button>
                                <button onClick={() => setIsOpen(false)} title="Close chat" className="p-1 text-gray-500 rounded-full dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        {/* Messages */}
                        <div className="flex-grow p-4 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-disa-red flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">AI</div>}
                                        <div
                                            className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                                                msg.role === 'user' ? 'bg-disa-accent-blue text-white rounded-br-none' : 'bg-gray-200 dark:bg-black/20 text-gray-800 dark:text-white rounded-bl-none'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                     <div className="flex items-end gap-2 justify-start">
                                        <div className="w-8 h-8 rounded-full bg-disa-red flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">AI</div>
                                        <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-gray-200 dark:bg-black/20 text-gray-800 dark:text-white rounded-bl-none">
                                            <div className="flex gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-0"></span>
                                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></span>
                                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                        {/* Input */}
                        <div className="p-4 border-t border-white/10 flex-shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask a question..."
                                    className="w-full py-3 pl-4 pr-12 text-gray-900 bg-gray-100 border-2 rounded-full dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-2 focus:ring-disa-red focus:border-disa-red"
                                />
                                <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute top-1/2 right-2 -translate-y-1/2 p-2.5 rounded-full bg-disa-accent-blue text-white transition-colors hover:bg-blue-500 disabled:bg-gray-500">
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Chatbot;