// Chart component - Created by Balaji Koneti
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Props interface
interface ChartProps {
  data: any; // Chart data from parent component
}

// Chart component
const Chart: React.FC<ChartProps> = ({ data }) => {
  const { isDark } = useTheme();
  // State for chart type
  const [chartType, setChartType] = React.useState<'bar' | 'line' | 'pie'>('bar');

  // Mock data for demonstration
  const mockData = [
    { name: 'Workload', value: data?.factors?.workload || 0, color: '#ef4444' },
    { name: 'Stress', value: data?.factors?.stressLevel || 0, color: '#f59e0b' },
    { name: 'Work-Life Balance', value: data?.factors?.workLifeBalance || 0, color: '#22c55e' },
    { name: 'Social Support', value: data?.factors?.socialSupport || 0, color: '#3b82f6' },
    { name: 'Job Satisfaction', value: data?.factors?.jobSatisfaction || 0, color: '#8b5cf6' },
    { name: 'Physical Health', value: data?.factors?.physicalHealth || 0, color: '#06b6d4' },
    { name: 'Mental Health', value: data?.factors?.mentalHealth || 0, color: '#84cc16' },
    { name: 'Sleep Quality', value: data?.factors?.sleepQuality || 0, color: '#f97316' },
    { name: 'Exercise', value: data?.factors?.exerciseFrequency || 0, color: '#ec4899' },
    { name: 'Nutrition', value: data?.factors?.nutritionQuality || 0, color: '#10b981' }
  ];

  // Risk trend data (mock)
  const riskTrendData = [
    { date: 'Week 1', riskScore: 45, workload: 6, stress: 4 },
    { date: 'Week 2', riskScore: 52, workload: 7, stress: 5 },
    { date: 'Week 3', riskScore: 48, workload: 5, stress: 3 },
    { date: 'Week 4', riskScore: 65, workload: 8, stress: 7 },
    { date: 'Week 5', riskScore: 58, workload: 7, stress: 6 }
  ];

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 border rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Score: <span className="font-medium">{payload[0].value}/10</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const LineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 border rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span style={{ color: entry.color }}>{entry.dataKey}:</span> {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`p-3 border rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.name}</p>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Score: <span className="font-medium">{data.value}/10</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Risk Factor Analysis
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'bar' 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'line' 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'pie' 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <PieChartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: isDark ? '#d1d5db' : '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={[0, 10]}
                tick={{ fontSize: 12, fill: isDark ? '#d1d5db' : '#6b7280' }}
                label={{ value: 'Score (0-10)', angle: -90, position: 'insideLeft', fill: isDark ? '#d1d5db' : '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={riskTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: isDark ? '#d1d5db' : '#6b7280' }} />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: isDark ? '#d1d5db' : '#6b7280' }}
                label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: isDark ? '#d1d5db' : '#6b7280' }}
              />
              <Tooltip content={<LineTooltip />} />
              <Line 
                type="monotone" 
                dataKey="riskScore" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                name="Risk Score"
              />
              <Line 
                type="monotone" 
                dataKey="workload" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                name="Workload"
              />
              <Line 
                type="monotone" 
                dataKey="stress" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                name="Stress"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend for line chart */}
      {chartType === 'line' && (
        <div className="mt-4 flex justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Risk Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Workload</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Stress</span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Highest Risk Factor:</span>
            <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {mockData.reduce((max, item) => item.value > max.value ? item : max, mockData[0])?.name}
            </span>
          </div>
          <div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Average Score:</span>
            <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {(mockData.reduce((sum, item) => sum + item.value, 0) / mockData.length).toFixed(1)}/10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chart;
