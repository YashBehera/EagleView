import React ,{ useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';
import './AppleStyles.css'
// 1. Loading Button with Apple-style animation
export const AppleLoadingButton = ({ onClick, loading, disabled, children }) => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 400);
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden ${
        loading ? 'text-transparent' : 'text-white'
      }`}
      style={{
        backgroundColor: disabled ? 'rgba(0, 113, 227, 0.5)' : 'var(--apple-blue)',
        boxShadow: loading ? '0 2px 8px rgba(0, 113, 227, 0.3)' : 'none',
      }}
    >
      {children}
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-1">
            <div 
              className="h-2 w-2 rounded-full bg-white animate-pulse" 
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="h-2 w-2 rounded-full bg-white animate-pulse" 
              style={{ animationDelay: '200ms' }}
            />
            <div 
              className="h-2 w-2 rounded-full bg-white animate-pulse" 
              style={{ animationDelay: '400ms' }}
            />
          </div>
        </div>
      )}
    </button>
  );
};

// 2. Apple-style Toast Notification System
export const AppleNotificationContext = React.createContext();

export const AppleNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeNotification(id);
    }, duration);
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, removing: true } 
        : notification
    ));
    
    // Actually remove it from state after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 500);
  };

  return (
    <AppleNotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none max-w-xs w-full px-2 sm:px-0">
        {notifications.map(notification => (
          <AppleNotification 
            key={notification.id} 
            notification={notification} 
            onClose={() => removeNotification(notification.id)} 
          />
        ))}
      </div>
    </AppleNotificationContext.Provider>
  );
};

// Hook to use the notification system
export const useAppleNotification = () => {
  const context = React.useContext(AppleNotificationContext);
  if (!context) {
    throw new Error('useAppleNotification must be used within an AppleNotificationProvider');
  }
  return context;
};

const AppleNotification = ({ notification, onClose }) => {
  const typeStyles = {
    success: {
      icon: <CheckCircle size={18} className="text-white" />,
      bgColor: 'var(--apple-green, #34C759)',
    },
    error: {
      icon: <AlertCircle size={18} className="text-white" />,
      bgColor: 'var(--apple-red, #FF3B30)',
    },
    info: {
      icon: <Info size={18} className="text-white" />,
      bgColor: 'var(--apple-blue, #007AFF)',
    },
  };
  
  const style = typeStyles[notification.type] || typeStyles.info;
  
  return (
    <div 
      className={`flex items-center text-white rounded-xl shadow-lg px-4 py-3 pointer-events-auto max-w-xs w-full transform transition-all duration-500 ${
        notification.removing ? 'opacity-0 translate-y-2' : 'opacity-100'
      }`}
      style={{ 
        backgroundColor: style.bgColor,
        backdropFilter: 'blur(10px)',
        animationName: 'slideInUp',
        animationDuration: '0.3s',
        animationTimingFunction: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      }}
    >
      <div className="flex-shrink-0 mr-3">
        {style.icon}
      </div>
      <div className="flex-1 mr-2 text-sm font-medium">{notification.message}</div>
      <button onClick={onClose} className="flex-shrink-0 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
        <X size={16} className="text-white" />
      </button>
    </div>
  );
};

// 3. Demo Component
export default function AppleStyleComponents() {
  const [loading, setLoading] = useState(false);
  const { addNotification } = useAppleNotification();
  
  const handleButtonClick = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      addNotification('Watchlist created successfully!', 'success');
    }, 2000);
  };
  
  const showErrorNotification = () => {
    addNotification('Unable to create watchlist', 'error');
  };
  
  const showInfoNotification = () => {
    addNotification('You need to login first', 'info');
  };
  
  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 rounded-lg">
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">Apple-style Loading Button</h3>
        <div className="flex gap-4">
          <AppleLoadingButton 
            onClick={handleButtonClick} 
            loading={loading} 
            disabled={false}
          >
            Create
          </AppleLoadingButton>
          
          <AppleLoadingButton 
            disabled={true}
          >
            Disabled
          </AppleLoadingButton>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">Apple-style Notifications</h3>
        <div className="flex gap-4">
          <button 
            onClick={() => addNotification('Watchlist created successfully!', 'success')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
          >
            Success Toast
          </button>
          
          <button 
            onClick={() => addNotification('Failed to save changes', 'error')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
          >
            Error Toast
          </button>
          
          <button 
            onClick={() => addNotification('Login to add stocks', 'info')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            Info Toast
          </button>
        </div>
      </div>
    </div>
  );
}