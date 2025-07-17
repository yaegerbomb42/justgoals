import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef here
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import Button from '../../components/ui/Button';
import GoalSelector from './components/GoalSelector';
import FocusTimer from './components/FocusTimer';
import SessionNotes from './components/SessionNotes';
import SessionSettings from './components/SessionSettings';
import SessionStats from './components/SessionStats';
import ExitConfirmation from './components/ExitConfirmation';
import QuickLinksPanel from './components/QuickLinksPanel';
import FocusFloatingActions from './components/FocusFloatingActions';
import * as entityService from '../../services/entityManagementService';
import notificationManager from '../../utils/notificationUtils';

const soundMap = {
  none: '',
  rain: '/assets/sounds/rain.mp3',
  forest: '/assets/sounds/forest.mp3',
  ocean: '/assets/sounds/ocean.mp3',
  cafe: '/assets/sounds/cafe.mp3',
  whitenoise: '/assets/sounds/whitenoise.mp3',
  chime: '/assets/sounds/chime.mp3'
};

// Utility to check if a sound file exists
const checkSoundFileExists = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
};

const FocusMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const audioRef = useRef(null); // Ref for the audio element

  const getStorageKey = useCallback((baseKey) => {
    if (user && user.id) {
      return `${baseKey}_${user.id}`;
    }
    return null;
  }, [user]);
  
  // Load goals using entityService instead of mock data
  const [goals, setGoals] = useState([]);

  // Load goals using the entity service
  useEffect(() => {
    if (isAuthenticated && user) {
      const userGoals = entityService.getGoals(user);
      setGoals(userGoals);
    } else {
      setGoals([]);
    }
  }, [isAuthenticated, user]);

  // State management
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    id: null, startTime: null, elapsed: 0, goal: null, notes: [], isActive: false
  });
  
  // Local session settings (e.g., for UI like background, completion sound if specific to this page)
  // These might be distinct from the global app settings for focus mode durations / ambient sound choice
  const [localSessionSettings, setLocalSessionSettings] = useState({
    background: 'solid',
    completionSound: 'chime', // This seems specific to this page's timer completion
    // breakReminders: true // This might come from global settings.focusMode.autoStartBreaks
  });

  // Global focus mode settings (from main app settings)
  const [globalFocusSettings, setGlobalFocusSettings] = useState({
    defaultDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    soundEnabled: true,
    selectedAmbientSound: 'none',
    autoStartBreaks: true,
  });

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalFocusTime: 0, sessionsToday: 0, currentStreak: 0
  });
  const [sessionSettings, setSessionSettings] = useState({
    background: 'solid',
    completionSound: 'chime',
    autoStartBreaks: true
  });
  const [sessionNotes, setSessionNotes] = useState([]);
  const [sessionLinks, setSessionLinks] = useState([]);

  // Initialize from URL params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const goalId = params.get('goalId');
    if (goalId) {
      const goal = goals.find(g => g.id === parseInt(goalId));
      if (goal) setSelectedGoal(goal);
    }

    // Load session stats from user-specific localStorage
    if (isAuthenticated && user) {
      const statsKey = getStorageKey('focus_session_stats');
      if (statsKey) {
        const savedStats = localStorage.getItem(statsKey);
        if (savedStats) {
          try { setSessionStats(JSON.parse(savedStats)); }
          catch (e) { console.error("Error parsing session stats:", e); }
        } else {
          setSessionStats({ totalFocusTime: 0, sessionsToday: 0, currentStreak: 0 });
        }
      }
    } else {
      setSessionStats({ totalFocusTime: 0, sessionsToday: 0, currentStreak: 0 });
    }

    // Load local session settings (background, completion sound)
    const savedLocalSettings = localStorage.getItem('focus_page_local_settings'); // More specific key
    if (savedLocalSettings) {
      try { setLocalSessionSettings(JSON.parse(savedLocalSettings)); }
      catch (e) { console.error("Error parsing local focus settings:", e); }
    }

    // Load global focus settings from main app settings
    if (isAuthenticated && user) {
      const appSettingsKey = getStorageKey('app_settings'); // Uses user ID
      if (appSettingsKey) {
        const allAppSettingsText = localStorage.getItem(appSettingsKey);
        if (allAppSettingsText) {
          try {
            const allAppSettings = JSON.parse(allAppSettingsText);
            if (allAppSettings && allAppSettings.focusMode) {
              setGlobalFocusSettings(prev => ({ ...prev, ...allAppSettings.focusMode }));
            }
          } catch (e) { console.error("Error parsing global app settings for focus mode:", e); }
        }
      }
    }
    // If not authenticated or no user, globalFocusSettings will retain its defaults
    // which include soundEnabled: true, selectedAmbientSound: 'none'

  }, [location.search, isAuthenticated, user, getStorageKey, goals]);

  // Save user-specific stats to localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      const statsKey = getStorageKey('focus_session_stats');
      if (statsKey) {
        localStorage.setItem(statsKey, JSON.stringify(sessionStats));
      }
    }
  }, [sessionStats, isAuthenticated, user, getStorageKey]);

  // Save local session settings to localStorage
  useEffect(() => {
    localStorage.setItem('focus_page_local_settings', JSON.stringify(localSessionSettings));
  }, [localSessionSettings]);

  // Effect for handling ambient sound playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const { soundEnabled, selectedAmbientSound } = globalFocusSettings;
    const soundFile = soundMap[selectedAmbientSound];

    let cancelled = false;

    const playAmbient = async () => {
      if (isTimerActive && soundEnabled && soundFile && selectedAmbientSound !== 'none') {
        // Check if file exists before playing
        const exists = await checkSoundFileExists(soundFile);
        if (!exists) {
          console.warn(`Ambient sound file missing: ${soundFile}`);
          return;
        }
        if (audio.src !== window.location.origin + soundFile) {
          audio.src = soundFile;
        }
        audio.loop = true;
        audio.volume = 0.3;
        try {
          await audio.play();
        } catch (error) {
          console.error('Error playing ambient sound:', error);
          audio.play().catch(e => console.warn('Could not play audio:', e));
        }
      } else {
        // Fade out audio smoothly
        if (audio.volume > 0) {
          const fadeOut = setInterval(() => {
            if (audio.volume > 0.1) {
              audio.volume -= 0.1;
            } else {
              audio.pause();
              audio.volume = 0.3;
              clearInterval(fadeOut);
            }
          }, 100);
        } else {
          audio.pause();
        }
      }
    };

    playAmbient();

    // Cleanup
    return () => {
      cancelled = true;
      if (audio) {
        audio.pause();
        audio.volume = 0.3;
      }
    };
  }, [isTimerActive, globalFocusSettings.soundEnabled, globalFocusSettings.selectedAmbientSound]);


  const startSession = () => {
    if (!selectedGoal) return;
    // Duration should now come from globalFocusSettings.defaultDuration (in minutes)
    // The timer itself likely expects seconds, so this needs to be handled by FocusTimer or here.
    // For now, FocusTimer might still use its own internal duration logic based on props.
    // The currentSession.elapsed is in seconds.
    
    const sessionId = Date.now();
    setCurrentSession({
      id: sessionId,
      startTime: Date.now(),
      elapsed: 0,
      goal: selectedGoal,
      notes: [],
      isActive: true
    });
    setIsTimerActive(true);
  };

  const pauseSession = () => {
    setIsTimerActive(false);
    setCurrentSession(prev => ({ ...prev, isActive: false }));
  };

  const resumeSession = () => {
    setIsTimerActive(true);
    setCurrentSession(prev => ({ ...prev, isActive: true }));
  };

  const stopSession = () => {
    if (currentSession.elapsed > 60) { // Only show confirmation if session > 1 minute
      setShowExitConfirmation(true);
    } else {
      endSession();
    }
  };

  const endSession = async () => {
    if (!currentSession.isActive) return;

    const sessionData = {
      id: currentSession.id,
      startTime: currentSession.startTime,
      endTime: Date.now(),
      elapsed: currentSession.elapsed,
      goal: currentSession.goal,
      notes: sessionNotes.filter(note => note.type === 'permanent'), // Only save permanent notes
      links: sessionLinks,
      temporaryNotesCount: sessionNotes.filter(note => note.type === 'temporary').length
    };

    // Play completion sound
    if (sessionSettings.completionSound !== 'none') {
      const chimeUrl = soundMap.chime;
      const exists = await checkSoundFileExists(chimeUrl);
      if (exists) {
        const chimeAudio = new Audio(chimeUrl);
        chimeAudio.volume = 0.5;
        chimeAudio.play().catch(e => console.warn('Could not play completion sound:', e));
      } else {
        console.warn(`Chime sound file missing: ${chimeUrl}`);
      }
    }

    // Send completion notification
    notificationManager.sendSessionCompleteNotification(sessionData);

    // Show completion celebration
    const celebration = document.querySelector('.timer-container');
    if (celebration) {
      celebration.classList.add('micro-celebration');
      setTimeout(() => celebration.classList.remove('micro-celebration'), 800);
    }

    // Save session to history
    if (isAuthenticated && user) {
      const historyKey = getStorageKey('focus_session_history');
      if (historyKey) {
        try {
          const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
          existingHistory.unshift(sessionData);
          // Keep only last 50 sessions
          const trimmedHistory = existingHistory.slice(0, 50);
          localStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
        } catch (e) {
          console.error("Error saving session history:", e);
        }
      }
    }

    // Update stats
    setSessionStats(prev => ({
      totalFocusTime: prev.totalFocusTime + currentSession.elapsed,
      sessionsToday: prev.sessionsToday + 1,
      currentStreak: prev.currentStreak // Streak calculation is handled elsewhere
    }));

    // Reset session and clear temporary data
    setCurrentSession({
      id: null,
      startTime: null,
      elapsed: 0,
      goal: null,
      notes: [],
      isActive: false
    });
    setSessionNotes([]); // Clear all notes (temporary ones are lost)
    setSessionLinks([]); // Clear session-specific links
    setIsTimerActive(false);
  };

  const resetSession = () => {
    setIsTimerActive(false);
    setCurrentSession(prev => ({
      ...prev,
      elapsed: 0,
      isActive: false
    }));
  };

  // const handleTimerComplete = () => { // No longer directly used by stopwatch
  //   // Play completion sound
  //   if (sessionSettings.completionSound !== 'none') {
  //     // In a real app, you would play the actual sound here
  //     console.log(`Playing ${sessionSettings.completionSound} sound`);
  //   }

  //   // Show completion celebration
  //   const celebration = document.querySelector('.timer-container');
  //   if (celebration) {
  //     celebration.classList.add('micro-celebration');
  //     setTimeout(() => celebration.classList.remove('micro-celebration'), 800);
  //   }

  //   // Auto-end session
  //   endSession();
  // };

  const handleTimeUpdate = (newElapsedTime) => {
    setCurrentSession(prev => ({ ...prev, elapsed: newElapsedTime }));
  };

  const handleGoalChange = (goal) => {
    setSelectedGoal(goal);
    // Update URL without navigation
    const params = new URLSearchParams(location.search);
    params.set('goalId', goal.id.toString());
    window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  };

  const handleSaveNote = (note) => {
    setSessionNotes(prev => [...prev, note]);
  };

  const handleSessionNotesChange = (notes) => {
    setSessionNotes(notes);
  };

  const handleSessionLinksChange = (links) => {
    setSessionLinks(links);
  };

  const handleLinkClick = (link) => {
    // Track link usage for analytics if needed
    console.log('Link clicked:', link.title);
  };

  const handleToggleNotes = () => {
    setIsNotesOpen(!isNotesOpen);
    if (isLinksOpen) setIsLinksOpen(false);
  };

  const handleToggleLinks = () => {
    setIsLinksOpen(!isLinksOpen);
    if (isNotesOpen) setIsNotesOpen(false);
  };

  const handleSettingsChange = (newSettings) => {
    setSessionSettings(newSettings);
  };

  const handleExit = () => {
    if (currentSession.isActive && currentSession.elapsed > 60) {
      setShowExitConfirmation(true);
    } else {
      navigate('/goals-dashboard');
    }
  };

  const confirmExit = () => {
    if (currentSession.isActive) {
      endSession();
    }
    navigate('/goals-dashboard');
  };

  const getBackgroundClass = () => {
    switch (localSessionSettings.background) { // Use localSessionSettings
      case 'gradient':
        return 'bg-gradient-to-br from-background via-surface to-background';
      case 'pattern':
        return 'bg-background relative';
      default:
        return 'bg-background';
    }
  };

  // When user changes ambient sound in settings, update globalFocusSettings and persist
  const handleAmbientSoundChange = (soundId) => {
    setGlobalFocusSettings(prev => {
      const updated = { ...prev, selectedAmbientSound: soundId };
      // Persist to user settings
      const settingsKey = getStorageKey('app_settings');
      if (settingsKey) {
        const existing = localStorage.getItem(settingsKey);
        let settings = {};
        if (existing) {
          try { settings = JSON.parse(existing); } catch {}
        }
        settings.focusMode = { ...settings.focusMode, ...updated };
        localStorage.setItem(settingsKey, JSON.stringify(settings));
      }
      return updated;
    });
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()} relative overflow-hidden`}>
      <audio ref={audioRef} />
      {/* Background Pattern */}
      {localSessionSettings.background === 'pattern' && ( // Use localSessionSettings
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            iconName="ArrowLeft"
            iconPosition="left"
          >
            Exit Focus
          </Button>
          
          {selectedGoal && (
            <div className="flex items-center space-x-2 text-text-secondary text-sm">
              <Icon name="Target" size={16} />
              <span>Focusing on: {selectedGoal.title}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            iconName="Settings"
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 space-y-8">
        {/* Goal Selection */}
        {!currentSession.isActive && (
          <div className="w-full max-w-md">
            <GoalSelector
              selectedGoal={selectedGoal}
              onGoalChange={handleGoalChange}
              goals={goals}
            />
          </div>
        )}

        {/* Timer Container */}
        <div className="timer-container">
          <FocusTimer
            onTimeUpdate={handleTimeUpdate}
            isActive={isTimerActive}
            onToggle={isTimerActive ? pauseSession : (currentSession.id ? resumeSession : startSession)}
            onReset={resetSession}
            onStop={stopSession}
          />
        </div>

        {/* Session Stats */}
        <SessionStats
          currentSession={currentSession}
          totalFocusTime={sessionStats.totalFocusTime}
          sessionsToday={sessionStats.sessionsToday}
          selectedGoal={selectedGoal}
        />

        {/* Quick Actions */}
        {!currentSession.isActive && selectedGoal && (
          <div className="flex items-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={startSession}
              iconName="Play"
              iconPosition="left"
              className="px-8"
            >
              Start Focus Session
            </Button>
          </div>
        )}
      </div>

      {/* Session Notes */}
      <SessionNotes
        isOpen={isNotesOpen}
        onToggle={handleToggleNotes}
        sessionId={currentSession.id}
        goalId={selectedGoal?.id}
        onSaveNote={handleSaveNote}
        sessionNotes={sessionNotes}
        onSessionNotesChange={handleSessionNotesChange}
      />

      {/* Quick Links Panel */}
      <QuickLinksPanel
        isOpen={isLinksOpen}
        onToggle={handleToggleLinks}
        sessionId={currentSession.id}
        onLinkClick={handleLinkClick}
        sessionLinks={sessionLinks}
        onSessionLinksChange={handleSessionLinksChange}
      />

      {/* Settings Modal */}
      <SessionSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={sessionSettings}
        onSettingsChange={handleSettingsChange}
        onAmbientSoundChange={handleAmbientSoundChange}
      />

      {/* Exit Confirmation */}
      <ExitConfirmation
        isOpen={showExitConfirmation}
        onConfirm={confirmExit}
        onCancel={() => setShowExitConfirmation(false)}
        sessionData={{
          elapsed: currentSession.elapsed,
          goal: currentSession.goal,
          notesCount: sessionNotes.length
        }}
      />

      {/* Floating Action Button */}
      <FocusFloatingActions
        onToggleNotes={handleToggleNotes}
        onToggleLinks={handleToggleLinks}
        notesCount={sessionNotes.length}
        linksCount={sessionLinks.length}
        isNotesOpen={isNotesOpen}
        isLinksOpen={isLinksOpen}
      />
    </div>
  );
};

export default FocusMode;