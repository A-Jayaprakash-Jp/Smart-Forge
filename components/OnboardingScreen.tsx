import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSettings } from '../hooks/useAppSettings';
import { Cog6ToothIcon, ShieldCheckIcon, CameraIcon, MicrophoneIcon, BellAlertIcon, CheckCircleIcon, XCircleIcon, CubeTransparentIcon, LightBulbIcon, ArrowPathIcon } from './common/Icons';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';

interface OnboardingScreenProps {
  onComplete: () => void;
}

type PermissionState = 'prompt' | 'granted' | 'denied' | 'prompt-with-rationale' | 'limited';

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const { appName, appLogo } = useAppSettings();
    const [permissions, setPermissions] = useState<{
        camera: PermissionState;
        microphone: PermissionState;
        notifications: PermissionState | 'granted' | 'denied' | 'prompt';
    }>({ camera: 'prompt', microphone: 'prompt', notifications: 'prompt' });
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        // Pre-check permissions when the component loads
        const checkExistingPermissions = async () => {
            if (Capacitor.isNativePlatform()) {
                const cameraStatus = await Camera.checkPermissions();
                setPermissions(prev => ({ ...prev, camera: cameraStatus.camera, microphone: cameraStatus.camera }));
    
                const notificationStatus = await PushNotifications.checkPermissions();
                setPermissions(prev => ({ ...prev, notifications: notificationStatus.receive }));
            } else {
                // On web, check notification permissions. Camera/Mic cannot be checked without prompt.
                if ('Notification' in window) {
                    const status = Notification.permission;
                    if (status === 'granted' || status === 'denied') {
                        setPermissions(prev => ({...prev, notifications: status}));
                    }
                }
            }
        };
        checkExistingPermissions();
    }, []);
    
    const handleRequestPermissions = async () => {
        setIsRequesting(true);

        if (Capacitor.isNativePlatform()) {
            // Native platform logic
            try {
                const cameraPerms = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
                setPermissions(prev => ({
                    ...prev,
                    camera: cameraPerms.camera,
                    microphone: cameraPerms.camera, // The camera plugin handles both on native
                }));
            } catch (e) {
                console.error("Native camera permission error:", e);
                setPermissions(prev => ({ ...prev, camera: 'denied', microphone: 'denied' }));
            }
    
            try {
                let permStatus = await PushNotifications.requestPermissions();
                if (permStatus.receive === 'granted') {
                    // Register for push notifications
                    await PushNotifications.register();
                }
                setPermissions(prev => ({ ...prev, notifications: permStatus.receive }));
            } catch (e) {
                 console.error("Native notifications permission error:", e);
                 setPermissions(prev => ({ ...prev, notifications: 'denied' }));
            }
    
        } else {
            // Web platform logic
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                stream.getTracks().forEach(track => track.stop());
                setPermissions(prev => ({ ...prev, camera: 'granted', microphone: 'granted' }));
            } catch (err) {
                console.error("Web camera/mic permission error:", err);
                setPermissions(prev => ({ ...prev, camera: 'denied', microphone: 'denied' }));
            }
    
            try {
                if ('Notification' in window) {
                    const permission = await Notification.requestPermission();
                    setPermissions(prev => ({ ...prev, notifications: permission as any }));
                }
            } catch (err) {
                console.error("Web notification permission error:", err);
            }
        }
        setIsRequesting(false);
    }
    
    const allPermissionsGranted = useMemo(() => {
        const cameraOK = permissions.camera === 'granted' || permissions.camera === 'limited';
        const microphoneOK = permissions.microphone === 'granted' || permissions.microphone === 'limited';
        const notificationsOK = permissions.notifications === 'granted';
        
        return cameraOK && microphoneOK && notificationsOK;
    }, [permissions]);

    const stepsContent = [
        // Step 0: Welcome
        {
            icon: Cog6ToothIcon,
            title: `Welcome to ${appName}`,
            description: "Your new hub for production intelligence. Let's get you set up in just a few moments.",
        },
        // Step 1: Features
        {
            icon: CubeTransparentIcon,
            title: "Core Features",
            description: "Discover a powerful suite of tools designed for the modern factory floor.",
            details: [
                { icon: LightBulbIcon, text: "AI-Powered insights and chat assistant." },
                { icon: ArrowPathIcon, text: "Offline-first sync for uninterrupted work." },
                { icon: CameraIcon, text: "Scan documents and log data with your camera." },
            ],
        },
        // Step 2: Permissions
        {
            icon: ShieldCheckIcon,
            title: "App Permissions",
            description: "To unlock all features, we need access to a few things on your device. Your data is always secure.",
        },
        // Step 3: All Set
        {
            icon: CheckCircleIcon,
            title: "You're All Set!",
            description: "You're ready to dive in and revolutionize your workflow.",
        }
    ];

    const currentStepData = stepsContent[step];
    
    const PermissionRow: React.FC<{ name: string; icon: React.ElementType; status: PermissionState | 'granted' | 'denied' | 'prompt'; description: string; isOptional?: boolean }> = ({ name, icon: Icon, status, description, isOptional = false }) => (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-black/10 dark:bg-white/5">
            <Icon className="w-8 h-8 text-disa-accent-blue flex-shrink-0 mt-1" />
            <div className="flex-grow">
                <h4 className="font-bold text-gray-800 dark:text-white">{name} {isOptional && <span className="text-xs font-normal text-gray-500">(Optional)</span>}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
            {status === 'granted' && <CheckCircleIcon className="w-7 h-7 text-disa-accent-green flex-shrink-0" />}
            {status === 'denied' && <XCircleIcon className="w-7 h-7 text-disa-red flex-shrink-0" />}
            {(status === 'prompt' || status === 'prompt-with-rationale' || status === 'limited') && <div className="w-7 h-7"></div>}
        </div>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-disa-light-bg dark:bg-disa-dark-bg text-gray-800 dark:text-gray-100 p-4">
             <div className="gradient-bg"></div>
            <motion.div
                className="w-full max-w-lg p-6 mx-auto text-center rounded-2xl glass-card"
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex flex-col items-center">
                            {appLogo && step === 0 && <img src={appLogo} alt="App Logo" className="w-24 h-24 object-contain mx-auto mb-4" />}
                            {currentStepData.icon && <currentStepData.icon className={`w-16 h-16 mx-auto mb-4 ${step === 3 ? 'text-disa-accent-green' : 'text-disa-red'}`} />}
                            
                            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{currentStepData.title}</h2>
                            <p className="text-gray-600 dark:text-gray-300">{currentStepData.description}</p>
                        
                            {step === 1 && (
                                <div className="space-y-3 text-left mt-6">
                                    {currentStepData.details?.map(detail => (
                                        <div key={detail.text} className="flex items-center gap-3 p-3 rounded-lg bg-black/5 dark:bg-white/5">
                                            <detail.icon className="w-6 h-6 text-disa-accent-blue flex-shrink-0"/>
                                            <span className="font-medium">{detail.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 text-left my-6">
                                    <PermissionRow name="Camera" icon={CameraIcon} status={permissions.camera} description="To scan documents and for video calls." />
                                    <PermissionRow name="Microphone" icon={MicrophoneIcon} status={permissions.microphone} description="For voice commands and calls." />
                                    <PermissionRow name="Notifications" icon={BellAlertIcon} status={permissions.notifications} description="For alerts, messages, and call notifications." isOptional={!('Notification' in window)}/>
                                    
                                    {!allPermissionsGranted && (
                                        <button 
                                            onClick={handleRequestPermissions} 
                                            disabled={isRequesting}
                                            className="w-full mt-4 flex items-center justify-center gap-3 px-6 py-4 text-xl font-bold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-500">
                                            {isRequesting ? 'Requesting...' : 'Grant Access'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8">
                    <button 
                        onClick={() => setStep(s => Math.max(0, s - 1))}
                        disabled={step === 0}
                        className="px-6 py-2 font-semibold transition-colors rounded-lg text-gray-800 dark:text-white bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    {step < stepsContent.length - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={step === 2 && !allPermissionsGranted}
                            className="px-6 py-2 font-bold text-white transition-colors rounded-lg bg-disa-red hover:bg-red-700 disabled:bg-gray-500"
                        >
                            Next
                        </button>
                    ) : (
                        <button onClick={onComplete} className="px-6 py-2 font-bold text-white transition-colors rounded-lg bg-disa-accent-green hover:bg-green-500">
                            Get Started
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingScreen;