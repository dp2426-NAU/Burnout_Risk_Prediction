// Dashboard component - Created by Harish S & Team
import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

// Props interface
interface DashboardProps {
  data: any; // Risk data from parent component
}

// Dashboard component
const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // Get risk level styling
  const getRiskLevelStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'risk-low';
      case 'medium':
        return 'risk-medium';
      case 'high':
        return 'risk-high';
      case 'critical':
        return 'risk-critical';
      default:
        return 'risk-medium';
    }
  };

  // Get risk level icon
  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="h-6 w-6 text-success-600" />;
      case 'medium':
        return <AlertTriangle className="h-6 w-6 text-warning-600" />;
      case 'high':
        return <AlertTriangle className="h-6 w-6 text-danger-600" />;
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-critical-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-warning-600" />;
    }
  };

  // Get risk level description
  const getRiskLevelDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'You are at low risk of burnout. Keep up the good work!';
      case 'medium':
        return 'You are at medium risk of burnout. Consider making some adjustments.';
      case 'high':
        return 'You are at high risk of burnout. Immediate action is recommended.';
      case 'critical':
        return 'You are at critical risk of burnout. Please seek professional help.';
      default:
        return 'Risk assessment in progress...';
    }
  };

  const normalizedConfidence = useMemo(() => {
    const rawConfidence = data?.confidence ?? 0;
    const percentValue = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
    return Math.min(100, Math.max(0, percentValue));
  }, [data?.confidence]);

  return (
    <div className="space-y-6">
      {/* Risk overview card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Current Burnout Risk
          </h2>
          <div className="flex items-center space-x-2">
            {getRiskLevelIcon(data?.riskLevel)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelStyle(data?.riskLevel)}`}>
              {data?.riskLevel?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
        </div>

        {/* Risk score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Risk Score</span>
            <span className="text-2xl font-bold text-gray-900">
              {data?.riskScore || 0}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                data?.riskScore >= 75 
                  ? 'bg-critical-500' 
                  : data?.riskScore >= 50 
                  ? 'bg-danger-500' 
                  : data?.riskScore >= 25 
                  ? 'bg-warning-500' 
                  : 'bg-success-500'
              }`}
              style={{ width: `${data?.riskScore || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Risk description */}
        <p className="text-gray-600 mb-4">
          {getRiskLevelDescription(data?.riskLevel)}
        </p>

        {/* Confidence level */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Confidence Level</span>
          <span className="font-medium text-gray-900">
            {Math.round(normalizedConfidence)}%
          </span>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Risk Factors
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {data?.factors && Object.entries(data.factors).map(([factor, value]) => (
            <div key={factor} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {factor.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (value as number) >= 7 
                        ? 'bg-danger-500' 
                        : (value as number) >= 5 
                        ? 'bg-warning-500' 
                        : 'bg-success-500'
                    }`}
                    style={{ width: `${(value as number) * 10}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-6">
                  {value as number}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary flex items-center justify-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate New Prediction
          </button>
          
          <button className="btn-secondary flex items-center justify-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Trends
          </button>
          
          <button className="btn-secondary flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Get Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
