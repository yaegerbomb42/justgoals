import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { PlanDataProvider } from './context/PlanDataContext';
import { AchievementProvider } from './context/AchievementContext';
import { NotificationProvider } from './context/NotificationContext';
import { MealsProvider } from './context/MealsContext';
import Routes from './Routes';
import Header from './components/ui/Header';
import { useNotifications } from './hooks/useNotifications';
import './styles/index.css';
import FlowingParticlesBackground from './components/ui/FlowingParticlesBackground';
import { useSettings } from './context/SettingsContext';

// Notification wrapper component
const NotificationWrapper = ({ children }) => {
  // Initialize notifications
  useNotifications();
  
  return children;
};

const GlobalBackgroundMusic = () => {
  const { settings, isMusicMuted } = useSettings();
  const audioRef = React.useRef(null);
  const musicMap = {
    none: '',
    rain: '/assets/sounds/rain.mp3',
    forest: '/assets/sounds/forest.mp3',
    ocean: '/assets/sounds/ocean.mp3',
    cafe: '/assets/sounds/cafe.mp3',
    whitenoise: '/assets/sounds/whitenoise.mp3',
    chime: '/assets/sounds/chime.mp3',
  };
  const music = settings?.appearance?.backgroundMusic || 'none';
  const volume = settings?.appearance?.backgroundMusicVolume ?? 0.5;
  // Check if focus mode is active by looking at the URL
  const location = window.location.pathname;
  const isFocusMode = location.startsWith('/focus-mode');
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMusicMuted || (isFocusMode && music !== 'none')) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    if (music && music !== 'none') {
      audio.src = musicMap[music];
      audio.volume = volume;
      audio.loop = true;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [music, volume, isMusicMuted, isFocusMode]);
  return <audio ref={audioRef} style={{ display: 'none' }} />;
};

const App = () => {
  const { settings } = useSettings();
  React.useEffect(() => {
    if (settings?.appearance?.backgroundEffect) {
      document.body.setAttribute('data-bg-effect', settings.appearance.backgroundEffect);
    } else {
      document.body.removeAttribute('data-bg-effect');
    }
  }, [settings?.appearance?.backgroundEffect]);
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <PlanDataProvider>
            <AchievementProvider>
              <NotificationProvider>
                <MealsProvider>
                  <NotificationWrapper>
                    <FlowingParticlesBackground />
                    <GlobalBackgroundMusic />
                    <div className="min-h-screen bg-background text-text-primary">
                      <Header />
                      <Routes />
                    </div>
                  </NotificationWrapper>
                </MealsProvider>
              </NotificationProvider>
            </AchievementProvider>
          </PlanDataProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
