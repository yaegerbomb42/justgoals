import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { PlanDataProvider } from './context/PlanDataContext';
import AchievementProvider from './context/AchievementContext';
import { NotificationProvider } from './context/NotificationContext';
import { MealsProvider } from './context/MealsContext';
import { TemporaryTodosProvider } from './context/TemporaryTodosContext';
import { DriftCharacterProvider } from './context/DriftCharacterContext';
import Routes from './Routes';
import Header from './components/ui/Header';
import NotificationDisplay from './components/ui/NotificationDisplay';
import DriftCharacter from './components/ui/DriftCharacter';
import { useNotifications } from './hooks/useNotifications';
import { useNotificationContext } from './context/NotificationContext';
import inAppNotificationService from './services/inAppNotificationService';
import './styles/index.css';
import FlowingParticlesBackground from './components/ui/FlowingParticlesBackground';
import AmbientSoundPlayer from './components/ui/AmbientSoundPlayer';
import ErrorBoundary from './components/ErrorBoundary';
import { useSettings } from './context/SettingsContext';
import { useDriftCharacter } from './context/DriftCharacterContext';

// Notification wrapper component
const NotificationWrapper = ({ children }) => {
  const notificationContext = useNotificationContext();
  
  // Initialize notifications
  useNotifications();
  
  // Initialize in-app notification service
  React.useEffect(() => {
    if (notificationContext) {
      inAppNotificationService.init(notificationContext);
      
      // Add test functions for development
      if (process.env.NODE_ENV === 'development') {
        window.testNotification = () => inAppNotificationService.showTest();
        window.inAppNotificationService = inAppNotificationService;
        console.log('Development mode: Use window.testNotification() to test notifications');
      }
    }
  }, [notificationContext]);
  
  return children;
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

const GlobalBackgroundMusic = () => {
  const { settings, isMusicMuted } = useSettings();
  const music = settings?.appearance?.backgroundMusic || 'none';
  const volume = settings?.appearance?.backgroundMusicVolume ?? 0.5;
  
  // Check if focus mode is active by looking at the URL
  const location = window.location.pathname;
  const isFocusMode = location.startsWith('/focus-mode');
  
  // Don't play global music if focus mode is active or music is muted
  const shouldPlay = !isMusicMuted && !isFocusMode && music !== 'none';

  return (
    <AmbientSoundPlayer
      soundType={music}
      volume={volume}
      isActive={shouldPlay}
    />
  );
};

// Drift Character Wrapper Component
const DriftCharacterWrapper = () => {
  const { isVisible, isChatOpen, openChat, characterMood } = useDriftCharacter();
  
  if (!isVisible) return null;
  
  return (
    <DriftCharacter 
      onOpenChat={openChat}
      isChatOpen={isChatOpen}
      mood={characterMood}
    />
  );
};

const App = () => {
  const { settings } = useSettings();
  
  React.useEffect(() => {
    try {
      if (settings?.appearance?.backgroundEffect && settings.appearance.backgroundEffect !== 'none') {
        document.body.setAttribute('data-bg-effect', settings.appearance.backgroundEffect);
      } else {
        document.body.removeAttribute('data-bg-effect');
      }
    } catch (error) {
      console.warn('Error applying background effect:', error);
      document.body.removeAttribute('data-bg-effect');
    }
  }, [settings?.appearance?.backgroundEffect]);

  return (
    <Router>
      <ErrorBoundary>
        <DriftCharacterProvider>
          <NotificationWrapper>
          {/* Background effects layer */}
          {settings?.appearance?.backgroundEffect && settings.appearance.backgroundEffect !== 'none' ? (
            <ErrorBoundary>
              <FlowingParticlesBackground effect={settings.appearance.backgroundEffect} />
            </ErrorBoundary>
          ) : null}
          <GlobalBackgroundMusic />
          {/* Main content with transparent background when effects are active */}
          <div 
            className={`min-h-screen text-text-primary ${
              settings?.appearance?.backgroundEffect && settings.appearance.backgroundEffect !== 'none'
                ? 'bg-background/70 backdrop-blur-[1px]'
                : 'bg-background'
            }`}
            style={{ position: 'relative' }}
          >
            <Header />
            <Routes />
            {/* In-app notification display */}
            <NotificationDisplay />
            <DriftCharacterWrapper />
          </div>
        </NotificationWrapper>
        </DriftCharacterProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
