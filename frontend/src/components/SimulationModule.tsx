// Simulation Module Component - Interactive burnout risk simulation with modern two-column design
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';
import { Sliders, ArrowDown, ArrowUp, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SimulationModuleProps {
  userId?: string; // Optional userId for managers/admins viewing other employees
  baseWorkPatterns?: {
    workHoursPerWeek?: number;
    meetingHoursPerWeek?: number;
    sleepHours?: number;
    stressLevel?: number;
    workLifeBalance?: number;
    exerciseFrequency?: number;
  };
}

// Tooltip data for each slider
const sliderTooltips: Record<string, string> = {
  meetingHours: 'Reducing meeting hours increases focus time and lowers burnout risk',
  workHours: 'Working fewer hours per day improves work-life balance and reduces stress',
  sleepHours: 'Getting 7-9 hours of sleep significantly improves recovery and lowers burnout risk',
  stressLevel: 'Lower stress levels directly correlate with reduced burnout risk',
  workLifeBalance: 'Better work-life balance improves overall well-being and prevents burnout',
  exerciseFrequency: 'Regular exercise helps manage stress and improves mental health'
};

const SimulationModule: React.FC<SimulationModuleProps> = ({ userId, baseWorkPatterns }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [hoveredSlider, setHoveredSlider] = useState<string | null>(null);
  
  // Simulation parameters
  const [meetingHours, setMeetingHours] = useState<number>(
    baseWorkPatterns?.meetingHoursPerWeek ? baseWorkPatterns.meetingHoursPerWeek / 5 : 2
  );
  const [workHours, setWorkHours] = useState<number>(
    baseWorkPatterns?.workHoursPerWeek ? baseWorkPatterns.workHoursPerWeek / 5 : 8
  );
  const [sleepHours, setSleepHours] = useState<number>(
    baseWorkPatterns?.sleepHours || 7
  );
  const [stressLevel, setStressLevel] = useState<number>(
    baseWorkPatterns?.stressLevel || 5
  );
  const [workLifeBalance, setWorkLifeBalance] = useState<number>(
    baseWorkPatterns?.workLifeBalance || 5
  );
  const [exerciseFrequency, setExerciseFrequency] = useState<number>(
    baseWorkPatterns?.exerciseFrequency || 5
  );

  // Update sliders when baseWorkPatterns change
  useEffect(() => {
    if (baseWorkPatterns) {
      setMeetingHours(baseWorkPatterns.meetingHoursPerWeek ? baseWorkPatterns.meetingHoursPerWeek / 5 : 2);
      setWorkHours(baseWorkPatterns.workHoursPerWeek ? baseWorkPatterns.workHoursPerWeek / 5 : 8);
      setSleepHours(baseWorkPatterns.sleepHours || 7);
      setStressLevel(baseWorkPatterns.stressLevel || 5);
      setWorkLifeBalance(baseWorkPatterns.workLifeBalance || 5);
      setExerciseFrequency(baseWorkPatterns.exerciseFrequency || 5);
    }
  }, [baseWorkPatterns]);

  // Debounced simulation call
  const runSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dashboardService.simulateBurnoutRisk({
        meetingHours: meetingHours * 5, // Convert daily to weekly
        workHours: workHours * 5, // Convert daily to weekly
        sleepHours,
        stressLevel,
        workLifeBalance,
        exerciseFrequency,
        userId: userId || (user?.role === 'manager' || user?.role === 'admin' ? undefined : undefined)
      });

      if (result) {
        setSimulationResult(result);
      }
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setLoading(false);
    }
  }, [meetingHours, workHours, sleepHours, stressLevel, workLifeBalance, exerciseFrequency, userId, user]);

  // Run simulation when parameters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 300); // Reduced debounce for more responsive feel

    return () => clearTimeout(timer);
  }, [runSimulation]);

  const riskScoreChange = simulationResult?.changes?.riskScoreChange || 0;
  const baseRiskScore = simulationResult?.baseRiskScore || 0;
  const simulatedRiskScore = simulationResult?.simulatedRiskScore || baseRiskScore;

  // Generate summary sentence
  const summarySentence = useMemo(() => {
    if (!simulationResult || riskScoreChange === 0) {
      return 'Adjust the sliders to see how different work patterns affect your burnout risk.';
    }

    const absChange = Math.abs(riskScoreChange);
    const isImprovement = riskScoreChange < 0;
    
    if (isImprovement) {
      const improvements: string[] = [];
      if (sleepHours >= 7) improvements.push('maintaining balanced sleep');
      if (stressLevel < 6) improvements.push('reducing stress');
      if (workLifeBalance >= 6) improvements.push('improving work-life balance');
      if (workHours <= 8) improvements.push('working reasonable hours');
      
      const improvementText = improvements.length > 0 
        ? improvements.slice(0, 2).join(' and ')
        : 'these adjustments';
      
      return `Adjusting work patterns has improved your burnout score by ${absChange}%. ${improvements.length > 0 ? `Maintaining ${improvementText} can further lower your risk.` : 'Continue monitoring your patterns to maintain this improvement.'}`;
    } else {
      return `These adjustments increase your burnout risk by ${absChange}%. Consider reducing work hours, managing stress, or improving work-life balance to lower your risk.`;
    }
  }, [simulationResult, riskScoreChange, sleepHours, stressLevel, workLifeBalance, workHours]);

  // Custom slider component
  const SliderInput: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    formatValue: (value: number) => string;
    sliderKey: string;
    tooltip: string;
  }> = ({ label, value, min, max, step, onChange, formatValue, sliderKey, tooltip }) => {
    const percentage = ((value - min) / (max - min)) * 100;
    
    return (
      <div 
        className="relative"
        onMouseEnter={() => setHoveredSlider(sliderKey)}
        onMouseLeave={() => setHoveredSlider(null)}
      >
        <div className="flex items-center justify-between mb-2">
          <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
          <span className={`text-sm font-semibold bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
            {formatValue(value)}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={`w-full h-3 rounded-full appearance-none cursor-pointer slider-custom ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            style={{
              background: `linear-gradient(to right, 
                #3b82f6 0%, 
                #3b82f6 ${percentage}%, 
                ${isDark ? '#374151' : '#e5e7eb'} ${percentage}%, 
                ${isDark ? '#374151' : '#e5e7eb'} 100%)`
            }}
          />
          {/* Tooltip */}
          {hoveredSlider === sliderKey && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-200 text-xs rounded-lg shadow-lg z-10 whitespace-nowrap border border-gray-700">
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'text-critical-600';
      case 'high': return 'text-danger-600';
      case 'medium': return 'text-warning-600';
      case 'low': return 'text-success-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-6">
        <Sliders className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Burnout Risk Simulation</h2>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Interactive Controls */}
        <div className="space-y-6">
          <SliderInput
            label="Meeting Hours per Day"
            value={meetingHours}
            min={0}
            max={8}
            step={0.5}
            onChange={setMeetingHours}
            formatValue={(v) => `${v.toFixed(1)}h`}
            sliderKey="meetingHours"
            tooltip={sliderTooltips.meetingHours}
          />

          <SliderInput
            label="Work Hours per Day"
            value={workHours}
            min={4}
            max={12}
            step={0.5}
            onChange={setWorkHours}
            formatValue={(v) => `${v.toFixed(1)}h`}
            sliderKey="workHours"
            tooltip={sliderTooltips.workHours}
          />

          <SliderInput
            label="Sleep Hours per Night"
            value={sleepHours}
            min={4}
            max={10}
            step={0.5}
            onChange={setSleepHours}
            formatValue={(v) => `${v.toFixed(1)}h`}
            sliderKey="sleepHours"
            tooltip={sliderTooltips.sleepHours}
          />

          <SliderInput
            label="Stress Level (1-10)"
            value={stressLevel}
            min={1}
            max={10}
            step={1}
            onChange={setStressLevel}
            formatValue={(v) => `${v}`}
            sliderKey="stressLevel"
            tooltip={sliderTooltips.stressLevel}
          />

          <SliderInput
            label="Work-Life Balance (1-10)"
            value={workLifeBalance}
            min={1}
            max={10}
            step={1}
            onChange={setWorkLifeBalance}
            formatValue={(v) => `${v}`}
            sliderKey="workLifeBalance"
            tooltip={sliderTooltips.workLifeBalance}
          />

          <SliderInput
            label="Exercise Frequency (1-10)"
            value={exerciseFrequency}
            min={1}
            max={10}
            step={1}
            onChange={setExerciseFrequency}
            formatValue={(v) => `${v}`}
            sliderKey="exerciseFrequency"
            tooltip={sliderTooltips.exerciseFrequency}
          />
        </div>

        {/* Right Side - Simulation Results Panel */}
        <div className={`lg:pl-6 lg:border-l ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Simulation Results</h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mb-3"></div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Calculating...</p>
            </div>
          ) : simulationResult ? (
            <div className="space-y-6">
              {/* Base Risk Score */}
              <div className={`rounded-lg p-5 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Base Risk Score</p>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{baseRiskScore}%</span>
                  <span className={`text-sm font-medium capitalize ${getRiskLevelColor(simulationResult.baseRiskLevel)}`}>
                    {simulationResult.baseRiskLevel}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current predicted burnout risk</p>
              </div>

              {/* Simulated Risk Score */}
              <div className={`rounded-lg p-5 border-2 transition-all duration-500 ${
                riskScoreChange < 0 
                  ? isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                  : riskScoreChange > 0 
                  ? isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
                  : isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Simulated Risk Score</p>
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`text-3xl font-bold ${
                    riskScoreChange < 0 ? 'text-green-700 dark:text-green-400' : riskScoreChange > 0 ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'
                  }`}>
                    {simulatedRiskScore}%
                  </span>
                  {riskScoreChange !== 0 && (
                    <div className={`flex items-center space-x-1 ${
                      riskScoreChange < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {riskScoreChange < 0 ? (
                        <>
                          <ArrowDown className="w-5 h-5" />
                          <span className="text-sm font-semibold">Improved</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-5 h-5" />
                          <span className="text-sm font-semibold">Increased</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium capitalize ${
                    riskScoreChange < 0 
                      ? 'text-green-700 dark:text-green-400' 
                      : riskScoreChange > 0 
                      ? 'text-red-700 dark:text-red-400'
                      : getRiskLevelColor(simulationResult.simulatedRiskLevel)
                  }`}>
                    {simulationResult.simulatedRiskLevel}
                  </span>
                  {riskScoreChange !== 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      riskScoreChange < 0 
                        ? isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                        : isDark ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
                    }`}>
                      {riskScoreChange > 0 ? '+' : ''}{riskScoreChange}%
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>New predicted score after adjustments</p>
              </div>

              {/* Summary Sentence */}
              <div className={`rounded-lg p-4 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start space-x-2">
                  <Info className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{summarySentence}</p>
                </div>
              </div>

              {/* Progress Animation */}
              {riskScoreChange !== 0 && (
                <div className="space-y-2">
                  <div className={`flex justify-between text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>Base Score</span>
                    <span>Simulated Score</span>
                  </div>
                  <div className={`relative h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${
                        riskScoreChange < 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${baseRiskScore}%` }}
                    />
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out opacity-50 ${
                        riskScoreChange < 0 ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${simulatedRiskScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-sm">Adjust sliders to see simulation results</p>
            </div>
          )}
        </div>
      </div>

      {/* Custom slider styles */}
      <style>{`
        .slider-custom::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        .slider-custom::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
        }
        .slider-custom::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        .slider-custom::-moz-range-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
};

export default SimulationModule;
