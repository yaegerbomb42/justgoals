import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getUserId, getFocusSessionStats, saveFocusSessionStats, createUserStorageKey, migrateLegacyUserData } from '../../utils/userUtils';
import Button from '../../components/ui/Button';
import GoalSelector from './components/GoalSelector';
import FocusTimer from './components/FocusTimer';
import SessionNotes from './components/SessionNotes';
import SessionSettings from './components/SessionSettings';
import SessionStats from './components/SessionStats';
import ExitConfirmation from './components/ExitConfirmation';
import QuickLinksPanel from './components/QuickLinksPanel';
import FocusFloatingActions from './components/FocusFloatingActions';
import FocusSessionNotes from './components/FocusSessionNotes';
import FlowingParticlesBackground from '../../components/ui/FlowingParticlesBackground';
import AmbientSoundPlayer from '../../components/ui/AmbientSoundPlayer';
import * as entityService from '../../services/entityManagementService';

// Utility to check if a sound file exists
const checkSoundFileExists = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
};

const getGoalChatKey = (goalId, user) => {
  const userId = getUserId(user);
  return userId ? `goal_chat_${userId}_${goalId}` : null;
};

// Utility to unlock/resume audio context on user interaction
function unlockAudioContext(audioRef) {
  if (!audioRef.current) return;
  const audio = audioRef.current;
  // Try to play a silent sound to unlock
  const playSilent = () => {
    audio.volume = 0;
    audio.play().catch(() => {});
    setTimeout(() => { audio.volume = 0.5; }, 100);
  };
  // Resume context if suspended
  if (window.AudioContext || window.webkitAudioContext) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }
  playSilent();
}

const FocusMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { settings, updateFocusModeSettings } = useSettings();
  const audioRef = useRef(null);

  // Unlock audio on first user interaction
  useEffect(() => {
    const handler = () => unlockAudioContext(audioRef);
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);
  
  const getStorageKey = useCallback((baseKey) => {
    return createUserStorageKey(baseKey, user);
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
    selectedAmbientSound: 'none'
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [globalLinksCount, setGlobalLinksCount] = useState(0);
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
      // Migrate any legacy data first
      migrateLegacyUserData(user);
      
      const stats = getFocusSessionStats(user);
      setSessionStats(stats);
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

  // Load global links count
  useEffect(() => {
    if (isAuthenticated && user) {
      const linksKey = createUserStorageKey('focus_global_links', user);
      if (linksKey) {
        const savedGlobalLinks = localStorage.getItem(linksKey);
        if (savedGlobalLinks) {
          try {
            const links = JSON.parse(savedGlobalLinks);
            setGlobalLinksCount(links.length);
          } catch (e) {
            console.error('Error parsing global links:', e);
            setGlobalLinksCount(0);
          }
        } else {
          setGlobalLinksCount(0);
        }
      }
    }
  }, [isAuthenticated, user]);

  // Save user-specific stats to localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      saveFocusSessionStats(user, sessionStats);
    }
  }, [sessionStats, isAuthenticated, user]);

  // Save local session settings to localStorage
  useEffect(() => {
    localStorage.setItem('focus_page_local_settings', JSON.stringify(localSessionSettings));
  }, [localSessionSettings]);

  // Load goal chat history
  useEffect(() => {
    const loadChat = async () => {
      if (selectedGoal && isAuthenticated && user) {
        const chatKey = getGoalChatKey(selectedGoal.id, user);
        if (chatKey) {
          const savedChat = localStorage.getItem(chatKey);
          if (savedChat) {
            try {
              setGoalChatMessages(JSON.parse(savedChat));
            } catch (e) {
              console.error("Error parsing goal chat:", e);
            }
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
      const completionSound = new Audio('/assets/sounds/chime.mp3');
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
    
    // Stop ambient sound - this is now handled by AmbientSoundPlayer
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

  const handleToggleLinks = () => {
    setIsLinksOpen(!isLinksOpen);
  };

  const handleGlobalLinksChange = (links) => {
    setGlobalLinksCount(links.length);
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
    // Stop ambient sound - this is now handled by AmbientSoundPlayer
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

    // Save to localStorage with error handling
    if (isAuthenticated && user) {
      try {
        const chatKey = getGoalChatKey(selectedGoal.id, user);
        if (chatKey) {
          const updatedChat = [...goalChatMessages, newMsg];
          localStorage.setItem(chatKey, JSON.stringify(updatedChat));
        }
      } catch (error) {
        console.error('Error saving chat messages:', error);
        alert('Failed to save chat messages. Please try again later.');
      }
    }
  };

  const handleAmbientSoundPlayback = async (soundType) => {
    if (!soundType || soundType === 'none') return;

    const soundUrl = `/assets/sounds/${soundType}.mp3`;
    const fileExists = await checkSoundFileExists(soundUrl);

    if (!fileExists) {
      console.error(`Sound file not found: ${soundUrl}`);
      alert('Selected ambient sound is unavailable.');
      return;
    }

    try {
      const audio = new Audio(soundUrl);
      audio.volume = focusSettings.soundVolume || 0.5;
      await audio.play();
    } catch (error) {
      console.error('Error playing ambient sound:', error);
      alert('Failed to play ambient sound. Please try a different option.');
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
      case 'creative':
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

  const handleToggleNotes = () => setIsNotesOpen((prev) => !prev);

  return (
    <div className={`min-h-screen ${getBackgroundClass()} relative overflow-hidden`}>
      {/* Enhanced Ambient Sound System */}
      <AmbientSoundPlayer
        soundType={localSessionSettings.selectedAmbientSound || 'none'}
        volume={focusSettings.soundVolume || 0.5}
        isActive={isTimerActive && (focusSettings.ambientSounds !== false) && localSessionSettings.selectedAmbientSound !== 'none'}
      />
      
      {/* Background Effects */}
      {focusSettings.backgroundEffects && (
        <>
          {localSessionSettings.background === 'flowing-particles' && (
            <div className="absolute inset-0 z-0">
              <FlowingParticlesBackground effect="particles" />
            </div>
          )}
          {localSessionSettings.background === 'creative' && (
            <div className="absolute inset-0 z-0">
              <FlowingParticlesBackground effect="creative" />
            </div>
          )}
          {localSessionSettings.background === 'abstract-waves' && (
            <div className="absolute inset-0 z-0">
              <FlowingParticlesBackground effect="abstract" />
            </div>
          )}
          {localSessionSettings.background === 'energy' && (
            <div className="absolute inset-0 z-0">
              <FlowingParticlesBackground effect="motivational" />
            </div>
          )}
        </>
      )}
      {focusSettings.backgroundEffects && localSessionSettings.background === 'confetti' && (
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
      {focusSettings.backgroundEffects && localSessionSettings.background === 'pattern' && (
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
        onGlobalLinksChange={handleGlobalLinksChange}
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
        onToggleLinks={handleToggleLinks}
        isLinksOpen={isLinksOpen}
        linksCount={globalLinksCount}
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