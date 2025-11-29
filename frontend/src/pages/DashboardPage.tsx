// Dashboard page component - Created by Harish S & Team
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dashboardService, DashboardData } from '../services/dashboardService';
import RiskCard from '../components/RiskCard';
import RecommendationList from '../components/RecommendationList';
import Chart from '../components/Chart';
import SimulationModule from '../components/SimulationModule';
import DetailedAnalysisModal from '../components/DetailedAnalysisModal';
import { LogOut, Settings, BarChart3, TrendingUp, User, Clock, Mail, Calendar } from 'lucide-react';
import SettingsPanel from '../components/SettingsPanel';

// Dashboard page component
const DashboardPage: React.FC = () => {
  // Auth state
  const { user, logout } = useAuth();
  
  // State for dashboard data
  const [riskData, setRiskData] = useState<DashboardData | null>(null);
  const [profileOverview, setProfileOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDetailedAnalysisOpen, setIsDetailedAnalysisOpen] = useState(false);

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

  const openDetailedAnalysis = useCallback(() => {
    setIsDetailedAnalysisOpen(true);
  }, []);

  const closeDetailedAnalysis = useCallback(() => {
    setIsDetailedAnalysisOpen(false);
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
      
      // Fetch dashboard data and profile overview in parallel
      const [dashboardData, profileData] = await Promise.all([
        dashboardService.getDashboardData(),
        dashboardService.getProfileOverview()
      ]);
      
      setRiskData(dashboardData);
      setProfileOverview(profileData);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and title */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Burnout Risk Prediction
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome back, {user?.firstName}!
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={openSettings}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
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
            {/* Profile Overview */}
            {profileOverview && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Profile Overview</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Role</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {profileOverview.profile.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profileOverview.profile.jobTitle}
                      {profileOverview.profile.department && ` • ${profileOverview.profile.department}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Daily Summary</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {profileOverview.dailySummary.meetingsAttended}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Meetings</p>
                      </div>
                      <div className="text-center">
                        <Mail className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {profileOverview.dailySummary.emailsResponded}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Emails</p>
                      </div>
                      <div className="text-center">
                        <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {profileOverview.dailySummary.workHoursLogged}h
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Work Hours</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Risk overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RiskCard data={riskData} onViewDetails={openDetailedAnalysis} />
              </div>
              <div className="lg:col-span-1">
                <div className="card dark:bg-gray-800 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {riskData?.riskScore || 0}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {Math.round(normalizedConfidence)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                      <span className="text-sm text-gray-500 dark:text-gray-500">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Analysis Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Risk Analysis</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Chart data={riskData} />
                </div>
                <div>
                  <RecommendationList recommendations={riskData?.recommendations || []} />
                </div>
              </div>
            </div>

            {/* Simulation Module */}
            <SimulationModule baseWorkPatterns={riskData?.workPatterns} />

            {/* Additional insights - Dynamic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card dark:bg-gray-800 dark:border-gray-700 text-center">
                <TrendingUp className={`h-8 w-8 mx-auto mb-2 ${
                  riskData?.workPatterns?.workHoursPerWeek && riskData.workPatterns.workHoursPerWeek > 45
                    ? 'text-danger-600'
                    : riskData?.workPatterns?.workHoursPerWeek && riskData.workPatterns.workHoursPerWeek > 40
                    ? 'text-warning-600'
                    : 'text-primary-600'
                }`} />
                <h4 className="font-semibold text-gray-900 dark:text-white">Workload Trend</h4>
                <p className={`text-sm font-medium ${
                  riskData?.workPatterns?.workHoursPerWeek && riskData.workPatterns.workHoursPerWeek > 45
                    ? 'text-danger-600'
                    : riskData?.workPatterns?.workHoursPerWeek && riskData.workPatterns.workHoursPerWeek > 40
                    ? 'text-warning-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {riskData?.workPatterns?.workHoursPerWeek && riskData.workPatterns.workHoursPerWeek > 45
                    ? 'High'
                    : riskData?.workPatterns?.workHoursPerWeek && riskData.workPatterns.workHoursPerWeek > 40
                    ? 'Increasing'
                    : 'Normal'}
                </p>
                {riskData?.workPatterns?.workHoursPerWeek && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {riskData.workPatterns.workHoursPerWeek}h/week
                  </p>
                )}
              </div>
              <div className="card dark:bg-gray-800 dark:border-gray-700 text-center">
                <BarChart3 className={`h-8 w-8 mx-auto mb-2 ${
                  riskData?.workPatterns?.stressLevel && riskData.workPatterns.stressLevel >= 7
                    ? 'text-danger-600'
                    : riskData?.workPatterns?.stressLevel && riskData.workPatterns.stressLevel >= 5
                    ? 'text-warning-600'
                    : 'text-success-600'
                }`} />
                <h4 className="font-semibold text-gray-900 dark:text-white">Stress Level</h4>
                <p className={`text-sm font-medium ${
                  riskData?.workPatterns?.stressLevel && riskData.workPatterns.stressLevel >= 7
                    ? 'text-danger-600'
                    : riskData?.workPatterns?.stressLevel && riskData.workPatterns.stressLevel >= 5
                    ? 'text-warning-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {riskData?.workPatterns?.stressLevel && riskData.workPatterns.stressLevel >= 7
                    ? 'High'
                    : riskData?.workPatterns?.stressLevel && riskData.workPatterns.stressLevel >= 5
                    ? 'Moderate'
                    : 'Low'}
                </p>
                {riskData?.workPatterns?.stressLevel && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {riskData.workPatterns.stressLevel}/10
                  </p>
                )}
              </div>
              <div className="card dark:bg-gray-800 dark:border-gray-700 text-center">
                <Settings className={`h-8 w-8 mx-auto mb-2 ${
                  riskData?.workPatterns?.workLifeBalance && riskData.workPatterns.workLifeBalance < 4
                    ? 'text-danger-600'
                    : riskData?.workPatterns?.workLifeBalance && riskData.workPatterns.workLifeBalance < 6
                    ? 'text-warning-600'
                    : 'text-success-600'
                }`} />
                <h4 className="font-semibold text-gray-900 dark:text-white">Work-Life Balance</h4>
                <p className={`text-sm font-medium ${
                  riskData?.workPatterns?.workLifeBalance && riskData.workPatterns.workLifeBalance < 4
                    ? 'text-danger-600'
                    : riskData?.workPatterns?.workLifeBalance && riskData.workPatterns.workLifeBalance < 6
                    ? 'text-warning-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {riskData?.workPatterns?.workLifeBalance && riskData.workPatterns.workLifeBalance < 4
                    ? 'Needs Attention'
                    : riskData?.workPatterns?.workLifeBalance && riskData.workPatterns.workLifeBalance < 6
                    ? 'Fair'
                    : 'Good'}
                </p>
                {riskData?.workPatterns?.workLifeBalance && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {riskData.workPatterns.workLifeBalance.toFixed(1)}/10
                  </p>
                )}
              </div>
              <div className="card dark:bg-gray-800 dark:border-gray-700 text-center">
                <LogOut className={`h-8 w-8 mx-auto mb-2 ${
                  riskData?.riskLevel === 'critical'
                    ? 'text-critical-600'
                    : riskData?.riskLevel === 'high'
                    ? 'text-danger-600'
                    : riskData?.riskLevel === 'medium'
                    ? 'text-warning-600'
                    : 'text-success-600'
                }`} />
                <h4 className="font-semibold text-gray-900 dark:text-white">Burnout Risk</h4>
                <p className={`text-sm font-medium capitalize ${
                  riskData?.riskLevel === 'critical'
                    ? 'text-critical-600'
                    : riskData?.riskLevel === 'high'
                    ? 'text-danger-600'
                    : riskData?.riskLevel === 'medium'
                    ? 'text-warning-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {riskData?.riskLevel || 'Unknown'}
                </p>
                {riskData?.riskScore && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {riskData.riskScore}/100
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        user={user}
        profileOverview={profileOverview}
        onLogout={handleLogout}
      />
      <DetailedAnalysisModal
        isOpen={isDetailedAnalysisOpen}
        onClose={closeDetailedAnalysis}
        data={riskData}
      />
    </div>
  );
};

export default DashboardPage;
