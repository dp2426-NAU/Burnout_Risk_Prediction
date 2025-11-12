// Recommendation list component - Created by Balaji Koneti
import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Props interface
interface RecommendationListProps {
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'workload' | 'stress' | 'lifestyle' | 'social' | 'health';
    title: string;
    description: string;
    actionItems: string[];
    resources?: string[];
  }>;
}

// Recommendation list component
const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => {
  const { isDark } = useTheme();
  // State for expanded recommendations
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Toggle expanded state
  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-danger-50',
          border: 'border-danger-200',
          text: 'text-danger-700',
          icon: 'text-danger-600',
          badge: 'bg-danger-100 text-danger-800'
        };
      case 'medium':
        return {
          bg: 'bg-warning-50',
          border: 'border-warning-200',
          text: 'text-warning-700',
          icon: 'text-warning-600',
          badge: 'bg-warning-100 text-warning-800'
        };
      case 'low':
        return {
          bg: 'bg-success-50',
          border: 'border-success-200',
          text: 'text-success-700',
          icon: 'text-success-600',
          badge: 'bg-success-100 text-success-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workload':
        return <Clock className="h-5 w-5" />;
      case 'stress':
        return <AlertTriangle className="h-5 w-5" />;
      case 'lifestyle':
        return <CheckCircle className="h-5 w-5" />;
      case 'social':
        return <CheckCircle className="h-5 w-5" />;
      case 'health':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  // Get category name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'workload':
        return 'Workload Management';
      case 'stress':
        return 'Stress Management';
      case 'lifestyle':
        return 'Lifestyle';
      case 'social':
        return 'Social Support';
      case 'health':
        return 'Health & Wellness';
      default:
        return 'General';
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recommendations
        </h3>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No specific recommendations at this time.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Keep monitoring your well-being and maintain healthy habits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Personalized Recommendations
      </h3>
      
      <div className="space-y-4">
        {recommendations.map((recommendation, index) => {
          const isExpanded = expandedItems.has(index);
          const style = getPriorityStyle(recommendation.priority);
          
          return (
            <div
              key={index}
              className={`border rounded-lg ${style.border} ${style.bg} transition-all duration-200`}
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpanded(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={style.icon}>
                      {getCategoryIcon(recommendation.category)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {recommendation.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.badge}`}>
                          {recommendation.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getCategoryName(recommendation.category)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {recommendation.actionItems.length} actions
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className={`px-4 pb-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  {/* Description */}
                  <p className={`text-sm mt-4 ${style.text} dark:text-opacity-90`}>
                    {recommendation.description}
                  </p>

                  {/* Action items */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Action Items:
                    </h5>
                    <ul className="space-y-2">
                      {recommendation.actionItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources */}
                  {recommendation.resources && recommendation.resources.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Resources:
                      </h5>
                      <div className="space-y-1">
                        {recommendation.resources.map((resource, resourceIndex) => (
                          <a
                            key={resourceIndex}
                            href={resource}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {resource}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Recommendations are generated based on your current risk factors and patterns.
          Consider implementing these suggestions to improve your well-being.
        </p>
      </div>
    </div>
  );
};

export default RecommendationList;
