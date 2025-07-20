import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getGoals } from '../../utils/goalUtils';
import geminiService from '../../services/geminiService';
import calendarSyncService from '../../services/calendarSyncService';

// Add Event Modal Component
const AddEventModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    title: '',
    time: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      setForm({ title: '', time: '', category: '', description: '' });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.time) return;
    onAdd({ ...form, completed: false });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-3 right-3 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-heading-bold mb-4">Add Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 rounded border border-border bg-surface-700 text-text-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input name="time" value={form.time} onChange={handleChange} type="time" className="w-full px-3 py-2 rounded border border-border bg-surface-700 text-text-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 rounded border border-border bg-surface-700 text-text-primary" placeholder="(Optional)" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 rounded border border-border bg-surface-700 text-text-primary" rows={2} placeholder="(Optional)" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary">Add Event</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Preferences Modal Component
const PreferencesModal = ({ isOpen, onClose, eventCount, setEventCount, novelty, setNovelty, onDriftPlan }) => {
  const [driftPrompt, setDriftPrompt] = useState('Help me plan my day based on my goals and schedule.');
  const [isDriftLoading, setIsDriftLoading] = useState(false);

  const handleDriftPlan = async () => {
    setIsDriftLoading(true);
    await onDriftPlan(driftPrompt);
    setIsDriftLoading(false);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-3 right-3 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-heading-bold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Number of Events</label>
            <select
              value={eventCount}
              onChange={e => setEventCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded border border-border bg-surface-700 text-text-primary"
            >
              {[5, 8, 11, 14, 18, 23].map(val => (
                <option key={val} value={val}>{val} events</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Novelty Level</label>
            <select
              value={novelty}
              onChange={e => setNovelty(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-surface-700 text-text-primary"
            >
              <option value="low">Low Novelty</option>
              <option value="balanced">Balanced</option>
              <option value="high">High Novelty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ask Drift for Help</label>
            <textarea
              value={driftPrompt}
              onChange={e => setDriftPrompt(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-surface-700 text-text-primary"
              rows={2}
              placeholder="Ask Drift to help plan your day..."
            />
            <Button
              onClick={handleDriftPlan}
              loading={isDriftLoading}
              iconName="Bot"
              className="mt-2"
            >
              Ask Drift
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DayPlanner = () => {
  const { user, isAuthenticated } = useAuth();
  const [dayPlan, setDayPlan] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventCount, setEventCount] = useState(7); // default
  const [novelty, setNovelty] = useState('balanced'); // options: 'low', 'balanced', 'high'
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Load API key
        const key = await geminiService.loadApiKey(user?.id);
        setApiKey(key);
        
        if (key) {
          // Test connection
          const result = await geminiService.testConnection(key);
          setIsConnected(result.success);
        }

        // Load existing plan for today
        loadExistingPlan(selectedDate);
      } catch (error) {
        console.error('Failed to initialize day planner:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [user?.id, selectedDate]);

  // Listen for API key changes
  useEffect(() => {
    const handleApiKeyChange = async (event) => {
      const newApiKey = event.detail.apiKey;
      setApiKey(newApiKey);
      
      if (newApiKey) {
        try {
          const result = await geminiService.testConnection(newApiKey);
          setIsConnected(result.success);
        } catch (error) {
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
      }
    };

    window.addEventListener('apiKeyChanged', handleApiKeyChange);
    return () => window.removeEventListener('apiKeyChanged', handleApiKeyChange);
  }, []);

  // Dopamine celebration logic
  useEffect(() => {
    if (dayPlan.length > 0 && dayPlan.every(ev => ev.completed)) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timeout);
    }
  }, [dayPlan]);

  // Sync completion with analytics
  useEffect(() => {
    if (dayPlan.length > 0) {
      const completed = dayPlan.filter(ev => ev.completed).length;
      const total = dayPlan.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      // Save to localStorage for analytics page
      const key = `day_completion_${user?.id}_${selectedDate}`;
      localStorage.setItem(key, JSON.stringify({ completed, total, percent, date: selectedDate }));
    }
  }, [dayPlan, user?.id, selectedDate]);

  // On mount, check Google Calendar link and sync events
  useEffect(() => {
    const checkAndSync = async () => {
      const token = await calendarSyncService.getGoogleAccessToken();
      setGoogleLinked(!!token);
      if (token) {
        setSyncStatus('Syncing with Google Calendar...');
        try {
          // Fetch Google Calendar events and merge into day plan
          const gcalEvents = await calendarSyncService.getGoogleCalendarEvents(token);
          // Merge logic: avoid duplicates by event id or title/time
          // (Assume setDayPlan and dayPlan are available in scope)
          setDayPlan(prev => {
            const existingIds = new Set(prev.map(ev => ev.externalId || ev.id));
            const merged = [...prev];
            for (const event of gcalEvents) {
              if (!existingIds.has(event.id)) {
                merged.push({
                  ...event,
                  externalId: event.id,
                  source: 'google_calendar',
                  completed: false,
                });
              }
            }
            return merged;
          });
          setSyncStatus('Google Calendar sync complete!');
        } catch (e) {
          setSyncStatus('Google Calendar sync failed.');
        }
      }
    };
    checkAndSync();
  }, []);

  // Handler to start OAuth flow
  const handleGoogleLink = () => {
    const redirectUri = window.location.origin + '/oauth2callback';
    window.location.href = calendarSyncService.getGoogleAuthUrl(redirectUri);
  };

  // Handler for /oauth2callback route (should be in a dedicated component/page)
  // On that page, extract ?code=... and call:
  // await calendarSyncService.handleOAuthCallback(code, redirectUri);

  // When adding a new event to the day plan, also add to Google Calendar
  const handleAddEvent = async (event) => {
    setDayPlan(prev => [...prev, event]);
    const token = await calendarSyncService.getGoogleAccessToken();
    if (token) {
      try {
        // Add reminder 0 minutes before event start
        const gcalEvent = {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] },
        };
        await calendarSyncService.createGoogleCalendarEvent(token, gcalEvent);
      } catch (e) {
        setSyncStatus('Failed to add event to Google Calendar.');
      }
    }
  };

  // Optionally auto-sync on mount if enabled
  useEffect(() => {
    if (user?.id) {
      calendarSyncService.initialize(user.id);
    }
  }, [user?.id]);

  const loadExistingPlan = (date) => {
    try {
      const planKey = `daily_plan_${user?.id}_${date}`;
      const savedPlan = localStorage.getItem(planKey);
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        if (Array.isArray(parsed)) {
          setDayPlan(parsed);
        }
      } else {
        setDayPlan([]);
      }
    } catch (error) {
      console.error('Failed to load existing plan:', error);
      setDayPlan([]);
    }
  };

  const savePlan = (plan) => {
    try {
      const planKey = `daily_plan_${user?.id}_${selectedDate}`;
      localStorage.setItem(planKey, JSON.stringify(plan));
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const generateDailyPlan = async () => {
    if (!isConnected || !apiKey) {
      alert('Please configure your Gemini API key in Settings first.');
      return;
    }

    setIsGenerating(true);
    try {
      // Get user's goals and preferences
      const goals = getGoals(user?.id) || [];
      const preferences = getUserPreferences();
      
      const userInfo = {
        goals: goals.map(goal => ({
          title: goal.title,
          category: goal.category,
          priority: goal.priority,
          progress: goal.progress
        })),
        preferences,
        selectedDate,
        eventCount,
        novelty
      };

      const plan = await geminiService.generateDailyPlan(userInfo);
      
      // Validate and set the plan
      if (Array.isArray(plan) && plan.length > 0) {
        setDayPlan(plan);
        savePlan(plan);
      } else {
        throw new Error('Invalid plan format received');
      }
    } catch (error) {
      console.error('Failed to generate daily plan:', error);
      alert('Failed to generate daily plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getUserPreferences = () => {
    try {
      const prefsKey = `planner_preferences_${user?.id}`;
      const saved = localStorage.getItem(prefsKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
    
    return {
      sleepFocus: 'balanced',
      taskDensity: 'balanced',
      customInstructions: ''
    };
  };

  const completePlanItem = (index) => {
    const updatedPlan = [...dayPlan];
    updatedPlan[index] = {
      ...updatedPlan[index],
      completed: !updatedPlan[index].completed
    };
    setDayPlan(updatedPlan);
    savePlan(updatedPlan);
  };

  const removePlanItem = (index) => {
    const updatedPlan = dayPlan.filter((_, i) => i !== index);
    setDayPlan(updatedPlan);
    savePlan(updatedPlan);
  };

  const addManualEvent = (event) => {
    const updatedPlan = [...dayPlan, event];
    setDayPlan(updatedPlan);
    savePlan(updatedPlan);
  };

  // Drift planning logic
  const handleDriftPlan = async (prompt) => {
    // Use geminiService.generateChatResponse to get a plan suggestion from Drift
    try {
      const aiResponse = await geminiService.generateChatResponse(prompt, { userId: user?.id, isAuthenticated });
      // Try to parse a plan from the AI response (expecting a JSON array)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          setDayPlan(parsed);
          savePlan(parsed);
          return;
        }
      }
      alert('Drift responded, but no valid plan was found.\n\nResponse:\n' + aiResponse);
    } catch (error) {
      alert('Failed to get a plan from Drift.');
    }
  };

  // Google Calendar sync handler
  const handleCalendarSync = async () => {
    if (!user?.id) return;
    setSyncStatus('Syncing with Google Calendar...');
    try {
      await calendarSyncService.syncCalendar(user.id);
      setSyncStatus('Google Calendar sync complete!');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      setSyncStatus('Google Calendar sync failed.');
      setTimeout(() => setSyncStatus(''), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Day Planner" />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading Day Planner...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Day Planner" />
      <AddEventModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddEvent} />
      <PreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        eventCount={eventCount}
        setEventCount={setEventCount}
        novelty={novelty}
        setNovelty={setNovelty}
        onDriftPlan={handleDriftPlan}
      />
      <div className="container mx-auto px-2 pt-24 max-w-4xl">
        {/* Google Calendar Sync Button */}
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            iconName="Calendar"
            onClick={handleGoogleLink}
            className="ml-2"
          >
            Link Google Calendar
          </Button>
        </div>
        {syncStatus && (
          <div className="text-center text-sm text-accent mb-2">{syncStatus}</div>
        )}
        {/* Dopamine Confetti Celebration */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="w-full flex flex-col items-center">
                <motion.h2
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="text-4xl font-extrabold text-success drop-shadow mb-4"
                >
                  🎉 All tasks complete! 🎉
                </motion.h2>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="confetti-pop"
                >
                  {/* Simple confetti dots */}
                  {[...Array(30)].map((_, i) => (
                    <span
                      key={i}
                      className="inline-block mx-1 my-0.5 rounded-full"
                      style={{
                        width: `${8 + Math.random() * 8}px`,
                        height: `${8 + Math.random() * 8}px`,
                        background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                        opacity: 0.7 + Math.random() * 0.3,
                        transform: `translateY(${Math.random() * 60 - 30}px) rotate(${Math.random() * 360}deg)`
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary drop-shadow mb-2">Day Planner</h1>
          <p className="text-lg text-text-secondary font-medium mb-2">Plan your day with AI-powered scheduling</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div></div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary"
            />
            <Button
              variant="outline"
              iconName="Settings"
              onClick={() => setShowPreferences(true)}
              className="ml-1"
            >
              Preferences
            </Button>
            {isConnected ? (
              <Button
                onClick={generateDailyPlan}
                loading={isGenerating}
                iconName="Calendar"
                iconPosition="left"
              >
                Generate Plan
              </Button>
            ) : (
              <div className="text-error text-sm">API key required</div>
            )}
            <Button
              variant="outline"
              iconName="Plus"
              onClick={() => setShowAddModal(true)}
              className="ml-1"
            >
              Add Event
            </Button>
          </div>
        </div>

        {!apiKey ? (
          <div className="text-center py-12">
            <Icon name="Calendar" className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">API Key Required</h3>
            <p className="text-text-secondary">
              Please configure your Gemini API key in Settings to generate daily plans.
            </p>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-12">
            <Icon name="AlertCircle" className="w-16 h-16 mx-auto text-error mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">Connection Failed</h3>
            <p className="text-text-secondary">
              Unable to connect to Gemini API. Please check your API key in Settings.
            </p>
          </div>
        ) : dayPlan.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Calendar" className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Plan Generated</h3>
            <p className="text-text-secondary mb-6">
              Generate an AI-powered daily plan based on your goals and preferences.
            </p>
            <Button
              onClick={generateDailyPlan}
              loading={isGenerating}
              iconName="Sparkles"
              iconPosition="left"
            >
              Generate Daily Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading-semibold text-text-primary">
                Plan for {new Date(selectedDate).toLocaleDateString()}
              </h2>
              <Button
                variant="outline"
                onClick={generateDailyPlan}
                loading={isGenerating}
                iconName="RefreshCw"
                iconPosition="left"
                size="sm"
              >
                Regenerate
              </Button>
            </div>

            <div className="space-y-3">
              {dayPlan.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, scale: item.completed ? 1.04 : 1 }}
                  transition={{ delay: index * 0.1, type: item.completed ? 'spring' : 'tween', stiffness: 300, damping: 15 }}
                  className={`bg-surface rounded-lg p-4 border border-border ${item.completed ? 'opacity-100 shadow-lg ring-2 ring-success/60' : ''} ${['goal','journal'].includes((item.category||'').toLowerCase()) ? 'ring-2 ring-primary/70' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => completePlanItem(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          item.completed
                            ? 'bg-success border-success text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {item.completed && <Icon name="Check" size={14} />}
                      </button>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-primary">
                            {item.time}
                          </span>
                          <span className={`font-body-medium ${
                            item.completed ? 'line-through text-text-muted' : 'text-text-primary'
                          }`}>
                            {item.title}
                          </span>
                          {item.category && (
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-text-secondary mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removePlanItem(index)}
                      className="text-text-muted hover:text-error transition-colors"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center pt-4">
              <p className="text-text-secondary text-sm">
                {dayPlan.filter(item => item.completed).length} of {dayPlan.length} tasks completed
              </p>
            </div>
          </div>
        )}
      </div>

      <FloatingActionButton />
    </div>
  );
};

export default DayPlanner;