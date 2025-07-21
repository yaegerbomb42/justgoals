import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import Button from '../../components/ui/Button';
import GoalSelector from './components/GoalSelector';
import FocusTimer from './components/FocusTimer';
import SessionNotes from './components/SessionNotes';
import SessionSettings from './components/SessionSettings';
import SessionStats from './components/SessionStats';
import ExitConfirmation from './components/ExitConfirmation';
import QuickLinksPanel from './components/QuickLinksPanel';
import FocusFloatingActions from './components/FocusFloatingActions';
import FlowingParticlesBackground from '../../components/ui/FlowingParticlesBackground';
import AmbientSoundPlayer from '../../components/ui/AmbientSoundPlayer';
import * as entityService from '../../services/entityManagementService';

const soundMap = {
  none: '',
  rain: '/assets/sounds/11L-Rain_(5_files)_rain_-1752354095970.mp3',
  forest: '/assets/sounds/11L-Forest_(5_files)_bir-1752354108854.mp3',
  ocean: '/assets/sounds/11L-Ocean_(5_files)_wave-1752354117569.mp3',
  cafe: '/assets/sounds/11L-Cafe_(5_files)_coffe-1752354124665.mp3',
  whitenoise: '/assets/sounds/11L-White_Noise_(4_files-1752354130068.mp3',
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

const getGoalChatKey = (goalId, userId) => `goal_chat_${userId}_${goalId}`;

const FocusMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { settings, updateFocusModeSettings } = useSettings();

  const getStorageKey = useCallback((baseKey) => {
    if (user && user.id) {
      return `${baseKey}_${user.id}`;
    }
    return null;
  }, [user]);
  
  // Load goals using entityService
  const [goals, setGoals] = useState([]);

  // Load goals using the entity service
  useEffect(() => {
    const loadGoals = async () => {
      if (isAuthenticated && user) {
        try {
          const userGoals = await entityService.getGoals(user);
          setGoals(userGoals);
        } catch (error) {
          console.error('Error loading goals for focus mode:', error);
          setGoals([]);
        }
      } else {
        setGoals([]);
      }
    };
    
    loadGoals();
  }, [isAuthenticated, user]);

  // State management
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    id: null, startTime: null, elapsed: 0, goal: null, notes: [], isActive: false
  });
  
  // Local session settings for UI-specific settings
  const [localSessionSettings, setLocalSessionSettings] = useState({
    background: 'solid',
    completionSound: 'chime',
  });

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalFocusTime: 0, sessionsToday: 0, currentStreak: 0
  });
  const [sessionNotes, setSessionNotes] = useState([]);
  const [sessionLinks, setSessionLinks] = useState([]);
  const [goalChatMessages, setGoalChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);

  // Get focus mode settings from the new settings context
  const focusSettings = settings?.focusMode || {
    defaultDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: true,
    autoStartSessions: false,
    ambientSounds: true,
    backgroundEffects: true,
    soundVolume: 0.5,
  };

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
    const savedLocalSettings = localStorage.getItem('focus_page_local_settings');
    if (savedLocalSettings) {
      try { setLocalSessionSettings(JSON.parse(savedLocalSettings)); }
      catch (e) { console.error("Error parsing local focus settings:", e); }
    }

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

  // Load goal chat history
  useEffect(() => {
    const loadChat = async () => {
      if (selectedGoal && isAuthenticated && user) {
        const chatKey = getGoalChatKey(selectedGoal.id, user.id);
        const savedChat = localStorage.getItem(chatKey);
        if (savedChat) {
          try {
            setGoalChatMessages(JSON.parse(savedChat));
          } catch (e) {
            console.error("Error parsing goal chat:", e);
          }
        }
      }
    };
    loadChat();
  }, [selectedGoal, isAuthenticated, user, getGoalChatKey]);

  const startSession = () => {
    if (!selectedGoal) return;
    
    const sessionId = Date.now();
    setCurrentSession({
      id: sessionId,
      startTime: new Date(),
      elapsed: 0,
      goal: selectedGoal,
      notes: [],
      isActive: true
    });
    setIsTimerActive(true);
  };

  const pauseSession = () => {
    setIsTimerActive(false);
  };

  const resumeSession = () => {
    setIsTimerActive(true);
  };

  const stopSession = () => {
    setIsTimerActive(false);
    setCurrentSession(prev => ({ ...prev, isActive: false }));
  };

  const endSession = async () => {
    if (!currentSession.isActive) return;

    const sessionDuration = currentSession.elapsed;
    const newTotalTime = sessionStats.totalFocusTime + sessionDuration;
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      totalFocusTime: newTotalTime,
      sessionsToday: prev.sessionsToday + 1
    }));

    // Save session data
    if (isAuthenticated && user) {
      const sessionData = {
        id: currentSession.id,
        goalId: selectedGoal?.id,
        duration: sessionDuration,
        startTime: currentSession.startTime,
        endTime: new Date(),
        notes: sessionNotes
      };

      // Save to localStorage for now
      const sessionsKey = getStorageKey('focus_sessions');
      if (sessionsKey) {
        const existingSessions = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
        existingSessions.push(sessionData);
        localStorage.setItem(sessionsKey, JSON.stringify(existingSessions));
      }
    }

    // Play completion sound if enabled
    if (localSessionSettings.completionSound !== 'none') {
      const completionSound = new Audio(soundMap[localSessionSettings.completionSound] || soundMap.chime);
      completionSound.volume = 0.3;
      try {
        await completionSound.play();
      } catch (error) {
        console.error('Error playing completion sound:', error);
      }
    }

    // Stop ambient sound - this is now handled by AmbientSoundPlayer
    setCurrentSession(prev => ({ ...prev, isActive: false }));
    setIsTimerActive(false);
  };

  const resetSession = () => {
    setCurrentSession({
      id: null,
      startTime: null,
      elapsed: 0,
      goal: selectedGoal,
      notes: [],
      isActive: false
    });
    setIsTimerActive(false);
    
    // Stop ambient sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleTimeUpdate = (newElapsedTime) => {
    setCurrentSession(prev => ({ ...prev, elapsed: newElapsedTime }));
  };

  const handleGoalChange = (goal) => {
    setSelectedGoal(goal);
    resetSession();
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
    window.open(link.url, '_blank');
  };

  const handleToggleNotes = () => {
    setIsNotesOpen(!isNotesOpen);
  };

  const handleToggleLinks = () => {
    setIsLinksOpen(!isLinksOpen);
  };

  const handleSettingsChange = (newSettings) => {
    setLocalSessionSettings(newSettings);
  };

  const handleAmbientSoundChange = (soundId) => {
    setLocalSessionSettings(prev => ({ ...prev, selectedAmbientSound: soundId }));
  };

  const handleExit = () => {
    if (currentSession.isActive) {
      setShowExitConfirmation(true);
    } else {
      confirmExit();
    }
  };

  const confirmExit = () => {
    // Stop ambient sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    navigate('/goals-dashboard');
  };

  const handleSendChat = async (message) => {
    if (!selectedGoal || !message.trim()) return;

    const newMsg = {
      id: Date.now(),
      content: message,
      timestamp: new Date(),
      sender: 'user'
    };

    setGoalChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    
    // Save to localStorage
    if (isAuthenticated && user) {
      const chatKey = getGoalChatKey(selectedGoal.id, user.id);
      const updatedChat = [...goalChatMessages, newMsg];
      localStorage.setItem(chatKey, JSON.stringify(updatedChat));
    }
  };

  const getBackgroundClass = () => {
    switch (localSessionSettings.background) {
      case 'gradient':
        return 'bg-gradient-to-br from-background via-surface to-background';
      case 'pattern':
        return 'bg-background';
      case 'flowing-particles':
        return 'bg-background relative overflow-hidden';
      case 'abstract-waves':
        return 'bg-background relative overflow-hidden';
      case 'energy':
        return 'bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20';
      case 'confetti':
        return 'bg-background relative overflow-hidden';
      case 'sunrise':
        return 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600';
      default:
        return 'bg-background';
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()} relative overflow-hidden`}>
      <audio ref={audioRef} />
      
      {/* Background Effects */}
      {localSessionSettings.background === 'flowing-particles' && (
        <FlowingParticlesBackground />
      )}
      {localSessionSettings.background === 'abstract-waves' && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-accent/20 via-primary/20 to-secondary/20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      )}
      {localSessionSettings.background === 'confetti' && (
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Background Pattern */}
      {localSessionSettings.background === 'pattern' && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`,
            backgroundSize: '100px 100px'
          }}></div>
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
              <Icon name="Target" className="w-4 h-4" />
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
            onEnd={endSession}
            defaultDuration={focusSettings.defaultDuration * 60}
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
        settings={localSessionSettings}
        onSettingsChange={handleSettingsChange}
        onAmbientSoundChange={handleAmbientSoundChange}
        focusSettings={focusSettings}
        onFocusSettingsChange={updateFocusModeSettings}
      />

      {/* Floating Actions */}
      <FocusFloatingActions
        onToggleNotes={handleToggleNotes}
        onToggleLinks={handleToggleLinks}
        isNotesOpen={isNotesOpen}
        isLinksOpen={isLinksOpen}
      />

      {/* Exit Confirmation */}
      <ExitConfirmation
        isOpen={showExitConfirmation}
        onClose={() => setShowExitConfirmation(false)}
        onConfirm={confirmExit}
        currentSession={currentSession}
      />
    </div>
  );
};

export default FocusMode;