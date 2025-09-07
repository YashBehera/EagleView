import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./firebase-config";
import { formatDistanceToNow } from "date-fns";
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline";

// Notification type icons with consistent styling
const notificationIcons = {
  success: <CheckCircleIcon className="w-6 h-6 text-emerald-500" />,
  warning: <ExclamationCircleIcon className="w-6 h-6 text-amber-500" />,
  info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
  alert: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
  default: <InformationCircleIcon className="w-6 h-6 text-gray-500" />
};

export default function Notifications({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const notificationRef = useRef(null);

  // Sample notifications - In production, these would come from Firestore
  const sampleNotifications = [
    {
      id: "1",
      title: "Account Verified",
      message: "Your account has been successfully verified. You now have full access to EagleView features.",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false
    },
    {
      id: "2",
      title: "Portfolio Alert",
      message: "HDFC Bank (HDFCBANK) is up by 5% today. Check your portfolio for details.",
      type: "alert", 
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: "3",
      title: "New Feature Available",
      message: "Try our new stock comparison tool to analyze multiple stocks side-by-side.",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    },
    {
      id: "4",
      title: "Market Holiday",
      message: "Markets will be closed this Monday due to a public holiday.",
      type: "warning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      read: true
    },
    {
      id: "5",
      title: "Welcome to EagleView",
      message: "Thank you for joining EagleView! Start exploring stock insights and building your portfolio.",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      read: true
    }
  ];

  // Fetch notifications from Firestore when component mounts
  useEffect(() => {
    // In a production app, we'd fetch from Firestore
    // This is a placeholder for demo purposes
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setNotifications(sampleNotifications);
      setIsLoading(false);
      
      // Count unread notifications
      const unread = sampleNotifications.filter(notif => !notif.read).length;
      setUnreadCount(unread);
    }, 500);
    
    /* 
    // This would be the actual Firestore implementation:
    if (currentUser?.uid) {
      const userNotificationsRef = collection(db, "notifications");
      const q = query(
        userNotificationsRef,
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedNotifications = [];
        querySnapshot.forEach((doc) => {
          fetchedNotifications.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setNotifications(fetchedNotifications);
        setIsLoading(false);
        
        // Count unread notifications
        const unread = fetchedNotifications.filter(notif => !notif.read).length;
        setUnreadCount(unread);
      });
      
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
    */
  }, [currentUser]);

  // Handle clicks outside the notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationOpen]);

  // Toggle notification panel
  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    // Update local state first for immediate UI feedback
    setNotifications(
      notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    /* 
    // This would be the actual Firestore implementation:
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
    */
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Update local state first for immediate UI feedback
    setNotifications(
      notifications.map(notification => ({ ...notification, read: true }))
    );
    
    // Reset unread count
    setUnreadCount(0);
    
    /* 
    // This would be the actual Firestore implementation:
    try {
      const batch = db.batch();
      
      notifications.forEach(notification => {
        if (!notification.read) {
          const notificationRef = doc(db, "notifications", notification.id);
          batch.update(notificationRef, { read: true });
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
    */
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    // Update local state first for immediate UI feedback
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    
    setNotifications(updatedNotifications);
    
    // Update unread count if needed
    const deletedNotification = notifications.find(n => n.id === notificationId);
    if (deletedNotification && !deletedNotification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    /* 
    // This would be the actual Firestore implementation:
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
    */
  };

  // Format the timestamp to a relative time string
  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch (error) {
      return "some time ago";
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Button with Badge */}
      <button
        onClick={toggleNotifications}
        className="relative hover:text-gray-600 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isNotificationOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg z-[1050] border border-gray-100 transform origin-top-right transition-all duration-200 animate-fade-in overflow-hidden"
          style={{ animationDuration: '0.15s' }}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex">
                    {/* Icon */}
                    <div className="flex-shrink-0 mr-3">
                      {notificationIcons[notification.type] || notificationIcons.default}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'text-black' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        
                        {/* Actions dropdown */}
                        <div className="relative group">
                          <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                            <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                              >
                                <CheckIcon className="w-4 h-4" />
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors text-red-600"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <p className={`text-xs mt-1 ${!notification.read ? 'text-gray-800' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-gray-400 bg-gray-100 p-3 rounded-full mb-3">
                  <BellIcon className="w-6 h-6" />
                </div>
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
              <button
                onClick={() => console.log("View all notifications")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}