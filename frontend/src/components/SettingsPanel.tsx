import React, { useEffect } from 'react';
import { X, ShieldCheck, Moon, Globe, Bell, User, LogOut } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, onLogout, user }) => {
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-gray-900 bg-opacity-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="User settings"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            <p className="text-sm text-gray-500">Configure your personalized experience</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-full overflow-y-auto px-6 py-6">
          <section className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">Signed in as</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Preferences</h3>
            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:border-primary-300">
                <div>
                  <div className="flex items-center space-x-2">
                    <Moon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Dark mode</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Reduce eye strain during late work hours.</p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Toggle dark mode"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:border-primary-300">
                <div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Burnout alerts</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Receive push notifications on critical risk spikes.</p>
                </div>
                <input
                  defaultChecked
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Toggle burnout alerts"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:border-primary-300">
                <div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Time zone sync</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Automatically adjust analytics to your local time zone.</p>
                </div>
                <input
                  defaultChecked
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Toggle time zone sync"
                />
              </label>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Security</h3>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-success-600" />
                  <span className="text-sm font-medium text-gray-900">Two-factor authentication</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Protect your account with an additional verification step.</p>
                <button className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700">
                  Enable now
                </button>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">
                  Current role: <span className="font-semibold text-gray-900">{user?.role ?? 'employee'}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Role-based access ensures you only see insights tailored to your responsibilities.
                </p>
              </div>
            </div>
          </section>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center space-x-2 rounded-lg border border-danger-200 px-4 py-3 text-sm font-semibold text-danger-600 transition hover:bg-danger-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

export default SettingsPanel;

