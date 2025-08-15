import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon } from './Icons';
import { useProductionData } from '../../hooks/useProductionData';
import { useUsers } from '../../hooks/useUsers';

interface GlobalSearchProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setCurrentPage: (page: string) => void;
}

type SearchResult = {
    type: string;
    id: string;
    title: string;
    subtitle: string;
    page: string;
};

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, setIsOpen, setCurrentPage }) => {
    const { machines, productionOrders, inventoryItems, tools } = useProductionData();
    const { users } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');

    const allData = useMemo(() => [
        ...machines.map(m => ({ type: 'Machine', id: m.id, title: m.name, subtitle: m.location, page: 'live_monitoring' })),
        ...productionOrders.map(p => ({ type: 'Order', id: p.id, title: p.id, subtitle: p.partDescription, page: 'production' })),
        ...inventoryItems.map(i => ({ type: 'Inventory', id: i.id, title: i.name, subtitle: `In stock: ${i.stockLevel} ${i.unit}`, page: 'inventory' })),
        ...tools.map(t => ({ type: 'Tool', id: t.id, title: t.name, subtitle: `S/N: ${t.serialNumber}`, page: 'tool_management' })),
        ...users.map(u => ({ type: 'User', id: u.uid, title: u.name, subtitle: u.role, page: 'team' })),
    ], [machines, productionOrders, inventoryItems, tools, users]);

    const filteredResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const lowerCaseTerm = searchTerm.toLowerCase();
        return allData.filter(item => 
            item.title.toLowerCase().includes(lowerCaseTerm) || 
            item.subtitle.toLowerCase().includes(lowerCaseTerm)
        ).slice(0, 10);
    }, [searchTerm, allData]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);
    
    const handleSelectResult = (result: SearchResult) => {
        setCurrentPage(result.page);
        setIsOpen(false);
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] bg-black/70 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: -20 }}
                        className="w-full max-w-2xl bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute w-6 h-6 text-gray-400 -translate-y-1/2 top-1/2 left-4" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                                placeholder="Search for machines, orders, users..."
                                className="w-full p-4 pl-14 text-lg bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none"
                            />
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                           {filteredResults.length > 0 ? (
                                <ul>
                                    {filteredResults.map(result => (
                                        <li key={`${result.type}-${result.id}`}>
                                            <button onClick={() => handleSelectResult(result)} className="flex items-center w-full gap-4 px-4 py-3 text-left transition-colors hover:bg-disa-accent-blue/10">
                                                <span className="px-2 py-1 text-xs font-bold text-white rounded-md bg-disa-red">{result.type}</span>
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{result.title}</p>
                                                    <p className="text-sm text-gray-500">{result.subtitle}</p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                           ) : (
                                searchTerm.trim() && <p className="p-10 text-center text-gray-500">No results found for "{searchTerm}"</p>
                           )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalSearch;