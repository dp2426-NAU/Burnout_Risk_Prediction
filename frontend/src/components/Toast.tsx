// Toast Notification Component
import React, { useEffect } from 'react';
import { CheckCircle, X, Moon, Sun } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'info' | 'theme';
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    if (type === 'theme') {
      return message.includes('Dark') ? (
        <Moon className="h-5 w-5 text-blue-600" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-600" />
      );
    }
    return <CheckCircle className={`h-5 w-5 ${type === 'success' ? 'text-green-600' : 'text-blue-600'}`} />;
  };

  const getStyles = () => {
    if (type === 'theme') {
      return message.includes('Dark')
        ? 'bg-gray-800 border border-gray-700 text-white'
        : 'bg-yellow-50 border border-yellow-200 text-yellow-800';
    }
    return type === 'success'
      ? 'bg-green-50 border border-green-200 text-green-800'
      : 'bg-blue-50 border border-blue-200 text-blue-800';
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className={`flex items-center space-x-3 rounded-lg shadow-lg px-4 py-3 ${getStyles()}`}>
        {getIcon()}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className={`ml-2 ${
            type === 'theme'
              ? message.includes('Dark')
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-yellow-600 hover:text-yellow-800'
              : type === 'success'
              ? 'text-green-600 hover:text-green-800'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

