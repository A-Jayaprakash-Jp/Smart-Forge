import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from './Icons';

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
};

const colors = {
  success: 'bg-disa-accent-green',
  error: 'bg-disa-red',
  info: 'bg-disa-accent-blue',
  warning: 'bg-disa-accent-yellow',
}

const NotificationHost: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-20 right-4 z-[9999] w-full max-w-sm space-y-4">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          return (
            <motion.div
              key={notification.id}
              layout // Animate layout changes
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={`relative p-4 overflow-hidden rounded-lg shadow-lg ${colors[notification.type]}`}
            >
              <div className="flex items-start">
                  <div className="flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="w-0 flex-1 ml-3 pt-0.5">
                      <p className="text-sm font-bold text-white">{notification.title}</p>
                      <p className="mt-1 text-sm text-white">{notification.message}</p>
                  </div>
                  <div className="flex flex-shrink-0 ml-4">
                      <button
                          onClick={() => removeNotification(notification.id)}
                          className="inline-flex text-white rounded-md hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                      >
                          <span className="sr-only">Close</span>
                          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                      </button>
                  </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationHost;