import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../hooks/useSettings';
import Card from '../components/common/Card';
import { SunIcon, MoonIcon, UserCircleIcon, PaintBrushIcon, ArrowUpOnSquareIcon, BellIcon } from '../components/common/Icons';
import { User, FontPreference, NotificationPreferences } from '../types';
import { FONT_OPTIONS } from '../constants';
import { readFileAsBase64 } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onCurrentUserUpdate: (user: User) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onCurrentUserUpdate }) => {
    const { theme, setTheme } = useSettings();
    const [name, setName] = useState(user.name);
    const [biodata, setBiodata] = useState(user.biodata || '');
    const [profilePic, setProfilePic] = useState(user.profilePicUrl || '');
    const [font, setFont] = useState<FontPreference>(user.fontPreference || 'Inter');
    const [fontSize, setFontSize] = useState(user.fontSize || 16);
    const [notifications, setNotifications] = useState<NotificationPreferences>(
        user.notificationPreferences || { email: true, push: true, desktop: true, sms: false }
    );
    
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    
    const profilePicInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(user.name);
        setProfilePic(user.profilePicUrl || '');
        setFont(user.fontPreference || 'Inter');
        setFontSize(user.fontSize || 16);
        setBiodata(user.biodata || '');
        setNotifications(user.notificationPreferences || { email: true, push: true, desktop: true, sms: false });
    }, [user]);
    
    const handleProfilePicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await readFileAsBase64(e.target.files[0]);
            setProfilePic(base64);
        }
    };
    
    const handleSaveChanges = () => {
        const updatedUser: User = {
            ...user,
            name,
            biodata,
            profilePicUrl: profilePic,
            fontPreference: font,
            fontSize: fontSize,
            notificationPreferences: notifications
        };
        onUpdateUser(updatedUser);
        onCurrentUserUpdate(updatedUser);

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };
    
    const isSettingsChanged = user.name !== name || 
                      (user.profilePicUrl || '') !== profilePic || 
                      (user.fontPreference || 'Inter') !== font || 
                      (user.fontSize || 16) !== fontSize || 
                      (user.biodata || '') !== biodata ||
                      JSON.stringify(user.notificationPreferences || {}) !== JSON.stringify(notifications);

    const TabButton: React.FC<{id: string, label: string, icon: React.ElementType}> = ({id, label, icon: Icon}) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors ${activeTab === id ? 'text-disa-red border-b-2 border-disa-red' : 'text-gray-500 hover:text-disa-red border-b-2 border-transparent'}`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    const NotificationToggle: React.FC<{
        id: keyof NotificationPreferences,
        label: string,
        description: string
    }> = ({ id, label, description }) => (
         <div className="flex items-center justify-between p-4 transition-colors rounded-lg bg-gray-500/5 hover:bg-gray-500/10">
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">{label}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
            <button
                onClick={() => setNotifications(prev => ({...prev, [id]: !prev[id]}))}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${notifications[id] ? 'bg-disa-red' : 'bg-gray-400 dark:bg-gray-600'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${notifications[id] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <div className="flex flex-wrap border-b border-disa-light-border dark:border-disa-dark-border">
                    <TabButton id="profile" label="Profile" icon={UserCircleIcon} />
                    <TabButton id="appearance" label="Appearance" icon={PaintBrushIcon} />
                    <TabButton id="notifications" label="Notifications" icon={BellIcon} />
                </div>
                <div className="pt-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="flex flex-col items-center col-span-1 gap-4">
                                        <img src={profilePic || `https://i.pravatar.cc/150?u=${user.employeeId}`} alt="Profile" className="object-cover w-32 h-32 rounded-full" />
                                        <input type="file" accept="image/*" ref={profilePicInputRef} onChange={handleProfilePicFileChange} className="hidden"/>
                                        <button onClick={() => profilePicInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-lg text-gray-800 dark:text-white bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40">
                                        <ArrowUpOnSquareIcon className="w-4 h-4" /> Upload Picture
                                        </button>
                                    </div>
                                    <div className="space-y-6 md:col-span-2">
                                        <div>
                                            <label htmlFor="employeeId" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Employee ID</label>
                                            <input id="employeeId" type="text" value={user.employeeId} disabled className="w-full p-3 text-lg text-gray-600 bg-gray-200 border-2 rounded-lg dark:text-gray-400 dark:bg-black/30 border-disa-light-border dark:border-disa-dark-border" />
                                        </div>
                                        <div>
                                            <label htmlFor="name" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Name</label>
                                            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="biodata" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Biodata</label>
                                    <textarea id="biodata" value={biodata} onChange={e => setBiodata(e.target.value)} rows={3} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red" placeholder="A little bit about yourself..."></textarea>
                                </div>
                            </div>
                        )}
                         {activeTab === 'appearance' && (
                             <div className="space-y-6">
                                <div>
                                    <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Theme</label>
                                    <div className="flex gap-4 p-2 rounded-xl bg-gray-500/10">
                                        <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${theme === 'light' ? 'bg-disa-accent-blue text-white shadow-md' : 'text-gray-800 dark:text-gray-300'}`}>
                                            <SunIcon className="w-5 h-5" /> Light
                                        </button>
                                        <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${theme === 'dark' ? 'bg-disa-accent-blue text-white shadow-md' : 'text-gray-800 dark:text-gray-300'}`}>
                                        <MoonIcon className="w-5 h-5" /> Dark
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">UI Font</label>
                                        <select value={font} onChange={e => setFont(e.target.value as FontPreference)} className="w-full p-3 text-lg text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red">
                                            {FONT_OPTIONS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="font-size" className="flex justify-between mb-2 font-semibold text-gray-700 dark:text-gray-200">
                                            <span>Font Size</span>
                                            <span>{fontSize}px</span>
                                        </label>
                                        <input id="font-size" type="range" min="12" max="20" step="1" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-disa-red" />
                                    </div>
                                </div>
                            </div>
                         )}
                         {activeTab === 'notifications' && (
                             <div className="space-y-4">
                                <NotificationToggle id="email" label="Email Notifications" description="Receive updates via email" />
                                <NotificationToggle id="push" label="Push Notifications" description="Get real-time alerts on your mobile device" />
                                <NotificationToggle id="desktop" label="Desktop Notifications" description="Show desktop alerts from the web app" />
                                <NotificationToggle id="sms" label="SMS Notifications" description="Receive text messages for critical alerts" />
                             </div>
                         )}
                    </motion.div>
                </AnimatePresence>
                </div>
            </Card>
            
            <div className="flex justify-end items-center gap-4">
                <AnimatePresence>
                    {isSaved && (
                        <motion.p 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="text-green-500 font-semibold"
                        >
                            Changes saved!
                        </motion.p>
                    )}
                </AnimatePresence>
                <motion.button 
                    onClick={handleSaveChanges} 
                    disabled={!isSettingsChanged} 
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 font-bold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Save Changes
                </motion.button>
            </div>
        </div>
    );
};

export default SettingsView;