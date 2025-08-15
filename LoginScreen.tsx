import React, { useState } from 'react';
import { User } from './types';
import { useUsers } from './hooks/useUsers';
import Card from './components/common/Card';
import { motion } from 'framer-motion';
import { useAppSettings } from './hooks/useAppSettings';
import { Cog6ToothIcon, ArrowRightOnRectangleIcon, ExclamationCircleIcon } from './components/common/Icons';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { users, loading } = useUsers();
    const { appName, appLogo } = useAppSettings();
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        setTimeout(() => {
            if (!employeeId || !password) {
                setError('Please enter your Employee ID and password.');
                setIsLoggingIn(false);
                return;
            }

            // Find user by employeeId and password (case-insensitive for employeeId)
            const user = users.find(u => u.employeeId.toLowerCase() === employeeId.toLowerCase() && u.password === password);

            if (user) {
                onLogin(user);
            } else {
                setError('Invalid Employee ID or password.');
                setIsLoggingIn(false);
            }
        }, 750);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Cog6ToothIcon className="w-16 h-16 text-disa-red animate-spin" />
                <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">Loading User Profiles...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="w-full text-center">
                    {appLogo && <img src={appLogo} alt="App Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Sign in to access the {appName}
                    </p>
                        {/* Demo credentials removed for production */}
                    
                    <form onSubmit={handleLogin} className="mt-8 mx-auto space-y-6 text-left">
                        <div>
                            <label htmlFor="employeeId" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Employee ID</label>
                            <input
                                id="employeeId"
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                placeholder="e.g., E101"
                                autoFocus
                                className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"  className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
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

export default LoginScreen;