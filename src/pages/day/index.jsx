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

// Error boundary for the day planner
class DayErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Day Planner Error Boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-error text-center p-8">An error occurred: {this.state.error?.message || 'Unknown error'}<br/><button className="mt-4 px-4 py-2 bg-error text-white rounded" onClick={() => window.location.reload()}>Reload Page</button></div>;
    }
    return this.props.children;
  }
}

// Enhanced JSON parsing with 4-stage fallback strategy
function parseAIResponse(response) {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid response: must be a non-empty string');
  }

  // Stage 1: Extract from markdown code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Stage 1 parsing failed:', error);
    }
  }

  // Stage 2: Find JSON array patterns
  const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (jsonMatch && jsonMatch[0]) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Stage 2 parsing failed:', error);
    }
  }

  // Stage 3: Extract between first [ and last ]
  const firstBracket = response.indexOf('[');
  const lastBracket = response.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
    try {
      const jsonSubstring = response.substring(firstBracket, lastBracket + 1);
      const parsed = JSON.parse(jsonSubstring);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Stage 3 parsing failed:', error);
    }
  }

  // Stage 4: Parse entire response as fallback
  try {
    const cleanResponse = response.trim();
    const parsed = JSON.parse(cleanResponse);
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed && typeof parsed === 'object') {
      // If it's an object, try to extract an array property
      const possibleArrays = Object.values(parsed).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        return possibleArrays[0];
      }
    }
  } catch (error) {
    console.warn('Stage 4 parsing failed:', error);
  }

  throw new Error('Invalid response format: Could not extract valid JSON array from AI response');
}

// Robust plan data normalization
function normalizePlanData(input) {
  if (!input) return [];
  
  let data = input;
  if (typeof input === 'string') {
    try { 
      data = JSON.parse(input); 
    } catch { 
      return []; 
    }
  }
  
  if (!Array.isArray(data)) {
    if (data && typeof data === 'object') {
      data = [data];
    } else {
      return [];
    }
  }
  
  // Deep flatten and validate
  function deepFlatten(arr) {
    return arr.reduce((acc, val) => {
      if (Array.isArray(val)) {
        return acc.concat(deepFlatten(val));
      } else if (val && typeof val === 'object') {
        return acc.concat(val);
      }
      return acc;
    }, []);
  }
  
  const flat = deepFlatten(data).filter(
    item => item && typeof item === 'object' && 
    typeof item.time === 'string' && 
    typeof item.title === 'string'
  );
  
  return Array.isArray(flat) ? flat : [];
}

// Always normalize before setting dailyPlan
function safeSetDailyPlan(setDailyPlan, plan) {
  const normalized = normalizePlanData(plan);
  setDailyPlan(normalized);
}

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
  const [apiKey, setApiKey] = useState('');
  const [planError, setPlanError] = useState('');
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' or 'progress'
  const [showDriftChat, setShowDriftChat] = useState(false);
  const [plannerPreferences, setPlannerPreferences] = useState({
    sleepFocus: 'balanced',
    taskDensity: 'balanced',
    customInstructions: ''
  });
  // State for loading connection
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Load API key and test connection
  useEffect(() => {
    const loadApiKey = async () => {
      setIsTestingConnection(true);
      try {
        const key = geminiService.getApiKey(user?.id);
        setApiKey(key);
        if (key) {
          geminiService.initialize(key);
          const result = await geminiService.checkConnection(user?.id);
          setIsConnected(result.success);
          // Handle quota exceeded case
          if (result.status === 'quota_exceeded') {
            setPlanError('API quota exceeded. Please check your billing and try again later.');
          }
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsTestingConnection(false);
      }
    };
    loadApiKey();
  }, [user?.id]);

  // Listen for API key changes from Settings
  useEffect(() => {
    const handleApiKeyChange = async (event) => {
      const newApiKey = event.detail.apiKey;
      setApiKey(newApiKey);
      setIsTestingConnection(true);
      if (newApiKey) {
        geminiService.setApiKey(newApiKey, user?.id);
        const result = await geminiService.checkConnection(user?.id);
        setIsConnected(result.success);
        // Handle quota exceeded case
        if (result.status === 'quota_exceeded') {
          setPlanError('API quota exceeded. Please check your billing and try again later.');
        } else {
          setPlanError(''); // Clear any previous errors
        }
      } else {
        setIsConnected(false);
        setPlanError('');
      }
      setIsTestingConnection(false);
    };
    window.addEventListener('apiKeyChanged', handleApiKeyChange);
    return () => {
      window.removeEventListener('apiKeyChanged', handleApiKeyChange);
    };
  }, [user?.id]);

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

  // Load user goals and milestones
  useEffect(() => {
    if (isAuthenticated && user) {
      const userGoals = getGoals(user.id);
      const userMilestones = entityService.getMilestones(user);
      setGoals(userGoals);
      setMilestones(userMilestones);
    }
  }, [isAuthenticated, user]);

  // Load daily plan for selected date
  const loadDailyPlan = useCallback((date) => {
    if (!user?.id) return;
    
    const planKey = `daily_plan_${user.id}_${date}`;
    const savedPlan = localStorage.getItem(planKey);
    
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        const normalized = normalizePlanData(parsed);
        safeSetDailyPlan(setDailyPlan, normalized);
        setPlanError('');
      } catch (error) {
        console.error('Error loading plan:', error);
        setDailyPlan([]);
        setPlanError('Error loading daily plan. Plan has been cleared.');
        localStorage.removeItem(planKey);
      }
    } else {
      setDailyPlan([]);
      setPlanError('');
    }
  }, [user]);

  // Save daily plan
  const saveDailyPlan = useCallback((plan, date = selectedDate) => {
    if (!user?.id) return;
    
    const planKey = `daily_plan_${user.id}_${date}`;
    const normalized = normalizePlanData(plan);
    
    if (normalized.length > 0) {
      localStorage.setItem(planKey, JSON.stringify(normalized));
      safeSetDailyPlan(setDailyPlan, normalized);
      setPlanError('');
    } else {
      localStorage.removeItem(planKey);
      setDailyPlan([]);
      setPlanError('Plan data was invalid and has been reset.');
    }
  }, [user, selectedDate]);

  // Load plan when date changes
  useEffect(() => {
    loadDailyPlan(selectedDate);
  }, [selectedDate, loadDailyPlan]);

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
    
    if (isGenerating) return;
    
    setIsGenerating(true);
    setPlanError('');
    
    try {
      const key = geminiService.getApiKey(user?.id);
      if (!key) {
        setPlanError('Please configure your Gemini API key in Settings to generate intelligent daily plans.');
        setIsGenerating(false);
        return;
      }
      
      if (!isConnected) {
        setPlanError('API connection failed. Please check your API key.');
        setIsGenerating(false);
        return;
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
        5. Align with user's goals and milestones
        6. Respect user preferences for sleep and task density

        RESPONSE FORMAT:
        Return a JSON array of activities, each with:
        {
          "time": "HH:MM",
          "title": "Activity title",
          "description": "Brief description",
          "category": "work|exercise|learning|relaxation|personal",
          "duration": "30-120 minutes",
          "priority": "high|medium|low"
        }

        Make the schedule realistic and achievable. Include variety and balance.
      `;

      const response = await geminiService.generateResponse(prompt, key);
      
      try {
        // Use enhanced parsing with 4-stage fallback
        const generatedPlan = parseAIResponse(response);
        
        // Additional validation
        if (!Array.isArray(generatedPlan)) {
          throw new Error('Parsed response is not an array');
        }
        
        if (generatedPlan.length === 0) {
          throw new Error('Generated plan is empty');
        }
        
        // Validate each activity has required fields
        const validActivities = generatedPlan.filter(activity => 
          activity && 
          typeof activity === 'object' && 
          typeof activity.time === 'string' && 
          typeof activity.title === 'string'
        );
        
        if (validActivities.length === 0) {
          throw new Error('No valid activities found in generated plan');
        }
        
        saveDailyPlan(validActivities);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw response:', response);
        setPlanError(`Error parsing AI response: ${parseError.message}. Please try again.`);
      }
    } catch (error) {
      console.error('Error generating daily plan:', error);
      setPlanError(`Error generating plan: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Mark activity as completed
  const toggleActivityCompletion = (activityId) => {
    const updatedPlan = dailyPlan.map(activity => 
      activity.id === activityId 
        ? { ...activity, completed: !activity.completed, completedAt: !activity.completed ? new Date().toISOString() : null }
        : activity
    );
    saveDailyPlan(updatedPlan);
  };

  // Delete activity
  const deleteActivity = (activityId) => {
    const updatedPlan = dailyPlan.filter(activity => activity.id !== activityId);
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
    // Ensure dailyPlan is always an array
    console.log('DEBUG dailyPlan before filter:', dailyPlan, typeof dailyPlan, Array.isArray(dailyPlan));
    const planArray = Array.isArray(dailyPlan) ? dailyPlan : [];
    const total = planArray.length;
    const completed = planArray.filter(activity => activity && activity.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const progressStats = getProgressStats();

  // Reset all plan data
  const handleResetPlanData = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('daily_plan_')) {
        localStorage.removeItem(key);
      }
    });
    setDailyPlan([]);
    setPlanError('All plan data has been reset.');
  };

  if (!isAuthenticated) {
    return <div>Please log in to access your daily plan.</div>;
  }

  // Ensure dailyPlan is always an array for rendering
  const safeDailyPlan = Array.isArray(dailyPlan) ? dailyPlan : [];

  return (
    <DayErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header />
        {/* DEBUG PANEL */}
        <div style={{background:'#222',color:'#fff',padding:'8px',marginBottom:'8px',fontSize:'12px'}}>
          dailyPlan typeof: {typeof dailyPlan}, Array.isArray: {Array.isArray(dailyPlan) ? 'true' : 'false'}<br/>
          Value: {JSON.stringify(dailyPlan)}
        </div>
        <div className="pt-16 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Simple Connection Status */}
            {!isConnected && apiKey && !isTestingConnection && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                <div className="text-sm text-error">
                  ⚠️ API Key not connected. Please check your API key in Settings.
                </div>
              </div>
            )}
            {isTestingConnection ? (
              <div className="text-center py-12">
                <Icon name="MessageCircle" className="w-16 h-16 mx-auto text-text-muted mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">Testing Connection...</h3>
                <p className="text-text-secondary mb-6">Please wait while we verify your API key.</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : null}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-text-primary">Daily Planner</h1>
                  <p className="text-text-secondary">Plan your day with AI assistance</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowDriftChat(!showDriftChat)}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    <Icon name="MessageCircle" className="w-4 h-4 mr-2" />
                    AI Assistant
                  </Button>
                </div>
              </div>

              {/* Date Selector */}
              <div className="flex items-center space-x-4 mb-6">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary"
                />
                <Button
                  onClick={generateDailyPlan}
                  disabled={isGenerating || !isConnected}
                  className="bg-primary hover:bg-primary-dark disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon name="Sparkles" className="w-4 h-4 mr-2" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-surface-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('plan')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'plan'
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Daily Plan
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'progress'
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Progress Tracker
                </button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'plan' ? (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Progress Overview */}
                  {safeDailyPlan.length > 0 && (
                    <div className="bg-surface rounded-lg p-6 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">Today's Progress</h3>
                        <span className="text-sm text-text-secondary">
                          {progressStats.completed} of {progressStats.total} completed
                        </span>
                      </div>
                      <div className="w-full bg-surface-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progressStats.percentage}%` }}
                        />
                      </div>
                      <div className="mt-2 text-sm text-text-secondary">
                        {progressStats.percentage}% complete
                      </div>
                    </div>
                  )}

                  {/* Plan Activities */}
                  {safeDailyPlan.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Calendar" className="w-16 h-16 mx-auto text-text-muted mb-4" />
                      <h3 className="text-xl font-semibold text-text-primary mb-2">No Plan Yet</h3>
                      <p className="text-text-secondary mb-6">Generate an AI-powered daily plan to get started</p>
                      <Button
                        onClick={generateDailyPlan}
                        disabled={isGenerating || !isConnected}
                        className="bg-primary hover:bg-primary-dark disabled:opacity-50"
                      >
                        <Icon name="Sparkles" className="w-4 h-4 mr-2" />
                        Generate Plan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {safeDailyPlan
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((activity) => (
                          <motion.div
                            key={activity.id || `${activity.time}-${activity.title}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-lg border transition-all duration-200 ${getTimeBasedStyling(activity.time)} ${
                              activity.completed ? 'opacity-75' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTimeBadgeStyling(activity.time)}`}>
                                  {formatTime(activity.time)}
                                </div>
                                <div className="flex-1">
                                  <h4 className={`font-medium text-text-primary ${activity.completed ? 'line-through' : ''}`}>
                                    {activity.title}
                                  </h4>
                                  {activity.description && (
                                    <p className="text-sm text-text-secondary mt-1">{activity.description}</p>
                                  )}
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      activity.category === 'work' ? 'bg-blue-100 text-blue-800' :
                                      activity.category === 'exercise' ? 'bg-green-100 text-green-800' :
                                      activity.category === 'learning' ? 'bg-purple-100 text-purple-800' :
                                      activity.category === 'relaxation' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {activity.category}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      activity.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {activity.priority}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => toggleActivityCompletion(activity.id || `${activity.time}-${activity.title}`)}
                                  className={`p-2 rounded-full transition-colors ${
                                    activity.completed
                                      ? 'bg-success text-white'
                                      : 'bg-surface-700 text-text-muted hover:bg-surface-600'
                                  }`}
                                >
                                  <Icon name={activity.completed ? "Check" : "Circle"} className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => startEditActivity(activity)}
                                  className="p-2 rounded-full bg-surface-700 text-text-muted hover:bg-surface-600 transition-colors"
                                >
                                  <Icon name="Edit" className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteActivity(activity.id || `${activity.time}-${activity.title}`)}
                                  className="p-2 rounded-full bg-surface-700 text-text-muted hover:bg-error hover:text-white transition-colors"
                                >
                                  <Icon name="Trash" className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <DayProgressTracker />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <FloatingActionButton
          icon={<Icon name="plus" className="w-5 h-5" />}
          onClick={() => navigate('/focus-mode')}
          className="fixed bottom-6 right-6"
        />

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
                <h3 className="text-lg font-semibold text-text-primary mb-4">Edit Activity</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Time</label>
                    <input
                      type="time"
                      value={editActivity.time}
                      onChange={(e) => setEditActivity({...editActivity, time: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
                    <input
                      type="text"
                      value={editActivity.title}
                      onChange={(e) => setEditActivity({...editActivity, title: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
                    <textarea
                      value={editActivity.description}
                      onChange={(e) => setEditActivity({...editActivity, description: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
                    <select
                      value={editActivity.category}
                      onChange={(e) => setEditActivity({...editActivity, category: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                    >
                      <option value="work">Work</option>
                      <option value="exercise">Exercise</option>
                      <option value="learning">Learning</option>
                      <option value="relaxation">Relaxation</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Priority</label>
                    <select
                      value={editActivity.priority}
                      onChange={(e) => setEditActivity({...editActivity, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    onClick={saveEditedActivity}
                    className="flex-1 bg-primary hover:bg-primary-dark"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setEditActivity(null);
                    }}
                    className="flex-1 bg-surface-700 hover:bg-surface-600"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Planner Customization Modal */}
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
                      <h2 className="text-xl font-semibold text-text-primary">Customize Daily Planner</h2>
                      <p className="text-text-secondary mt-1">Tell Drift how you want your daily plans to be generated</p>
                    </div>
                    <button
                      onClick={() => setShowDriftChat(false)}
                      className="p-2 rounded-lg bg-surface-700 text-text-secondary hover:bg-surface-600 transition-colors"
                    >
                      <Icon name="X" className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick Preference Buttons */}
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Sleep Focus</label>
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
                      <label className="block text-sm font-medium text-text-primary mb-2">Task Density</label>
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
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Custom Instructions</h3>
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
      </div>
    </DayErrorBoundary>
  );
};

export default Day; 