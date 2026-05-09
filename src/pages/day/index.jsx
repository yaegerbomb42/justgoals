import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Page from '../../components/ui/Page';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { getGoals } from '../../utils/goalUtils';
import { geminiService } from '../../services/geminiService';
import calendarSyncService from '../../services/calendarSyncService';
import { useSettings } from '../../context/SettingsContext';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon="Calendar"
      title="Add Event"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-700/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Time</label>
          <input name="time" value={form.time} onChange={handleChange} type="time" className="w-full px-3 py-2 rounded-lg border border-border bg-surface-700/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
          <input name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-700/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" placeholder="(Optional)" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-700/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" rows={2} placeholder="(Optional)" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Add Event</Button>
        </div>
      </form>
    </Modal>
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon="Settings"
      title="Preferences"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Number of Events</label>
          <select
            value={eventCount}
            onChange={e => setEventCount(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-700/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          >
            {[5, 8, 11, 14, 18, 23].map(val => (
              <option key={val} value={val}>{val} events</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Novelty Level</label>
          <select
            value={novelty}
            onChange={e => setNovelty(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-700/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          >
            <option value="low">Low Novelty</option>
            <option value="balanced">Balanced</option>
            <option value="high">High Novelty</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Ask Drift for Help</label>
          <textarea
            value={driftPrompt}
            onChange={e => setDriftPrompt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-700/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
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
    </Modal>
  );
};

const DayPlanner = () => {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const [dayPlan, setDayPlan] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
        // const key = await geminiService.loadApiKey(user?.id); // Removed
        // setApiKey(key); // Removed
        
        // if (key) { // Removed
        //   // Test connection // Removed
        //   const result = await geminiService.testConnection(key); // Removed
        //   setIsConnected(result.success); // Removed
        // } // Removed

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
      // const newApiKey = event.detail.apiKey; // Removed
      // setApiKey(newApiKey); // Removed
      
      // if (newApiKey) { // Removed
      //   try { // Removed
      //     const result = await geminiService.testConnection(newApiKey); // Removed
      //     setIsConnected(result.success); // Removed
      //   } catch (error) { // Removed
      //     setIsConnected(false); // Removed
      //   } // Removed
      // } else { // Removed
      //   setIsConnected(false); // Removed
      // } // Removed
    };

    window.addEventListener('apiKeyChanged', handleApiKeyChange);
    return () => window.removeEventListener('apiKeyChanged', handleApiKeyChange);
  }, []);

  // Add effect to test API key connection when it changes
  useEffect(() => {
    const testApiKey = async () => {
      if (settings.geminiApiKey) {
        try {
          const result = await geminiService.testConnection(settings.geminiApiKey);
          setIsConnected(result.success);
        } catch {
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
      }
    };
    testApiKey();
  }, [settings.geminiApiKey]);

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
    try {
      const redirectUri = window.location.origin + '/oauth2callback';
      const authUrl = calendarSyncService.getGoogleAuthUrl(redirectUri);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google OAuth setup error:', error);
      setSyncStatus('Google Calendar integration not configured. The app works great without it!');
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  // Alternative: Skip Google Calendar setup
  const handleSkipGoogleCalendar = () => {
    setGoogleLinked(true); // Pretend it's linked to avoid the setup screen
    setSyncStatus('Google Calendar integration skipped. You can always enable it later in Settings.');
    setTimeout(() => setSyncStatus(''), 3000);
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

  // In generateDailyPlan and other places, use settings.geminiApiKey
  const generateDailyPlan = async () => {
    if (!isConnected || !settings.geminiApiKey) {
      alert('Please configure your Gemini API key in Settings first.');
      return;
    }

    setIsGenerating(true);
    try {
      // Get user's goals and preferences
      const goals = getGoals(user?.id) || [];
      const preferences = getUserPreferences();
      
      // Call generateDailyPlan with correct parameters
      const plan = await geminiService.generateDailyPlan(goals, preferences);
      
      // Validate and set the plan
      if (Array.isArray(plan) && plan.length > 0) {
        // Add IDs and completion status to each task
        const processedPlan = plan.map((task, index) => ({
          ...task,
          id: Date.now() + index,
          completed: false,
          createdAt: new Date().toISOString()
        }));
        setDayPlan(processedPlan);
        savePlan(processedPlan);
      } else if (typeof plan === 'string') {
        // If we get a string response, show it to the user
        alert(`Daily plan generated:\n\n${plan.substring(0, 500)}...`);
      } else {
        throw new Error('Invalid plan format received');
      }
    } catch (error) {
      console.error('Failed to generate daily plan:', error);
      const errorMessage = error.message.includes('API key') 
        ? 'Please configure your Gemini API key in Settings to generate daily plans.'
        : 'Failed to generate daily plan. Please try again.';
      alert(errorMessage);
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

  // Enhanced Drift planning logic with better error handling
  const handleDriftPlan = async (prompt) => {
    if (!settings?.geminiApiKey) {
      alert('Please configure your Gemini API key in Settings to use Drift planning.');
      return;
    }

    setIsGenerating(true);
    try {
      // Create a more specific prompt for day planning
      const enhancedPrompt = `Create a daily schedule for: "${prompt}"

Please return a JSON array of tasks/events for the day. Each item should have:
- title: string (task name)
- startTime: string (e.g. "09:00")
- endTime: string (e.g. "10:00") 
- description: string (brief description)
- priority: string ("high", "medium", "low")
- type: string ("work", "personal", "health", "break")

Example format:
[
  {
    "title": "Morning Exercise",
    "startTime": "07:00",
    "endTime": "08:00",
    "description": "30-min workout",
    "priority": "high",
    "type": "health"
  }
]

Focus on realistic timing and achievable goals. Return ONLY the JSON array.`;

      const aiResponse = await geminiService.generateContent(enhancedPrompt);
      
      // Clean and parse the response
      const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Add completion status and IDs to each item
            const processedPlan = parsed.map((item, index) => ({
              ...item,
              id: Date.now() + index,
              completed: false,
              createdAt: new Date().toISOString()
            }));
            
            setDayPlan(processedPlan);
            savePlan(processedPlan);
            return;
          }
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
        }
      }
      
      // Fallback: show AI response if no valid JSON found
      alert(`Drift responded but couldn't create a structured plan. Response:\n\n${aiResponse.substring(0, 300)}...`);
      
    } catch (error) {
      console.error('Drift planning error:', error);
      alert('Failed to get a plan from Drift. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
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
      <Page width="lg">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-text-secondary">Loading Day Planner...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page width="lg">
      <PageHeader
        icon="Calendar"
        title="Day"
        subtitle="Plan your day with AI-powered scheduling"
        actions={(
          <>
            <Button
              variant="outline"
              iconName="Calendar"
              onClick={handleGoogleLink}
              size="sm"
            >
              Link Calendar
            </Button>
            <Button
              variant="outline"
              iconName="Settings"
              onClick={() => setShowPreferences(true)}
              size="sm"
            >
              Preferences
            </Button>
            <Button
              variant="primary"
              iconName="Plus"
              onClick={() => setShowAddModal(true)}
              size="sm"
            >
              Add Event
            </Button>
          </>
        )}
      />
      {syncStatus && (
        <div className="text-center text-sm text-accent mb-4">{syncStatus}</div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
        {isConnected ? (
          <Button
            onClick={generateDailyPlan}
            loading={isGenerating}
            iconName="Sparkles"
            iconPosition="left"
          >
            Generate Plan
          </Button>
        ) : (
          <div className="text-error text-sm">API key required</div>
        )}
      </div>

      {!settings.geminiApiKey ? (
        <EmptyState
          icon="Key"
          title="API Key Required"
          description="Please configure your Gemini API key in Settings to generate daily plans."
          size="lg"
        />
      ) : !isConnected ? (
        <EmptyState
          icon="AlertCircle"
          title="Connection Failed"
          description="Unable to connect to Gemini API. Please check your API key in Settings."
          size="lg"
        />
      ) : dayPlan.length === 0 ? (
        <EmptyState
          icon="Calendar"
          title="No Plan Generated"
          description="Generate an AI-powered daily plan based on your goals and preferences."
          action={(
            <Button
              onClick={generateDailyPlan}
              loading={isGenerating}
              iconName="Sparkles"
              iconPosition="left"
            >
              Generate Daily Plan
            </Button>
          )}
          size="lg"
        />
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

      <FloatingActionButton />

      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(event) => {
          // Map AddEventModal form { title, time, category, description, completed } to dayPlan item
          addManualEvent({
            id: Date.now(),
            title: event.title,
            time: event.time,
            category: event.category,
            description: event.description,
            completed: false,
            createdAt: new Date().toISOString(),
          });
        }}
      />

      <PreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        eventCount={eventCount}
        setEventCount={setEventCount}
        novelty={novelty}
        setNovelty={setNovelty}
        onDriftPlan={handleDriftPlan}
      />
    </Page>
  );
};

export default DayPlanner;