import React, { useEffect, useState } from 'react';
import { X, Moon, Bell, User } from 'lucide-react';
import Toast from './Toast';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    jobTitle?: string;
    department?: string;
  } | null;
  profileOverview?: {
    profile?: {
      jobTitle?: string;
      department?: string;
    };
  } | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, onLogout, user, profileOverview }) => {
  const { toggleTheme, isDark } = useTheme();
  const [burnoutAlerts, setBurnoutAlerts] = useState(() => {
    const saved = localStorage.getItem('burnoutAlerts');
    return saved !== 'false'; // Default to true
  });

  // Toast state
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type?: 'success' | 'info' | 'theme' }>({
    message: '',
    isVisible: false
  });

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'info' | 'theme' = 'success') => {
    setToast({ message, isVisible: true, type });
  };

  // Save burnout alerts preference
  useEffect(() => {
    localStorage.setItem('burnoutAlerts', burnoutAlerts.toString());
    
    // If enabled, set up notification permission request
    if (burnoutAlerts && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Burnout alerts enabled');
        }
      });
    }
  }, [burnoutAlerts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle dark mode toggle
  const handleDarkModeToggle = (checked: boolean) => {
    toggleTheme();
    showToast(checked ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'theme');
  };

  // Handle burnout alerts toggle
  const handleBurnoutAlertsToggle = (checked: boolean) => {
    setBurnoutAlerts(checked);
    showToast(checked ? 'Burnout alerts enabled' : 'Burnout alerts disabled', 'success');
  };

  // Get user role display text
  const getRoleDisplay = () => {
    const jobTitle = profileOverview?.profile?.jobTitle || user?.jobTitle || 'Employee';
    const department = profileOverview?.profile?.department || user?.department;
    
    if (department) {
      return `${jobTitle} – ${department}`;
    }
    return jobTitle;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
    <div className="fixed inset-0 z-40 flex">
      <div
          className="absolute inset-0 bg-gray-900 bg-opacity-40 dark:bg-opacity-60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
          className="relative ml-auto h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="User settings"
      >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure your personalized experience</p>
          </div>
          <button
            onClick={onClose}
              className="rounded-full p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

          {/* Content */}
        <div className="h-full overflow-y-auto px-6 py-6">
            {/* Account Information */}
            <section className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Signed in as</p>
            <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex-shrink-0">
                <User className="h-6 w-6" />
              </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </section>

            {/* Preferences Section */}
            <section className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Preferences</h3>
              <div className="space-y-3">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Dark mode</span>
                  </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">Reduce eye strain during late work hours.</p>
                </div>
                  <ToggleSwitch
                    checked={isDark}
                    onChange={handleDarkModeToggle}
                    ariaLabel="Toggle dark mode"
                />
                </div>

                {/* Burnout Alerts Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Burnout alerts</span>
                  </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">Receive notifications when your burnout risk score spikes.</p>
                </div>
                  <ToggleSwitch
                    checked={burnoutAlerts}
                    onChange={handleBurnoutAlertsToggle}
                    ariaLabel="Toggle burnout alerts"
                  />
                </div>
            </div>
          </section>

            {/* Role Information */}
            <section className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Current Role</h3>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {getRoleDisplay()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Role-based access ensures you only see insights and data relevant to your position.
                </p>
            </div>
          </section>

            {/* Sign Out Button */}
          {onLogout && (
            <button
              onClick={onLogout}
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-danger-200 dark:border-danger-800 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-semibold text-danger-600 dark:text-danger-400 transition hover:bg-danger-50 dark:hover:bg-danger-900/20"
            >
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>
    </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
        type={toast.type}
      />
    </>
  );
};

// iOS-style Toggle Switch Component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, ariaLabel }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
        checked ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export default SettingsPanel;

