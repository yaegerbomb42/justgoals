import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './AppIcon';
import Button from './ui/Button';
import { geminiService } from '../services/geminiService';
import { useSettings } from '../context/SettingsContext';

const SmartPriorityManager = ({ 
  goals = [], 
  onGoalsReordered, 
  onClose,
  userContext = {} 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prioritizedGoals, setPrioritizedGoals] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const { settings } = useSettings();

  useEffect(() => {
    if (goals.length > 0) {
      handleSmartPrioritization();
    }
  }, [goals]);

  const handleSmartPrioritization = async () => {
    if (!settings?.geminiApiKey?.trim()) {
      alert('AI prioritization requires a Gemini API key. Please set it in Settings.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const enhancedContext = {
        ...userContext,
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.progress >= 100).length,
        overdue: goals.filter(g => g.deadline && new Date(g.deadline) < new Date()).length,
        categories: [...new Set(goals.map(g => g.category))],
        avgProgress: Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
      };

      const prioritized = await geminiService.prioritizeGoals(goals, enhancedContext);
      setPrioritizedGoals(prioritized);

      // Generate analysis summary
      const analysis = generateAnalysisSummary(prioritized);
      setAnalysisResults(analysis);

    } catch (error) {
      console.error('Error during smart prioritization:', error);
      alert('AI prioritization failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAnalysisSummary = (prioritized) => {
    const critical = prioritized.filter(g => g.aiPriorityScore >= 9);
    const high = prioritized.filter(g => g.aiPriorityScore >= 7 && g.aiPriorityScore < 9);
    const medium = prioritized.filter(g => g.aiPriorityScore >= 4 && g.aiPriorityScore < 7);
    const low = prioritized.filter(g => g.aiPriorityScore < 4);

    const impactAreas = {};
    prioritized.forEach(g => {
      if (g.aiImpactAreas) {
        g.aiImpactAreas.forEach(area => {
          impactAreas[area] = (impactAreas[area] || 0) + 1;
        });
      }
    });

    return {
      distribution: {
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length
      },
      topImpactAreas: Object.entries(impactAreas)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([area, count]) => ({ area, count })),
      recommendations: generateRecommendations(critical, high, prioritized)
    };
  };

  const generateRecommendations = (critical, high, all) => {
    const recommendations = [];

    if (critical.length > 2) {
      recommendations.push({
        type: 'warning',
        title: 'Too Many Critical Goals',
        message: `You have ${critical.length} critical goals. Consider focusing on max 2 critical goals to avoid burnout.`,
        icon: 'AlertTriangle'
      });
    }

    if (critical.length === 0 && high.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'No High-Priority Goals',
        message: 'Consider adding more ambitious goals to drive significant progress.',
        icon: 'TrendingUp'
      });
    }

    const healthGoals = all.filter(g => 
      g.aiImpactAreas?.includes('health') || 
      g.category?.toLowerCase().includes('health')
    );
    
    if (healthGoals.length === 0) {
      recommendations.push({
        type: 'suggestion',
        title: 'Health Foundation Missing',
        message: 'Consider adding health goals as they enable success in other areas.',
        icon: 'Heart'
      });
    }

    const overdueGoals = all.filter(g => 
      g.deadline && new Date(g.deadline) < new Date()
    );
    
    if (overdueGoals.length > 0) {
      recommendations.push({
        type: 'urgent',
        title: 'Overdue Goals Detected',
        message: `${overdueGoals.length} goals are overdue. Consider updating deadlines or breaking them down.`,
        icon: 'Clock'
      });
    }

    return recommendations;
  };

  const handleApplyPrioritization = () => {
    onGoalsReordered(prioritizedGoals);
    onClose();
  };

  const toggleDetails = (goalId) => {
    setShowDetails(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  const getPriorityColor = (score) => {
    if (score >= 9) return '#EF4444'; // Critical - Red
    if (score >= 7) return '#F59E0B'; // High - Orange
    if (score >= 4) return '#3B82F6'; // Medium - Blue
    return '#64748B'; // Low - Gray
  };

  const getPriorityLabel = (score) => {
    if (score >= 9) return 'Critical';
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  const getActionIcon = (action) => {
    const icons = {
      immediate_focus: 'Zap',
      schedule_soon: 'Calendar',
      maintain_progress: 'TrendingUp',
      defer: 'Clock',
      review: 'Eye'
    };
    return icons[action] || 'Target';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-surface border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Icon name="Brain" size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Smart Priority Analysis</h2>
              <p className="text-sm text-text-secondary">AI-powered strategic goal prioritization</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="Brain" size={24} color="#6366F1" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-text-primary mb-2">Analyzing Your Goals</h3>
                  <p className="text-text-secondary">Using strategic frameworks to prioritize what matters most...</p>
                </div>
              </div>
            ) : prioritizedGoals.length > 0 ? (
              <div className="space-y-4">
                {prioritizedGoals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-surface-700 border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-text-secondary">#{index + 1}</span>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getPriorityColor(goal.aiPriorityScore) }}
                            />
                            <span 
                              className="text-sm font-medium px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: `${getPriorityColor(goal.aiPriorityScore)}20`,
                                color: getPriorityColor(goal.aiPriorityScore)
                              }}
                            >
                              {getPriorityLabel(goal.aiPriorityScore)} ({goal.aiPriorityScore}/10)
                            </span>
                          </div>
                          {goal.aiRecommendedAction && (
                            <div className="flex items-center space-x-1 text-xs text-text-secondary">
                              <Icon name={getActionIcon(goal.aiRecommendedAction)} size={12} />
                              <span>{goal.aiRecommendedAction.replace(/_/g, ' ')}</span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-medium text-text-primary mb-1">{goal.title}</h3>
                        
                        <div className="flex items-center space-x-4 text-sm text-text-secondary mb-2">
                          <span>{goal.category}</span>
                          {goal.deadline && (
                            <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                          )}
                          <span>{goal.progress || 0}% complete</span>
                        </div>

                        {goal.aiReasoning && (
                          <div className="bg-surface-800 rounded-lg p-3 mb-2">
                            <p className="text-sm text-text-secondary">{goal.aiReasoning}</p>
                          </div>
                        )}

                        {goal.aiImpactAreas && goal.aiImpactAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {goal.aiImpactAreas.map((area) => (
                              <span
                                key={area}
                                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDetails(goal.id)}
                      >
                        <Icon name={showDetails[goal.id] ? 'ChevronUp' : 'ChevronDown'} size={16} />
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showDetails[goal.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 border-t border-border mt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-text-secondary">Confidence:</span>
                                <span className="ml-2 text-text-primary">{goal.aiConfidence}/10</span>
                              </div>
                              {goal.aiTimeframe && (
                                <div>
                                  <span className="text-text-secondary">Timeframe:</span>
                                  <span className="ml-2 text-text-primary">{goal.aiTimeframe.replace(/_/g, ' ')}</span>
                                </div>
                              )}
                            </div>
                            {goal.description && (
                              <div>
                                <span className="text-text-secondary text-sm">Description:</span>
                                <p className="text-text-primary text-sm mt-1">{goal.description}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="Target" size={48} color="#64748B" className="mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No Goals to Prioritize</h3>
                <p className="text-text-secondary">Add some goals to get AI-powered prioritization insights.</p>
              </div>
            )}
          </div>

          {/* Sidebar with Analysis */}
          {analysisResults && (
            <div className="w-80 border-l border-border p-6 overflow-y-auto">
              <h3 className="text-lg font-medium text-text-primary mb-4">Priority Analysis</h3>
              
              {/* Distribution Chart */}
              <div className="bg-surface-700 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-text-primary mb-3">Priority Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(analysisResults.distribution).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-text-secondary">{priority}</span>
                      <span className="text-text-primary font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Impact Areas */}
              {analysisResults.topImpactAreas.length > 0 && (
                <div className="bg-surface-700 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-text-primary mb-3">Focus Areas</h4>
                  <div className="space-y-2">
                    {analysisResults.topImpactAreas.map(({ area, count }) => (
                      <div key={area} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-text-secondary">{area}</span>
                        <span className="text-text-primary font-medium">{count} goals</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysisResults.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-text-primary">Recommendations</h4>
                  {analysisResults.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        rec.type === 'warning' ? 'bg-red-50 border-red-200 text-red-800' :
                        rec.type === 'urgent' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                        rec.type === 'suggestion' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        'bg-gray-50 border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <Icon name={rec.icon} size={16} className="mt-0.5" />
                        <div>
                          <h5 className="text-sm font-medium">{rec.title}</h5>
                          <p className="text-xs mt-1">{rec.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isAnalyzing && prioritizedGoals.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-border">
            <div className="text-sm text-text-secondary">
              AI analyzed {prioritizedGoals.length} goals using strategic prioritization frameworks
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={handleSmartPrioritization}>
                Re-analyze
              </Button>
              <Button variant="primary" onClick={handleApplyPrioritization}>
                Apply Prioritization
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SmartPriorityManager;
