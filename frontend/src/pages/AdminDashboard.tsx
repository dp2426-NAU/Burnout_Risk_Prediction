// Admin Dashboard - Created by Harish S & Team
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardService, UserData, DashboardData } from '../services/dashboardService';
import { LogOut, Users, BarChart3, AlertTriangle, CheckCircle, RefreshCw, Activity, User, Building2, Eye, Settings, Search } from 'lucide-react';
import { mlService, EdaReport, TrainingSummary } from '../services/mlService';
import SimulationModule from '../components/SimulationModule';
import RiskCard from '../components/RiskCard';
import Chart from '../components/Chart';
import RecommendationList from '../components/RecommendationList';
import DetailedAnalysisModal from '../components/DetailedAnalysisModal';
import SettingsPanel from '../components/SettingsPanel';
import { useTheme } from '../contexts/ThemeContext';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    lowRisk: 0,
    highRisk: 0,
    criticalRisk: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [viewingAsUser, setViewingAsUser] = useState<UserData | null>(null);
  const [edaReport, setEdaReport] = useState<EdaReport | null>(null);
  const [trainingSummary, setTrainingSummary] = useState<TrainingSummary | null>(null);
  const [trainingInProgress, setTrainingInProgress] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'my-data' | 'department-reports'>('department-reports');
  const [myDashboardData, setMyDashboardData] = useState<DashboardData | null>(null);
  const [myProfileOverview, setMyProfileOverview] = useState<any>(null);
  const [loadingMyData, setLoadingMyData] = useState(false);
  const [isDetailedAnalysisOpen, setIsDetailedAnalysisOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAdminData();
    // Load manager's own data if they're a manager
    if (user?.role === 'manager') {
      loadMyData();
    }
  }, [user]);

  // Load manager's own dashboard data
  const loadMyData = async () => {
    if (!user) return;
    
    try {
      setLoadingMyData(true);
      const [dashboardData, profileData] = await Promise.all([
        dashboardService.getEmployeeDashboard(),
        dashboardService.getProfileOverview()
      ]);

      setMyDashboardData(dashboardData);
      setMyProfileOverview(profileData);
    } catch (error) {
      console.error('Error loading my dashboard data:', error);
    } finally {
      setLoadingMyData(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load admin dashboard data (includes users, predictions, and stats)
      const adminData = await dashboardService.getAdminDashboardData();
      const edaResponse = await mlService.fetchEdaReport();
      
      console.log('Loaded users:', adminData.users.length);
      console.log('Loaded predictions:', adminData.predictions.length);
      console.log('Stats:', adminData.stats);
      if (edaResponse.success && edaResponse.data) {
        setEdaReport(edaResponse.data);
        console.log('EDA label distribution:', edaResponse.data.label_distribution);
        console.log('Top correlations:', edaResponse.data.top_correlations);
      } else {
        setEdaReport(null);
        if (edaResponse.message) {
          console.warn('EDA report unavailable:', edaResponse.message);
        }
      }
      
      setUsers(adminData.users);
      setPredictions(adminData.predictions);
      setStats(adminData.stats);
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleRetrain = async () => {
    try {
      setTrainingInProgress(true);
      setTrainingMessage('');
      const response = await mlService.triggerRetraining();
      if (response.success && response.data) {
        setTrainingSummary(response.data);
        setTrainingMessage('Retraining completed successfully.');
        if (response.data.eda) {
          setEdaReport(response.data.eda);
          console.log('Updated EDA label distribution:', response.data.eda.label_distribution);
          console.log('Updated top correlations:', response.data.eda.top_correlations);
        }
      } else {
        setTrainingMessage(response.message || 'Retraining failed.');
      }
    } catch (err) {
      console.error('Retraining error:', err);
      setTrainingMessage('Retraining failed. Check logs for details.');
    } finally {
      setTrainingInProgress(false);
    }
  };

  const getUserRiskLevel = (userId: string) => {
    const userPredictions = predictions.filter(p => p.userId === userId);
    if (userPredictions.length === 0) return 'unknown';
    
    // Get the most recent prediction
    const latestPrediction = userPredictions.sort((a, b) => 
      new Date(b.predictionDate).getTime() - new Date(a.predictionDate).getTime()
    )[0];
    
    return latestPrediction.riskLevel;
  };


  // const getRoleStats = () => {
  //   return users.reduce((acc, user) => {
  //     acc[user.role] = (acc[user.role] || 0) + 1;
  //     return acc;
  //   }, {} as Record<string, number>);
  // };

  const getDepartmentStats = () => {
    return users.reduce((acc, user) => {
      const dept = user.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <BarChart3 className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  // Handle employee selection - navigate to employee details page
  const handleEmployeeSelect = (userId: string) => {
    if (userId) {
      navigate(`/dashboard/details/${userId}`);
    }
  };

  // Calculate department-wise insights
  const departmentInsights = useMemo(() => {
    const insights: Record<string, {
      total: number;
      low: number;
      medium: number;
      high: number;
      critical: number;
      avgRiskScore: number;
      employees: UserData[];
    }> = {};

    users.forEach((user) => {
      const dept = user.department || 'Unknown';
      if (!insights[dept]) {
        insights[dept] = {
          total: 0,
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
          avgRiskScore: 0,
          employees: []
        };
      }

      insights[dept].total++;
      insights[dept].employees.push(user);

      const riskLevel = getUserRiskLevel(user._id);
      switch (riskLevel) {
        case 'low':
          insights[dept].low++;
          break;
        case 'medium':
          insights[dept].medium++;
          break;
        case 'high':
          insights[dept].high++;
          break;
        case 'critical':
          insights[dept].critical++;
          break;
      }
    });

    // Calculate average risk scores
    Object.keys(insights).forEach(dept => {
      const deptUsers = insights[dept].employees;
      const deptPredictions = predictions.filter(p => 
        deptUsers.some(u => u._id === p.userId)
      );
      
      if (deptPredictions.length > 0) {
        const avgScore = deptPredictions.reduce((sum, p) => sum + (p.riskScore || 0), 0) / deptPredictions.length;
        insights[dept].avgRiskScore = Math.round(avgScore);
      }
    });

    return insights;
  }, [users, predictions]);

  // Get filtered users based on selected department, risk level, and search query
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(u => (u.department || 'Unknown') === selectedDepartment);
    }
    
    // Filter by risk level
    if (selectedRiskFilter) {
      filtered = filtered.filter(u => {
        const riskLevel = getUserRiskLevel(u._id);
        return riskLevel === selectedRiskFilter;
      });
    }
    
    // Filter by search query (name, role, department, job title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(u => {
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        const department = (u.department || '').toLowerCase();
        const jobTitle = (u.jobTitle || '').toLowerCase();
        const riskLevel = getUserRiskLevel(u._id).toLowerCase();
        
        return fullName.includes(query) ||
               email.includes(query) ||
               role.includes(query) ||
               department.includes(query) ||
               jobTitle.includes(query) ||
               riskLevel.includes(query);
      });
    }
    
    return filtered;
  }, [users, selectedDepartment, selectedRiskFilter, searchQuery]);

  // Get all unique departments
  const departments = useMemo(() => {
    const depts = new Set(users.map(u => u.department || 'Unknown'));
    return Array.from(depts).sort();
  }, [users]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadAdminData}
            className="btn-primary dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // const roleStats = getRoleStats();
  const departmentStats = getDepartmentStats();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`shadow-sm border-b transition-colors duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Users className={`h-8 w-8 mr-3 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
              <div>
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.role === 'manager' ? 'Manager Dashboard' : 'Admin Dashboard'}
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Welcome back, {user?.firstName}! Manage your organization's burnout risk.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Tabs for Managers */}
              {user?.role === 'manager' && (
                <div className={`flex items-center space-x-1 rounded-lg p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setViewMode('my-data')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'my-data'
                        ? isDark 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-blue-600 shadow-sm'
                        : isDark
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    View My Data
                  </button>
                  <button
                    onClick={() => setViewMode('department-reports')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'department-reports'
                        ? isDark 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-blue-600 shadow-sm'
                        : isDark
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    View Department Reports
                  </button>
                </div>
              )}
              {viewingAsUser && (
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Viewing as:</span>
                  <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {viewingAsUser.firstName} {viewingAsUser.lastName}
                  </span>
                  <button
                    onClick={() => setViewingAsUser(null)}
                    className={`text-xs ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    ✕
                  </button>
                </div>
              )}
              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors`}
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
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
        {/* Show "My Data" view for managers */}
        {user?.role === 'manager' && viewMode === 'my-data' ? (
          <div className="space-y-6">
            {loadingMyData ? (
              <div className="text-center py-12">
                <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
                <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading your dashboard...</p>
              </div>
            ) : myDashboardData && myProfileOverview ? (
              <>
                {/* Profile Overview */}
                <div className={`rounded-lg p-6 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <User className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Overview</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Meetings</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {myProfileOverview.dailySummary?.meetingsAttended || 0}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Emails</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {myProfileOverview.dailySummary?.emailsResponded || 0}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Work Hours</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {myProfileOverview.dailySummary?.workHoursLogged?.toFixed(1) || '0.0'}h
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Card */}
                <RiskCard 
                  data={myDashboardData} 
                  onViewDetails={() => setIsDetailedAnalysisOpen(true)}
                />

                {/* Risk Analysis Section */}
                <div className={`rounded-lg shadow-md p-6 border transition-colors duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Risk Analysis</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Chart data={myDashboardData} />
                    </div>
                    <div>
                      <RecommendationList recommendations={myDashboardData?.recommendations || []} />
                    </div>
                  </div>
                </div>

                {/* Simulation Module */}
                <SimulationModule baseWorkPatterns={myDashboardData?.workPatterns} />
              </>
            ) : (
              <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'}`}>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Unable to load your dashboard data.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="flex items-center">
              <Users className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="flex items-center">
              <BarChart3 className={`h-8 w-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Low Risk</p>
                <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.lowRisk}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="flex items-center">
              <AlertTriangle className={`h-8 w-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>High Risk</p>
                <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.highRisk}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="flex items-center">
              <AlertTriangle className={`h-8 w-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Critical Risk</p>
                <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.criticalRisk}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Department Insights Section */}
        <div className={`rounded-lg shadow p-6 mb-8 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center gap-2 mb-6">
            <Building2 className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Department Insights</h3>
          </div>

          {/* Department Filter */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Filter by Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isDark 
                  ? 'bg-gray-700 border border-gray-600 text-white' 
                  : 'border border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept} ({departmentInsights[dept]?.total || 0} employees)
                </option>
              ))}
            </select>
          </div>

          {/* Department Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(departmentInsights)
              .filter(([dept]) => selectedDepartment === 'all' || dept === selectedDepartment)
              .map(([dept, insight]) => {
                const riskPercentage = insight.total > 0 
                  ? ((insight.high + insight.critical) / insight.total) * 100 
                  : 0;
                
                return (
                  <div 
                    key={dept}
                    className={`rounded-lg p-5 border transition-colors duration-200 cursor-pointer hover:shadow-md ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedDepartment(dept);
                      // Scroll to user list
                      document.getElementById('user-list-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dept}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        riskPercentage > 30 
                          ? isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                          : riskPercentage > 15
                          ? isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                          : isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                      }`}>
                        {riskPercentage.toFixed(0)}% At Risk
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Employees</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{insight.total}</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{insight.low}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Low</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{insight.medium}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Med</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{insight.high}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>High</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{insight.critical}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Crit</div>
                        </div>
                      </div>

                      {insight.avgRiskScore > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                          <div className="flex items-center justify-between text-sm">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Avg Risk Score</span>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{insight.avgRiskScore}/100</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Risk Level Distribution</h3>
            <div className="space-y-3">
              {Object.entries({
                low: stats.lowRisk,
                medium: Math.floor(stats.totalUsers * 0.2), // Estimate medium risk
                high: stats.highRisk,
                critical: stats.criticalRisk
              }).map(([level, count]) => (
                <div 
                  key={level} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedRiskFilter === level
                      ? isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (selectedRiskFilter === level) {
                      setSelectedRiskFilter(null);
                    } else {
                      setSelectedRiskFilter(level);
                    }
                  }}
                >
                  <div className="flex items-center flex-1">
                    {getRiskIcon(level)}
                    <span className={`ml-2 text-sm font-medium capitalize ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {level} Risk
                    </span>
                    <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({count} {count === 1 ? 'employee' : 'employees'})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-24 rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-2 rounded-full ${
                          level === 'low' ? 'bg-green-500' :
                          level === 'medium' ? 'bg-yellow-500' :
                          level === 'high' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${users.length > 0 ? (count / users.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm w-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
            {selectedRiskFilter && (
              <button
                onClick={() => setSelectedRiskFilter(null)}
                className={`mt-4 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Clear filter
              </button>
            )}
          </div>

          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Department Distribution</h3>
            <div className="space-y-3">
              {Object.entries(departmentStats).map(([dept, count]) => (
                <div 
                  key={dept} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedDepartment === dept
                      ? isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (selectedDepartment === dept) {
                      setSelectedDepartment('all');
                    } else {
                      setSelectedDepartment(dept);
                    }
                  }}
                >
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {dept}
                    <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({count} {count === 1 ? 'employee' : 'employees'})
                    </span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-24 rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${users.length > 0 ? (count / users.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm w-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
            {selectedDepartment !== 'all' && (
              <button
                onClick={() => setSelectedDepartment('all')}
                className={`mt-4 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div id="user-list-section" className={`rounded-lg shadow transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedDepartment === 'all' ? 'All Users' : `${selectedDepartment} Department`} ({filteredUsers.length})
            </h3>
            </div>
            {/* Search/Filter Bar */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by name, role, department, job title, or risk level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    User
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Role
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Department
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Job Title
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Risk Level
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Work Patterns
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                {filteredUsers.map((user) => {
                  const riskLevel = getUserRiskLevel(user._id);
                  return (
                    <tr 
                      key={user._id} 
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              isDark ? 'bg-gray-600' : 'bg-gray-300'
                            }`}>
                              <span className={`text-sm font-medium ${
                                isDark ? 'text-gray-200' : 'text-gray-700'
                              }`}>
                                {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 min-w-0">
                            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {user.firstName || 'N/A'} {user.lastName || ''}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-xs`} title={user.email}>
                              {user.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                            : user.role === 'manager'
                            ? isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            : isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {user.department || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {user.jobTitle || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(riskLevel)} dark:bg-opacity-20`}>
                          {getRiskIcon(riskLevel)}
                          <span className="ml-1 capitalize">{riskLevel}</span>
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user.workPatterns ? (
                          <div className="text-xs">
                            <div>{user.workPatterns.workHoursPerWeek}h/week</div>
                            <div>{user.workPatterns.stressLevel}/10 stress</div>
                            {user.role === 'manager' && (
                              <div>{user.workPatterns.teamSize} team members</div>
                            )}
                          </div>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Operations & EDA - Moved to bottom */}
        <div className={`rounded-lg shadow p-6 mb-8 transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Model Operations & EDA</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Review the latest training metrics and exploratory data analysis. Trigger a new training run after adding datasets.
              </p>
            </div>
            <button
              onClick={handleRetrain}
              disabled={trainingInProgress}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${trainingInProgress ? 'animate-spin' : ''}`} />
              {trainingInProgress ? 'Retraining...' : 'Retrain Models'}
            </button>
          </div>

          {trainingMessage && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              isDark ? 'bg-blue-900/30 text-blue-300 border border-blue-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {trainingMessage}
            </div>
          )}

          {trainingSummary && (
            <div className={`mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <div className={`rounded-md p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <span className={`font-medium block ${isDark ? 'text-white' : 'text-gray-900'}`}>Trained Samples</span>
                {trainingSummary.trained_samples ?? '--'}
              </div>
              <div className={`rounded-md p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <span className={`font-medium block ${isDark ? 'text-white' : 'text-gray-900'}`}>Models Trained</span>
                {trainingSummary.advanced_trained ? 'Baseline & Advanced' : 'Baseline'}
              </div>
              <div className={`rounded-md p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <span className={`font-medium block ${isDark ? 'text-white' : 'text-gray-900'}`}>Metrics File</span>
                {trainingSummary.metric_file || 'N/A'}
              </div>
            </div>
          )}

          {edaReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className={`text-sm font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Activity className={`h-4 w-4 mr-2 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                    Burnout Distribution
                  </h4>
                  <div className="mt-2 space-y-2">
                    {Object.entries(edaReport.label_distribution).map(([label, count]) => (
                      <div key={label} className={`flex justify-between text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="capitalize">{label}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Top Correlated Features</h4>
                  <div className={`mt-2 rounded-md p-3 text-xs space-y-1 ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'
                  }`}>
                    {Object.entries(edaReport.top_correlations).map(([feature, value]) => (
                      <div key={feature} className="flex justify-between">
                        <span className="truncate mr-2">{feature}</span>
                        <span>{typeof value === 'number' ? value.toFixed(3) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sample Records</h4>
                  <pre className={`mt-2 max-h-48 overflow-y-auto text-xs rounded-md p-3 ${
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-900 text-gray-100'
                  }`}>
                    {JSON.stringify(edaReport.sample_rows.slice(0, 3), null, 2)}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                {edaReport.charts?.label_distribution && (
                  <div>
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Label Distribution Chart</h4>
                    <img
                      src={`data:image/png;base64,${edaReport.charts.label_distribution}`}
                      alt="Label distribution"
                      className={`mt-2 rounded-md border ${
                        isDark ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    />
                  </div>
                )}
                {edaReport.charts?.correlation_heatmap && (
                  <div>
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Correlation Heatmap</h4>
                    <img
                      src={`data:image/png;base64,${edaReport.charts.correlation_heatmap}`}
                      alt="Correlation heatmap"
                      className={`mt-2 rounded-md border ${
                        isDark ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              EDA report not available yet. Trigger a training run to generate analytics.
            </p>
          )}
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className={`fixed inset-0 overflow-y-auto h-full w-full z-50 transition-opacity ${
            isDark ? 'bg-gray-900 bg-opacity-70' : 'bg-gray-600 bg-opacity-50'
          }`}>
            <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md transition-colors duration-200 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className={`transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.email}</p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Role</label>
                    <p className={`text-sm capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.role}</p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Department</label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.department || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Job Title</label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.jobTitle || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Experience</label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.experienceYears || 0} years</p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Risk Level</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(getUserRiskLevel(selectedUser._id))} dark:bg-opacity-20`}>
                      {getRiskIcon(getUserRiskLevel(selectedUser._id))}
                      <span className="ml-1 capitalize">{getUserRiskLevel(selectedUser._id)}</span>
                    </span>
                  </div>
                  
                  {selectedUser.workPatterns && (
                    <div>
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Work Patterns</label>
                      <div className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        <div>Work Hours: {selectedUser.workPatterns.workHoursPerWeek}/week</div>
                        <div>Stress Level: {selectedUser.workPatterns.stressLevel}/10</div>
                        <div>Work-Life Balance: {selectedUser.workPatterns.workLifeBalance}/10</div>
                        <div>Team Size: {selectedUser.workPatterns.teamSize || 'N/A'}</div>
                        <div>Remote Work: {selectedUser.workPatterns.remoteWorkPercentage}%</div>
                      </div>
                    </div>
                  )}

                  {/* View Dashboard Button */}
                  <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
                    <button
                      onClick={() => {
                        handleEmployeeSelect(selectedUser._id);
                        setSelectedUser(null);
                      }}
                      className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        )}
      </main>
      
      {/* Detailed Analysis Modal */}
      {user?.role === 'manager' && viewMode === 'my-data' && (
        <DetailedAnalysisModal
          isOpen={isDetailedAnalysisOpen}
          onClose={() => setIsDetailedAnalysisOpen(false)}
          data={myDashboardData}
        />
      )}
      
      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        profileOverview={null}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default AdminDashboard;
