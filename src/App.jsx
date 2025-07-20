import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { PlanDataProvider } from './context/PlanDataContext';
import { AchievementProvider } from './context/AchievementContext';
import { NotificationProvider } from './context/NotificationContext';
import Routes from './Routes';
import Header from './components/ui/Header';
import { useNotifications } from './hooks/useNotifications';
import './styles/index.css';

// Notification wrapper component
const NotificationWrapper = ({ children }) => {
  // Initialize notifications
  useNotifications();
  
  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <PlanDataProvider>
            <AchievementProvider>
              <NotificationProvider>
                <NotificationWrapper>
                  <div className="min-h-screen bg-background text-text-primary">
                    <Header />
                    <Routes />
                  </div>
                </NotificationWrapper>
              </NotificationProvider>
            </AchievementProvider>
          </PlanDataProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
