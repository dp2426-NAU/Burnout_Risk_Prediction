// Detailed Analysis Modal Component - Shows detailed burnout insights in a modal
import React, { useMemo } from 'react';
import { X, Info, BarChart3, Calendar, Mail, Clock, CheckCircle } from 'lucide-react';
import { DashboardData } from '../services/dashboardService';
import { useTheme } from '../contexts/ThemeContext';

interface DetailedAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DashboardData | null;
}

const DetailedAnalysisModal: React.FC<DetailedAnalysisModalProps> = ({ isOpen, onClose, data }) => {
  const { isDark } = useTheme();
  // Calculate normalized confidence
  const normalizedConfidence = useMemo(() => {
    const rawConfidence = data?.confidence ?? 0;
    const percentValue = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
    return Math.min(100, Math.max(0, percentValue));
  }, [data?.confidence]);

  // Calculate total data points
  const totalDataPoints = useMemo(() => {
    if (!data?.dataPoints) return 0;
    return Object.values(data.dataPoints).reduce((sum: number, val: any) => sum + val, 0);
  }, [data?.dataPoints]);

  // Get breakdown of data points
  const dataPointsBreakdown = useMemo(() => {
    if (!data?.dataPoints) return null;
    return {
      calendarEvents: data.dataPoints.calendarEvents || 0,
      emailMessages: data.dataPoints.emailMessages || 0,
      meetings: data.dataPoints.meetings || 0,
      tasksCompleted: data.dataPoints.tasksCompleted || 0
    };
  }, [data?.dataPoints]);

  if (!isOpen || !data) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className={`relative rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors duration-200 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Detailed Analysis</h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Confidence and data insights for your burnout risk assessment</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Confidence Level Section */}
            <div className={`bg-gradient-to-br rounded-lg p-6 border transition-colors duration-200 ${
              isDark 
                ? 'from-primary-900/30 to-primary-800/20 border-primary-700' 
                : 'from-primary-50 to-primary-100 border-primary-200'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <BarChart3 className={`h-8 w-8 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Confidence Level</h3>
                  <div className="mb-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`flex-1 rounded-full h-4 shadow-inner ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                        <div
                          className="bg-primary-500 h-4 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${normalizedConfidence}%` }}
                        />
                      </div>
                      <span className={`text-2xl font-bold min-w-[60px] text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {Math.round(normalizedConfidence)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Explanation */}
                  <div className={`rounded-lg p-4 border transition-colors duration-200 ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-primary-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                      <div>
                        <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>What is Confidence Level?</h4>
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          The confidence level represents how reliable the burnout risk assessment is based on the quality and quantity of data analyzed. It's calculated using a combination of factors:
                        </p>
                        <ul className={`text-sm space-y-2 list-disc list-inside ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <li><strong>Data Volume:</strong> More data points lead to higher confidence. With {totalDataPoints} data points analyzed, the model has sufficient information to make a reliable assessment.</li>
                          <li><strong>Data Recency:</strong> Recent data (within the last 7-30 days) is weighted more heavily than older data.</li>
                          <li><strong>Data Completeness:</strong> Complete datasets across all factors (workload, stress, work-life balance, etc.) increase confidence.</li>
                          <li><strong>Model Accuracy:</strong> The machine learning model's historical accuracy on similar data patterns contributes to the confidence score.</li>
                        </ul>
                        <div className={`mt-4 p-3 rounded border transition-colors duration-200 ${
                          isDark ? 'bg-primary-900/20 border-primary-700' : 'bg-primary-50 border-primary-200'
                        }`}>
                          <p className={`text-xs ${isDark ? 'text-primary-200' : 'text-primary-800'}`}>
                            <strong>Current Status:</strong> Your confidence level of {Math.round(normalizedConfidence)}% indicates a{' '}
                            {normalizedConfidence >= 80 ? 'highly reliable' : normalizedConfidence >= 60 ? 'reliable' : 'moderately reliable'}{' '}
                            assessment based on the available data.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Points Section */}
            <div className={`bg-gradient-to-br rounded-lg p-6 border transition-colors duration-200 ${
              isDark ? 'from-gray-700 to-gray-800 border-gray-600' : 'from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <BarChart3 className={`h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Data Points Analyzed</h3>
                  
                  {/* Total Data Points */}
                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2 mb-2">
                      <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalDataPoints}</span>
                      <span className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>total data points</span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  {dataPointsBreakdown && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className={`rounded-lg p-4 border text-center transition-colors duration-200 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <Calendar className={`h-6 w-6 mx-auto mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dataPointsBreakdown.calendarEvents}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Calendar Events</p>
                      </div>
                      <div className={`rounded-lg p-4 border text-center transition-colors duration-200 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <Mail className={`h-6 w-6 mx-auto mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dataPointsBreakdown.emailMessages}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email Messages</p>
                      </div>
                      <div className={`rounded-lg p-4 border text-center transition-colors duration-200 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <Clock className={`h-6 w-6 mx-auto mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dataPointsBreakdown.meetings}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Meetings</p>
                      </div>
                      <div className={`rounded-lg p-4 border text-center transition-colors duration-200 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <CheckCircle className={`h-6 w-6 mx-auto mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dataPointsBreakdown.tasksCompleted}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tasks Completed</p>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className={`rounded-lg p-4 border transition-colors duration-200 ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      <div>
                        <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>How Are Data Points Analyzed?</h4>
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Data points are collected from various sources and analyzed to assess your burnout risk:
                        </p>
                        <ul className={`text-sm space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <li className="flex items-start space-x-2">
                            <Calendar className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            <div>
                              <strong>Calendar Events & Meetings:</strong> The system analyzes your meeting frequency, duration, and timing. High meeting counts or back-to-back meetings can indicate workload pressure and reduced focus time.
                            </div>
                          </li>
                          <li className="flex items-start space-x-2">
                            <Mail className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                            <div>
                              <strong>Email Messages:</strong> Email volume and response patterns are tracked. High email counts, especially after hours, can signal work-life balance issues and communication overload.
                            </div>
                          </li>
                          <li className="flex items-start space-x-2">
                            <Clock className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                            <div>
                              <strong>Work Hours:</strong> Total work hours per week are calculated from calendar data and time logs. Consistent overtime (45+ hours/week) is a key indicator of burnout risk.
                            </div>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                            <div>
                              <strong>Task Completion:</strong> Task completion rates and patterns help identify workload pressure and deadline stress. Declining completion rates may indicate overwhelm.
                            </div>
                          </li>
                        </ul>
                        <div className={`mt-4 p-3 rounded border transition-colors duration-200 ${
                          isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <strong>Analysis Process:</strong> These data points are processed through machine learning algorithms that identify patterns, trends, and correlations. The model compares your current patterns against historical data from employees with similar profiles to predict burnout risk. Factors are weighted based on their impact on burnout (e.g., stress level and work-life balance have higher weights than exercise frequency).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className={`rounded-lg p-4 border transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Last Updated</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Assessment refreshed automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalysisModal;

