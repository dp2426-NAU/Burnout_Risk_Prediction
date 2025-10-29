// Dashboard page component - Created by Balaji Koneti
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dashboardService, DashboardData } from '../services/dashboardService';
import RiskCard from '../components/RiskCard';
import RecommendationList from '../components/RecommendationList';
import Chart from '../components/Chart';
import { LogOut, Settings, BarChart3, TrendingUp } from 'lucide-react';
import SettingsPanel from '../components/SettingsPanel';

// Dashboard page component
const DashboardPage: React.FC = () => {
  // Auth state
  const { user, logout } = useAuth();
  
  // State for dashboard data
  const [riskData, setRiskData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const normalizedConfidence = useMemo(() => {
    const rawConfidence = riskData?.confidence ?? 0;
    const percentValue = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
    return Math.min(100, Math.max(0, percentValue));
  }, [riskData?.confidence]);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch real data from API
      const data = await dashboardService.getDashboardData();
      setRiskData(data);
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and title */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  Burnout Risk Prediction
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.firstName}!
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={openSettings}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          // Loading state
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
            <p className="text-danger-700">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-4 btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : (
          // Dashboard content
          <div className="space-y-8">
            {/* Risk overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RiskCard data={riskData} />
              </div>
              <div className="lg:col-span-1">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Risk Score</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {riskData?.riskScore || 0}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {Math.round(normalizedConfidence)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm text-gray-500">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Chart data={riskData} />
              </div>
              <div>
                <RecommendationList recommendations={riskData?.recommendations || []} />
              </div>
            </div>

            {/* Additional insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card text-center">
                <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Workload Trend</h4>
                <p className="text-sm text-gray-600">Increasing</p>
              </div>
              <div className="card text-center">
                <BarChart3 className="h-8 w-8 text-warning-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Stress Level</h4>
                <p className="text-sm text-gray-600">Moderate</p>
              </div>
              <div className="card text-center">
                <Settings className="h-8 w-8 text-success-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Work-Life Balance</h4>
                <p className="text-sm text-gray-600">Needs Attention</p>
              </div>
              <div className="card text-center">
                <LogOut className="h-8 w-8 text-danger-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Burnout Risk</h4>
                <p className="text-sm text-gray-600">Medium</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        user={user}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default DashboardPage;
