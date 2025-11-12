// Risk card component - Created by Balaji Koneti
import React, { useMemo, useCallback } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

// Props interface
interface RiskCardProps {
  data: any; // Risk data from parent component
  onViewDetails?: () => void; // Callback to open detailed analysis modal
}

// Risk card component
const RiskCard: React.FC<RiskCardProps> = ({ data, onViewDetails }) => {

  // Get risk level styling
  const getRiskLevelStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return {
          bg: 'bg-success-50',
          border: 'border-success-200',
          text: 'text-success-700',
          icon: 'text-success-600'
        };
      case 'medium':
        return {
          bg: 'bg-warning-50',
          border: 'border-warning-200',
          text: 'text-warning-700',
          icon: 'text-warning-600'
        };
      case 'high':
        return {
          bg: 'bg-danger-50',
          border: 'border-danger-200',
          text: 'text-danger-700',
          icon: 'text-danger-600'
        };
      case 'critical':
        return {
          bg: 'bg-critical-50',
          border: 'border-critical-200',
          text: 'text-critical-700',
          icon: 'text-critical-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-600'
        };
    }
  };

  // Get risk level icon
  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="h-8 w-8 text-success-600" />;
      case 'medium':
        return <AlertTriangle className="h-8 w-8 text-warning-600" />;
      case 'high':
        return <AlertTriangle className="h-8 w-8 text-danger-600" />;
      case 'critical':
        return <AlertTriangle className="h-8 w-8 text-critical-600" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-gray-600" />;
    }
  };

  // Get risk level description
  const getRiskLevelDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'You are managing your workload well and maintaining a healthy work-life balance.';
      case 'medium':
        return 'You are showing some signs of stress. Consider making small adjustments to prevent burnout.';
      case 'high':
        return 'You are at significant risk of burnout. Immediate action is recommended to improve your well-being.';
      case 'critical':
        return 'You are at critical risk of burnout. Please seek professional help and take immediate steps to reduce stress.';
      default:
        return 'Risk assessment in progress...';
    }
  };

  // Get trend indicator
  const getTrendIndicator = (riskScore: number) => {
    // Mock trend calculation (in real app, this would be based on historical data)
    const trend = riskScore > 60 ? 'increasing' : riskScore < 40 ? 'decreasing' : 'stable';
    
    switch (trend) {
      case 'increasing':
        return (
          <div className="flex items-center text-danger-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Increasing</span>
          </div>
        );
      case 'decreasing':
        return (
          <div className="flex items-center text-success-600">
            <TrendingDown className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Decreasing</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600">
            <div className="h-4 w-4 mr-1 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium">Stable</span>
          </div>
        );
    }
  };

  const riskLevel = data?.riskLevel || 'unknown';
  const riskScore = data?.riskScore || 0;
  const confidence = data?.confidence ?? 0;
  const style = getRiskLevelStyle(riskLevel);
  const normalizedConfidence = useMemo(() => {
    if (typeof confidence !== 'number' || Number.isNaN(confidence)) {
      return 0;
    }

    const confidenceValue = confidence <= 1 ? confidence * 100 : confidence;
    return Math.min(100, Math.max(0, confidenceValue));
  }, [confidence]);

  const handleViewDetails = useCallback(() => {
    if (!data) {
      return;
    }

    // Call parent callback to open modal instead of navigating
    if (onViewDetails) {
      onViewDetails();
    }
  }, [data, onViewDetails]);

  return (
    <div className={`card border-l-4 dark:bg-gray-800 dark:border-gray-700 ${style.border} transition-colors duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getRiskLevelIcon(riskLevel)}
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Burnout Risk Assessment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text} dark:bg-opacity-20`}>
            {riskLevel.toUpperCase()}
          </div>
          {getTrendIndicator(riskScore)}
        </div>
      </div>

      {/* Risk score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Score</span>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {riskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-1000 ${
              riskScore >= 75 
                ? 'bg-critical-500' 
                : riskScore >= 50 
                ? 'bg-danger-500' 
                : riskScore >= 25 
                ? 'bg-warning-500' 
                : 'bg-success-500'
            }`}
            style={{ width: `${riskScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Low (0-25)</span>
          <span>Medium (26-50)</span>
          <span>High (51-75)</span>
          <span>Critical (76-100)</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className={`text-sm ${style.text} dark:text-opacity-90`}>
          {getRiskLevelDescription(riskLevel)}
        </p>
      </div>

      {/* Confidence and data points */}
      <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${style.border} dark:border-gray-700`}>
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Level</span>
          <div className="flex items-center mt-1">
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${normalizedConfidence}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round(normalizedConfidence)}%
            </span>
          </div>
        </div>
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Data Points</span>
          <div className="mt-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {data?.dataPoints ? 
                Object.values(data.dataPoints).reduce((sum: number, val: any) => sum + val, 0) : 
                0
              }
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">analyzed</span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="mt-6">
        <button
          onClick={handleViewDetails}
          className="btn-primary w-full dark:bg-primary-600 dark:hover:bg-primary-700"
          type="button"
        >
          View Detailed Analysis
        </button>
      </div>
    </div>
  );
};

export default RiskCard;
