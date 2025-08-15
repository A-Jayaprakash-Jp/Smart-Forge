import React, { useState } from 'react';
import Card from './components/common/Card';
import { motion } from 'framer-motion';
import { Cog6ToothIcon, ArrowRightOnRectangleIcon, ExclamationCircleIcon } from './components/common/Icons';

interface AdminLoginScreenProps {
  onAdminLogin: () => void;
}

const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onAdminLogin }) => {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        setTimeout(() => {
            // Use the actual admin credentials from MOCK_USERS
            if ((adminId === 'M301' || adminId === 'admin' || adminId === 'admin01') && password === 'adminpass') {
                onAdminLogin();
            } else {
                setError('Invalid admin ID or password.');
                setIsLoggingIn(false);
            }
        }, 750);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="w-full text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Login</h1>
                        <div className="mb-4 p-3 rounded bg-blue-50 text-blue-900 text-sm border border-blue-200">
                            <div className="font-semibold mb-1">Demo Credentials:</div>
                            <div><span className="font-medium">Employee ID:</span> <span className="font-mono">admin</span></div>
                            <div><span className="font-medium">Password:</span> <span className="font-mono">adminpass</span></div>
                        </div>
                    <p className="mb-6 text-gray-600 dark:text-gray-300">Sign in as system administrator</p>
                    <form onSubmit={handleLogin} className="mt-4 mx-auto space-y-6 text-left">
                        <div>
                            <label htmlFor="adminId" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Admin ID</label>
                            <input
                                id="adminId"
                                type="text"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                placeholder="admin"
                                autoFocus
                                className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                            />
                        </div>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-300"
                            >
                                <ExclamationCircleIcon className="w-5 h-5" />
                                {error}
                            </motion.div>
                        )}
                        <div>
                            <motion.button
                                type="submit"
                                whileTap={{ scale: 0.95 }}
                                disabled={isLoggingIn}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-lg font-bold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700 disabled:bg-gray-500"
                            >
                                {isLoggingIn ? (
                                    <Cog6ToothIcon className="w-6 h-6 animate-spin" />
                                ) : (
                                    <ArrowRightOnRectangleIcon className="w-6 h-6" />
                                )}
                                {isLoggingIn ? 'Signing In...' : 'Sign In'}
                            </motion.button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default AdminLoginScreen;
