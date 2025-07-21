import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { PlanDataProvider } from './context/PlanDataContext';
import { AchievementProvider } from './context/AchievementContext';
import { NotificationProvider } from './context/NotificationContext';
import { MealsProvider } from './context/MealsContext';
import { TemporaryTodosProvider } from './context/TemporaryTodosContext';
import Routes from './Routes';
import Header from './components/ui/Header';
import { useNotifications } from './hooks/useNotifications';
import './styles/index.css';
import FlowingParticlesBackground from './components/ui/FlowingParticlesBackground';
import AmbientSoundPlayer from './components/ui/AmbientSoundPlayer';
import ErrorBoundary from './components/ErrorBoundary';
import { useSettings } from './context/SettingsContext';

// Notification wrapper component
const NotificationWrapper = ({ children }) => {
  // Initialize notifications
  useNotifications();
  
  return children;
};

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
        <NotificationWrapper>
          {/* Background effects layer */}
          {process.env.NODE_ENV !== 'production' || settings?.appearance?.backgroundEffect !== 'none' ? (
            <ErrorBoundary>
              <FlowingParticlesBackground />
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
          </div>
        </NotificationWrapper>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
