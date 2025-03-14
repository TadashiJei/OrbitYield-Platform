import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon, BellIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import useWebSocket from '../../hooks/useWebSocket';

/**
 * Real-time notification component using WebSockets
 * Displays notifications as they arrive via WebSocket
 */
const WebSocketNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [systemAnnouncement, setSystemAnnouncement] = useState(null);
  const { isConnected, on } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Handle new notifications
    const unsubscribeNotification = on('notification', (notification) => {
      setNotifications((prev) => {
        // Limit to 5 most recent notifications
        const updated = [notification, ...prev].slice(0, 5);
        return updated;
      });
    });

    // Handle transaction updates
    const unsubscribeTransaction = on('transaction_update', (transaction) => {
      const notificationData = {
        id: `tx-${transaction.transactionId}-${Date.now()}`,
        title: 'Transaction Update',
        message: `Your ${transaction.type} transaction is now ${transaction.status}`,
        type: transaction.status === 'failed' ? 'error' : 'info',
        data: transaction,
        createdAt: new Date().toISOString()
      };
      
      setNotifications((prev) => {
        // Limit to 5 most recent notifications
        const updated = [notificationData, ...prev].slice(0, 5);
        return updated;
      });
    });

    // Handle system announcements
    const unsubscribeAnnouncement = on('system_announcement', (announcement) => {
      setSystemAnnouncement(announcement);
    });

    // Clean up subscriptions
    return () => {
      unsubscribeNotification();
      unsubscribeTransaction();
      unsubscribeAnnouncement();
    };
  }, [isConnected, on]);

  // Remove a notification by ID
  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Dismiss the system announcement
  const dismissAnnouncement = () => {
    setSystemAnnouncement(null);
  };

  // Auto-dismiss notifications after 10 seconds
  useEffect(() => {
    const timers = notifications.map((notification) => {
      if (notification.id) {
        return setTimeout(() => {
          dismissNotification(notification.id);
        }, 10000);
      }
      return null;
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [notifications]);

  // Auto-dismiss system announcements after 30 seconds (unless marked as permanent)
  useEffect(() => {
    if (systemAnnouncement && !systemAnnouncement.permanent) {
      const timer = setTimeout(() => {
        dismissAnnouncement();
      }, 30000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [systemAnnouncement]);

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'success':
        return <InformationCircleIcon className="h-6 w-6 text-green-500" />;
      case 'info':
      default:
        return <BellIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <div className="fixed right-4 bottom-4 space-y-2 z-50 w-80">
      {/* System Announcement */}
      <AnimatePresence>
        {systemAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`p-4 rounded-lg shadow-lg ${
              systemAnnouncement.importance === 'critical'
                ? 'bg-red-100 border-2 border-red-500'
                : systemAnnouncement.importance === 'high'
                ? 'bg-yellow-100 border-2 border-yellow-500'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex space-x-2">
                {systemAnnouncement.importance === 'critical' ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                ) : systemAnnouncement.importance === 'high' ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                ) : (
                  <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                )}
                <span className="font-semibold">{systemAnnouncement.title}</span>
              </div>
              <button
                onClick={dismissAnnouncement}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm">{systemAnnouncement.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id || `notification-${notification.createdAt}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-lg p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex space-x-2">
                {getNotificationIcon(notification.type)}
                <span className="font-semibold">{notification.title}</span>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm">{notification.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default WebSocketNotifications;
