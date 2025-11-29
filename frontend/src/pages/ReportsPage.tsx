// Reports page component - Created by Harish S & Team
import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

// Reports page component
const ReportsPage: React.FC = () => {
  // State for reports data
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Load reports data on mount
  useEffect(() => {
    loadReportsData();
  }, [selectedPeriod]);

  // Load reports data
  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // TODO: Implement API calls to load reports data
      // For now, using mock data
      setTimeout(() => {
        setReportsData({
          riskHistory: [
            { date: '2024-01-01', riskScore: 45, riskLevel: 'low' },
            { date: '2024-01-08', riskScore: 52, riskLevel: 'medium' },
            { date: '2024-01-15', riskScore: 48, riskLevel: 'low' },
            { date: '2024-01-22', riskScore: 65, riskLevel: 'medium' },
            { date: '2024-01-29', riskScore: 58, riskLevel: 'medium' }
          ],
          factorTrends: {
            workload: [6, 7, 5, 8, 7],
            stressLevel: [4, 5, 3, 7, 6],
            workLifeBalance: [7, 6, 8, 4, 5],
            socialSupport: [6, 5, 7, 5, 6],
            jobSatisfaction: [7, 6, 8, 5, 6]
          },
          insights: [
            {
              type: 'warning',
              title: 'Workload Spike Detected',
              description: 'Your workload increased by 25% this week compared to last week.',
              impact: 'medium'
            },
            {
              type: 'info',
              title: 'Stress Management Improving',
              description: 'Your stress levels have decreased by 15% over the past month.',
              impact: 'positive'
            },
            {
              type: 'alert',
              title: 'Work-Life Balance Declining',
              description: 'Your work-life balance score has dropped below the recommended threshold.',
              impact: 'high'
            }
          ]
        });
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error loading reports data:', error);
      setError('Failed to load reports data');
      setLoading(false);
    }
  };

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  // Handle export
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting reports...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Title */}
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Reports & Analytics
                </h1>
                <p className="text-sm text-gray-500">
                  Detailed insights into your burnout risk patterns
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Period selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="input w-auto"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              {/* Export button */}
              <button
                onClick={handleExport}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
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
              <p className="text-gray-600">Loading reports data...</p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
            <p className="text-danger-700">{error}</p>
            <button
              onClick={loadReportsData}
              className="mt-4 btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : (
          // Reports content
          <div className="space-y-8">
            {/* Risk trend chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Risk Score Trend
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {selectedPeriod}
                </div>
              </div>
              
              {/* Mock chart */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Risk trend chart will be displayed here</p>
                </div>
              </div>
            </div>

            {/* Factor trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Factor Trends
                </h3>
                
                {/* Mock factor trends */}
                <div className="space-y-4">
                  {Object.entries(reportsData?.factorTrends || {}).map(([factor, values]) => (
                    <div key={factor} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {factor.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${((values as number[])[(values as number[]).length - 1] / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {(values as number[])[(values as number[]).length - 1]}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Risk Distribution
                </h3>
                
                {/* Mock risk distribution */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Low Risk</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-success-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">40%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medium Risk</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-warning-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">35%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High Risk</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-danger-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Critical Risk</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-critical-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Key Insights
              </h3>
              
              <div className="space-y-4">
                {reportsData?.insights?.map((insight: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'warning' 
                        ? 'bg-warning-50 border-warning-400' 
                        : insight.type === 'alert'
                        ? 'bg-danger-50 border-danger-400'
                        : 'bg-primary-50 border-primary-400'
                    }`}
                  >
                    <div className="flex items-start">
                      <AlertTriangle className={`h-5 w-5 mr-3 mt-0.5 ${
                        insight.type === 'warning' 
                          ? 'text-warning-600' 
                          : insight.type === 'alert'
                          ? 'text-danger-600'
                          : 'text-primary-600'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                          insight.impact === 'high' 
                            ? 'bg-danger-100 text-danger-800'
                            : insight.impact === 'positive'
                            ? 'bg-success-100 text-success-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}>
                          {insight.impact} impact
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReportsPage;
