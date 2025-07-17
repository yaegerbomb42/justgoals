import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AchievementProvider } from './context/AchievementContext';
import { SettingsProvider } from './context/SettingsContext';
import Routes from './Routes';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import FlowingParticlesBackground from './components/ui/FlowingParticlesBackground';
import './styles/index.css';
import { getAuth } from 'firebase/auth';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SettingsProvider>
            <AchievementProvider>
              <div className="App">
                <FlowingParticlesBackground />
                <ScrollToTop />
                <Routes />
              </div>
            </AchievementProvider>
          </SettingsProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
