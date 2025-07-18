import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import * as entityService from '../../services/entityManagementService';
import { getGoals, formatDate, getDaysUntilDeadline } from '../../utils/goalUtils';
import geminiService from '../../services/geminiService';
import DayProgressTracker from './components/DayProgressTracker';
import { useSettings } from '../../context/SettingsContext';

const Day = () => {
  const { user, isAuthenticated } = useAuth();
  const { settings, isLoading: settingsLoading } = useSettings();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyPlan, setDailyPlan] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [goals, setGoals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' or 'progress'
  const [showDriftChat, setShowDriftChat] = useState(false);
  const [plannerPreferences, setPlannerPreferences] = useState({
    sleepFocus: 'balanced', // 'more_sleep', 'balanced', 'less_sleep'
    taskDensity: 'balanced', // 'more_tasks', 'balanced', 'less_tasks'
    customInstructions: ''
  });
  const [planError, setPlanError] = useState(null);

  // Load planner preferences
  useEffect(() => {
    if (user?.id) {
      const prefsKey = `planner_preferences_${user.id}`;
      const savedPrefs = localStorage.getItem(prefsKey);
      if (savedPrefs) {
        try {
          setPlannerPreferences(JSON.parse(savedPrefs));
        } catch (error) {
          console.error('Error loading planner preferences:', error);
        }
      }
    }
  }, [user?.id]);

  // Save planner preferences
  const savePlannerPreferences = useCallback((prefs) => {
    if (!user?.id) return;
    
    const prefsKey = `planner_preferences_${user.id}`;
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
    setPlannerPreferences(prefs);
  }, [user?.id]);

  // Check Gemini service connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiKey = localStorage.getItem(`gemini_api_key_${user?.id}`);
        if (apiKey) {
          const connected = await geminiService.testConnection(apiKey);
          setIsConnected(connected.success);
        }
      } catch (error) {
        console.error('Error checking Gemini connection:', error);
        setIsConnected(false);
      }
    };
    
    if (user?.id) {
      checkConnection();
    }
  }, [user?.id]);

  // Load user data
  useEffect(() => {
    if (isAuthenticated && user) {
      const userGoals = getGoals(user.id);
      const userMilestones = entityService.getMilestones(user);
      setGoals(userGoals);
      setMilestones(userMilestones);
      loadDailyPlan(selectedDate);
    }
  }, [isAuthenticated, user, selectedDate]);

  // Load daily plan for selected date
  const loadDailyPlan = useCallback((date) => {
    if (!user?.id) return;
    
    const planKey = `daily_plan_${user.id}_${date}`;
    const savedPlan = localStorage.getItem(planKey);
    if (savedPlan) {
      try {
        setDailyPlan(JSON.parse(savedPlan));
      } catch (error) {
        console.error('Error loading daily plan:', error);
        setDailyPlan([]);
      }
    } else {
      setDailyPlan([]);
    }
  }, [user]);

  // Save daily plan
  const saveDailyPlan = useCallback((plan, date = selectedDate) => {
    if (!user?.id) return;
    
    const planKey = `daily_plan_${user.id}_${date}`;
    localStorage.setItem(planKey, JSON.stringify(plan));
  }, [user, selectedDate]);

  // Generate intelligent daily plan
  const generateDailyPlan = async () => {
    if (!isAuthenticated || !user) {
      alert('Please log in to generate a daily plan.');
      return;
    }
    if (settingsLoading) {
      setPlanError('Settings are still loading. Please wait and try again.');
      return;
    }
    if (isGenerating) return; // Prevent multiple generations
    setIsGenerating(true);
    setPlanError(null);
    try {
      // Test connection first
      const apiKey = localStorage.getItem(`gemini_api_key_${user.id}`);
      if (!apiKey) {
        setPlanError('Please configure your Gemini API key in Settings to generate intelligent daily plans.');
        setIsGenerating(false);
        return;
      }
      const connectionTest = await geminiService.testConnection(apiKey);
      if (!connectionTest.success) {
        throw new Error('API connection failed. Please check your API key.');
      }

      // Build preference instructions
      let preferenceInstructions = '';
      if (plannerPreferences.sleepFocus === 'more_sleep') {
        preferenceInstructions += 'Prioritize more sleep and relaxation time. Include longer breaks and fewer early/late activities. ';
      } else if (plannerPreferences.sleepFocus === 'less_sleep') {
        preferenceInstructions += 'Maximize productivity time. Include more activities and shorter breaks. ';
      }
      
      if (plannerPreferences.taskDensity === 'more_tasks') {
        preferenceInstructions += 'Create a packed schedule with many specific tasks and activities. ';
      } else if (plannerPreferences.taskDensity === 'less_tasks') {
        preferenceInstructions += 'Create a relaxed schedule with fewer, broader activities and more free time. ';
      }
      
      if (plannerPreferences.customInstructions) {
        preferenceInstructions += `Additional preferences: ${plannerPreferences.customInstructions} `;
      }

      const prompt = `
        You are Drift, an intelligent productivity assistant. Create a detailed daily schedule for ${selectedDate} based on the user's goals and milestones.

        USER GOALS:
        ${goals.length > 0 ? goals.map(g => `- ${g.title} (${g.category}, ${g.priority} priority, ${g.progress}% complete, deadline: ${g.deadline || 'none'})`).join('\n') : 'No goals set'}

        ACTIVE MILESTONES:
        ${milestones.filter(m => !m.completed).length > 0 ? milestones.filter(m => !m.completed).map(m => `- ${m.title} (${m.description || 'No description'})`).join('\n') : 'No active milestones'}

        USER PREFERENCES:
        ${preferenceInstructions || 'Standard balanced schedule'}

        REQUIREMENTS:
        1. Create a schedule from 7:00 AM to 11:00 PM
        2. Each activity should be 30-120 minutes
        3. Consider time of day energy levels:
           - Morning (7-12): High energy, learning, exercise
           - Afternoon (12-17): Focus work, skill development
           - Evening (17-23): Relaxation, review, creative activities
        4. Include breaks and transitions
        5. Make activities specific and actionable
        6. Prioritize high-priority goals
        7. Include activities that progress toward goals
        8. Mark goal-related activities with "goalRelated: true" and include "goalId" field
        9. Follow user preferences for sleep focus and task density

        RESPONSE FORMAT:
        Return ONLY a valid JSON array with this exact structure:
        [
          {
            "time": "07:00",
            "title": "Activity Name",
            "description": "Specific description of what to do",
            "category": "fitness|learning|work|personal|creative",
            "duration": 45,
            "priority": "high|medium|low",
            "goalId": "goal_id_if_applicable",
            "goalRelated": true|false,
            "relatedGoalTitle": "Goal title if goalRelated is true"
          }
        ]

        IMPORTANT: Return ONLY the JSON array, no other text or explanation.
      `;

      // Timeout wrapper for Gemini API call
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Plan generation timed out. Please try again later.')), 30000));
      let response;
      try {
        response = await Promise.race([
          geminiService.generateText(prompt, apiKey),
          timeoutPromise
        ]);
      } catch (err) {
        setPlanError(err.message || 'Plan generation failed.');
        setIsGenerating(false);
        console.error('[Day Plan] Generation error:', err);
        return;
      }
      
      // Try multiple ways to extract JSON
      let jsonData = null;
      
      // Method 1: Look for JSON array pattern
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        try {
          jsonData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse JSON match:', e);
        }
      }
      
      // Method 2: If no match, try parsing the entire response
      if (!jsonData) {
        try {
          jsonData = JSON.parse(response.trim());
        } catch (e) {
          console.error('Failed to parse full response as JSON:', e);
        }
      }
      
      // Method 3: Try to extract JSON from markdown code blocks
      if (!jsonData) {
        const codeBlockMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          try {
            jsonData = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.error('Failed to parse code block JSON:', e);
          }
        }
      }

      if (!jsonData || !Array.isArray(jsonData)) {
        console.error('AI Response:', response);
        throw new Error('Could not parse AI response into valid activity list. Please try again.');
      }

      // Defensive flattening and validation
      let flatJsonData = [];
      if (Array.isArray(jsonData)) {
        flatJsonData = jsonData.flat(Infinity).filter(item => item && typeof item === 'object' && !Array.isArray(item));
      }
      // Validate and format activities
      const formattedPlan = flatJsonData
        .filter(activity => typeof activity.time === 'string' && activity.title)
        .map((activity, index) => ({
          id: `activity_${Date.now()}_${index}`,
          time: activity.time || '09:00',
          title: activity.title || 'Untitled Activity',
          description: activity.description || 'No description provided',
          category: activity.category || 'general',
          duration: parseInt(activity.duration) || 60,
          priority: activity.priority || 'medium',
          goalId: activity.goalId || null,
          goalRelated: activity.goalRelated || false,
          relatedGoalTitle: activity.relatedGoalTitle || null,
          completed: false,
          createdAt: new Date().toISOString()
        }))
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      if (formattedPlan.length === 0) {
        throw new Error('No valid activities were generated. Please try again.');
      }
      setDailyPlan(formattedPlan);
      saveDailyPlan(formattedPlan);
      
    } catch (error) {
      setPlanError(error.message || 'Plan generation failed.');
      setIsGenerating(false);
      console.error('[Day Plan] Generation error:', error);
    }
  };

  // Mark activity as completed
  const toggleActivityCompletion = (activityId) => {
    const updatedPlan = dailyPlan.map(activity => 
      activity.id === activityId 
        ? { ...activity, completed: !activity.completed, completedAt: !activity.completed ? new Date().toISOString() : null }
        : activity
    );
    setDailyPlan(updatedPlan);
    saveDailyPlan(updatedPlan);
  };

  // Delete activity
  const deleteActivity = (activityId) => {
    const updatedPlan = dailyPlan.filter(activity => activity.id !== activityId);
    setDailyPlan(updatedPlan);
    saveDailyPlan(updatedPlan);
  };

  // Edit activity
  const startEditActivity = (activity) => {
    setEditActivity(activity);
    setIsEditing(true);
  };

  // Save edited activity
  const saveEditedActivity = () => {
    if (!editActivity) return;
    
    const updatedPlan = dailyPlan.map(activity => 
      activity.id === editActivity.id ? editActivity : activity
    );
    setDailyPlan(updatedPlan);
    saveDailyPlan(updatedPlan);
    setIsEditing(false);
    setEditActivity(null);
  };

  // Format time for display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get time-based styling with better contrast
  const getTimeBasedStyling = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) {
      return 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-sm';
    } else if (hour < 17) {
      return 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 shadow-sm';
    } else {
      return 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 shadow-sm';
    }
  };

  // Get time badge styling
  const getTimeBadgeStyling = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) {
      return 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md';
    } else if (hour < 17) {
      return 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md';
    } else {
      return 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md';
    }
  };

  // Get progress statistics
  const getProgressStats = () => {
    const total = dailyPlan.length;
    const completed = dailyPlan.filter(activity => activity.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const progressStats = getProgressStats();

  if (!isAuthenticated) {
    return <div>Please log in to access your daily plan.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-heading-bold text-text-primary">Daily Plan</h1>
                <p className="text-text-secondary">Intelligent scheduling for your goals</p>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary"
                />
                <button
                  onClick={() => setShowDriftChat(true)}
                  className="px-3 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2"
                >
                  <Icon name="MessageSquare" size={16} />
                  <span>Customize with Drift</span>
                </button>
                <Button
                  onClick={generateDailyPlan}
                  disabled={isGenerating}
                  loading={isGenerating}
                  iconName="Zap"
                  iconPosition="left"
                >
                  {isGenerating ? 'Generating...' : 'Generate Plan'}
                </Button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-surface-700 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('plan')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-body-medium transition-colors ${
                  activeTab === 'plan'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="Calendar" size={16} />
                  <span>Today's Plan</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-body-medium transition-colors ${
                  activeTab === 'progress'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="BarChart3" size={16} />
                  <span>Progress History</span>
                </div>
              </button>
            </div>

            {/* Progress Bar */}
            {activeTab === 'plan' && (
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body-medium text-text-primary">Daily Progress</span>
                  <span className="text-sm font-body-medium text-text-secondary">
                    {progressStats.completed}/{progressStats.total} completed
                  </span>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressStats.percentage}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-text-secondary">
                  {progressStats.percentage}% complete
                </div>
              </div>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'plan' ? (
            <div className="space-y-4">
              {planError && (
                <div className="bg-error/10 border border-error/20 text-error text-center p-4 mb-4 rounded">
                  <strong>{planError}</strong>
                </div>
              )}
              {dailyPlan.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Calendar" size={48} className="text-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-heading-medium text-text-primary mb-2">No plan for today</h3>
                  <p className="text-text-secondary mb-4">
                    Generate an intelligent daily plan based on your goals and milestones.
                  </p>
                  <Button
                    onClick={generateDailyPlan}
                    disabled={isGenerating}
                    loading={isGenerating}
                    iconName="Zap"
                    iconPosition="left"
                  >
                    Generate My Day
                  </Button>
                </div>
              ) : (
                dailyPlan
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${getTimeBasedStyling(activity.time)} ${
                        activity.completed ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getTimeBadgeStyling(activity.time)} hover:scale-105 transition-transform duration-200`}>
                              <span className="text-sm font-heading-bold">
                                {formatTime(activity.time)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {activity.goalRelated && (
                                <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-full">
                                  <Icon name="Target" size={12} className="text-primary" />
                                  <span className="text-xs font-body-medium text-primary">Goal</span>
                                </div>
                              )}
                              <h3 className={`text-lg font-heading-medium ${
                                activity.completed ? 'line-through text-text-muted' : 'text-text-primary'
                              }`}>
                                {activity.title}
                              </h3>
                              {activity.priority === 'high' && (
                                <span className="px-2 py-1 text-xs bg-error text-white rounded-full">High Priority</span>
                              )}
                            </div>
                            
                            <p className={`text-sm ${
                              activity.completed ? 'text-text-muted' : 'text-text-secondary'
                            }`}>
                              {activity.description}
                            </p>
                            
                            {activity.goalRelated && activity.relatedGoalTitle && (
                              <div className="mt-2 flex items-center space-x-2 text-xs text-primary">
                                <Icon name="ArrowRight" size={12} />
                                <span>Progressing: {activity.relatedGoalTitle}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 mt-2 text-xs text-text-muted">
                              <span className="flex items-center space-x-1">
                                <Icon name="Clock" size={12} />
                                <span>{activity.duration} min</span>
                              </span>
                              {activity.goalId && (
                                <span className="flex items-center space-x-1">
                                  <Icon name="Target" size={12} />
                                  <span>{goals.find(g => g.id === activity.goalId)?.title || 'Unknown Goal'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleActivityCompletion(activity.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              activity.completed 
                                ? 'bg-success text-white' 
                                : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                            }`}
                          >
                            <Icon name={activity.completed ? "Check" : "Circle"} size={16} />
                          </button>
                          
                          <button
                            onClick={() => startEditActivity(activity)}
                            className="p-2 rounded-lg bg-surface-700 text-text-secondary hover:bg-surface-600 transition-colors"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          
                          <button
                            onClick={() => deleteActivity(activity.id)}
                            className="p-2 rounded-lg bg-surface-700 text-text-secondary hover:bg-error hover:text-white transition-colors"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>
          ) : (
            <DayProgressTracker />
          )}
        </div>
      </div>

      <FloatingActionButton />

      {/* Drift Chat Modal for Planner Customization */}
      <AnimatePresence>
        {showDriftChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-heading-bold text-text-primary">Customize Daily Planner</h2>
                    <p className="text-text-secondary mt-1">Tell Drift how you want your daily plans to be generated</p>
                  </div>
                  <button
                    onClick={() => setShowDriftChat(false)}
                    className="p-2 rounded-lg bg-surface-700 text-text-secondary hover:bg-surface-600 transition-colors"
                  >
                    <Icon name="X" size={20} />
                  </button>
                </div>
              </div>

              {/* Quick Preference Buttons */}
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-heading-medium text-text-primary mb-4">Quick Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-body-medium text-text-primary mb-2">Sleep Focus</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => savePlannerPreferences({...plannerPreferences, sleepFocus: 'more_sleep'})}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          plannerPreferences.sleepFocus === 'more_sleep'
                            ? 'bg-primary text-white'
                            : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                        }`}
                      >
                        More Sleep
                      </button>
                      <button
                        onClick={() => savePlannerPreferences({...plannerPreferences, sleepFocus: 'balanced'})}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          plannerPreferences.sleepFocus === 'balanced'
                            ? 'bg-primary text-white'
                            : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                        }`}
                      >
                        Balanced
                      </button>
                      <button
                        onClick={() => savePlannerPreferences({...plannerPreferences, sleepFocus: 'less_sleep'})}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          plannerPreferences.sleepFocus === 'less_sleep'
                            ? 'bg-primary text-white'
                            : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                        }`}
                      >
                        Less Sleep
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-body-medium text-text-primary mb-2">Task Density</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => savePlannerPreferences({...plannerPreferences, taskDensity: 'less_tasks'})}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          plannerPreferences.taskDensity === 'less_tasks'
                            ? 'bg-primary text-white'
                            : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                        }`}
                      >
                        Fewer Tasks
                      </button>
                      <button
                        onClick={() => savePlannerPreferences({...plannerPreferences, taskDensity: 'balanced'})}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          plannerPreferences.taskDensity === 'balanced'
                            ? 'bg-primary text-white'
                            : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                        }`}
                      >
                        Balanced
                      </button>
                      <button
                        onClick={() => savePlannerPreferences({...plannerPreferences, taskDensity: 'more_tasks'})}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          plannerPreferences.taskDensity === 'more_tasks'
                            ? 'bg-primary text-white'
                            : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                        }`}
                      >
                        More Tasks
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="p-6">
                <h3 className="text-lg font-heading-medium text-text-primary mb-4">Custom Instructions</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Tell Drift specific preferences for your daily planning. For example:
                  "I prefer to exercise in the morning", "I need more breaks between tasks", "I want to focus on learning activities"
                </p>
                
                <textarea
                  value={plannerPreferences.customInstructions}
                  onChange={(e) => savePlannerPreferences({...plannerPreferences, customInstructions: e.target.value})}
                  placeholder="Enter your custom planning preferences..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary resize-none"
                  rows={4}
                />
                
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => {
                      savePlannerPreferences({...plannerPreferences, customInstructions: ''});
                      setShowDriftChat(false);
                    }}
                    className="px-4 py-2 bg-surface-700 text-text-secondary rounded-lg hover:bg-surface-600 transition-colors"
                  >
                    Clear & Close
                  </button>
                  <button
                    onClick={() => setShowDriftChat(false)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Save & Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Activity Modal */}
      <AnimatePresence>
        {isEditing && editActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-heading-medium text-text-primary mb-4">Edit Activity</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-2">Time</label>
                  <input
                    type="time"
                    value={editActivity.time}
                    onChange={(e) => setEditActivity({...editActivity, time: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-2">Title</label>
                  <input
                    type="text"
                    value={editActivity.title}
                    onChange={(e) => setEditActivity({...editActivity, title: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-2">Description</label>
                  <textarea
                    value={editActivity.description}
                    onChange={(e) => setEditActivity({...editActivity, description: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editActivity.duration}
                    onChange={(e) => setEditActivity({...editActivity, duration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={saveEditedActivity}
                  variant="primary"
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditActivity(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Day; 