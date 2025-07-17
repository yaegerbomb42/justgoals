import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const PredictiveInsights = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="mb-4 p-2 bg-warning/10 border border-warning/20 rounded text-warning">No predictive insights available.</div>;
  }
  const [selectedInsight, setSelectedInsight] = useState(null);

  if (!data.estimatedGoalCompletion && !data.productivityForecast) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Icon name="Zap" size={48} className="mx-auto mb-4 opacity-50" />
        <p>No predictive data available yet.</p>
        <p className="text-sm">Continue using the app to generate AI-powered insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Goal Completion Predictions */}
      {data.estimatedGoalCompletion && data.estimatedGoalCompletion.length > 0 && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Goal Completion Predictions</h4>
          <div className="space-y-3">
            {data.estimatedGoalCompletion.slice(0, 5).map((goal) => {
              const confidence = Math.max(60, 100 - Math.abs(goal.estimatedDaysToComplete - (goal.daysToDeadline || 30)) * 2);
              const isSelected = selectedInsight === goal.goalId;
              
              return (
                <div 
                  key={goal.goalId} 
                  className={`bg-surface-700 rounded-lg p-4 border transition-all cursor-pointer ${
                    isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedInsight(isSelected ? null : goal.goalId)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Icon name="Target" size={16} className="text-primary" />
                      <span className="font-body-medium text-text-primary truncate">
                        {goal.goalTitle}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.riskLevel === 'high' ? 'bg-error/20 text-error' :
                        goal.riskLevel === 'medium' ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
                      }`}>
                        {goal.riskLevel.toUpperCase()}
                      </span>
                      <Icon 
                        name={isSelected ? "ChevronUp" : "ChevronDown"} 
                        size={14} 
                        className="text-text-secondary" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-lg font-heading-bold text-success">
                        {goal.currentProgress}%
                      </div>
                      <div className="text-text-secondary">Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-heading-bold text-primary">
                        {Math.round(goal.estimatedDaysToComplete)}
                      </div>
                      <div className="text-text-secondary">Days to Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-heading-bold text-accent">
                        {confidence}%
                      </div>
                      <div className="text-text-secondary">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-heading-bold ${goal.onTrack ? 'text-success' : 'text-error'}`}>
                        {goal.onTrack ? 'On Track' : 'Behind'}
                      </div>
                      <div className="text-text-secondary">Status</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">Estimated completion:</span>
                          <span className="text-text-primary font-body-medium">
                            {new Date(goal.estimatedCompletionDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        {goal.daysToDeadline !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Days to deadline:</span>
                            <span className={`font-body-medium ${goal.daysToDeadline < 7 ? 'text-error' : 'text-text-primary'}`}>
                              {Math.round(goal.daysToDeadline)} days
                            </span>
                          </div>
                        )}
                        <div className="bg-primary/10 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Icon name="Zap" size={14} className="text-primary" />
                            <span className="text-sm font-body-medium text-primary">AI Prediction</span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            Based on your current progress rate of {goal.currentProgress}% and activity patterns, 
                            you're <strong>{confidence}% likely</strong> to complete this goal by{' '}
                            {new Date(goal.estimatedCompletionDate).toLocaleDateString()}.
                            {!goal.onTrack && ' Consider increasing your daily effort to stay on track.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Productivity Forecast */}
      {data.productivityForecast && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Productivity Forecast</h4>
          <div className="bg-surface-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">Trend</span>
              <span className={`text-sm font-body-medium ${
                data.productivityForecast.trend === 'improving' ? 'text-success' :
                data.productivityForecast.trend === 'declining' ? 'text-error' :
                'text-accent'
              }`}>
                {data.productivityForecast.trend.charAt(0).toUpperCase() + data.productivityForecast.trend.slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">Confidence</span>
              <span className="text-sm text-text-primary">
                {Math.round(data.productivityForecast.confidence)}%
              </span>
            </div>
            <div className="space-y-2">
              {data.productivityForecast.forecast.slice(0, 7).map((day, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">Day {day.day}</span>
                  <span className="text-text-primary">{day.predictedValue.toFixed(1)}</span>
                  <span className={`text-xs ${
                    day.trend === 'increasing' ? 'text-success' :
                    day.trend === 'decreasing' ? 'text-error' :
                    'text-accent'
                  }`}>
                    {day.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {data.riskAssessment && data.riskAssessment.length > 0 && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Risk Assessment</h4>
          <div className="space-y-3">
            {data.riskAssessment
              .filter(goal => goal.riskLevel === 'high')
              .slice(0, 3)
              .map((goal) => (
                <div key={goal.goalId} className="bg-error/10 border border-error/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body-medium text-text-primary">{goal.goalTitle}</span>
                    <span className="text-xs text-error">HIGH RISK</span>
                  </div>
                  <div className="space-y-1 text-xs text-text-secondary">
                    {goal.riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span>⚠️</span>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
        <h4 className="text-sm font-body-medium text-primary mb-3">AI Recommendations</h4>
        <div className="space-y-2 text-sm text-text-secondary">
          {data.estimatedGoalCompletion?.some(g => g.riskLevel === 'high') && (
            <p>🎯 <strong>Priority:</strong> Focus on high-risk goals to stay on track with deadlines.</p>
          )}
          {data.productivityForecast?.trend === 'declining' && (
            <p>📈 <strong>Trend:</strong> Your productivity is declining. Consider adjusting your routine or taking breaks.</p>
          )}
          {data.productivityForecast?.trend === 'improving' && (
            <p>🚀 <strong>Momentum:</strong> Great job! Your productivity is improving. Keep up the good work!</p>
          )}
          <p>💡 <strong>General:</strong> Use focus mode during your peak hours for maximum efficiency.</p>
          <p>📊 <strong>Tracking:</strong> Regular milestone updates help maintain momentum and track progress.</p>
        </div>
      </div>
    </div>
  );
};

export default PredictiveInsights; 