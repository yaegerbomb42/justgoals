import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import { useAuth } from "./context/AuthContext";

// Page imports
import GoalsDashboard from "pages/goals-dashboard";
import AiAssistantChatDrift from "pages/ai-assistant-chat-drift";
import FocusMode from "pages/focus-mode";
import SettingsConfiguration from "pages/settings-configuration";
import DailyMilestones from "pages/daily-milestones";
import GoalCreationManagement from "pages/goal-creation-management";
import Journal from "pages/journal";
import NotFound from "pages/NotFound";
import LoginPage from "pages/auth/LoginPage";
import SignUpPage from "pages/auth/SignUpPage";
import AnalyticsDashboard from "pages/analytics-dashboard";
import Day from "pages/day";
import AchievementsPage from "pages/achievements";
import HabitsPage from "pages/habits";
import MealsPage from "pages/meals";
import Oauth2Callback from './pages/oauth2callback';

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner/loader component
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const Routes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // You can render a global loading spinner here if preferred
    // For now, ProtectedRoute handles its own loading state
    return <div>Application Loading...</div>;
  }

  return (
    <>
      <ScrollToTop />
      <RouterRoutes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* OAuth2 callback route */}
        <Route path="/oauth2callback" element={<Oauth2Callback />} />

        {/* Protected routes */}
        <Route path="/goals-dashboard" element={<ProtectedRoute><GoalsDashboard /></ProtectedRoute>} />
        <Route path="/ai-assistant-chat-drift" element={<ProtectedRoute><AiAssistantChatDrift /></ProtectedRoute>} />
        <Route path="/focus-mode" element={<ProtectedRoute><FocusMode /></ProtectedRoute>} />
        <Route path="/settings-configuration" element={<ProtectedRoute><SettingsConfiguration /></ProtectedRoute>} />
        <Route path="/daily-milestones" element={<ProtectedRoute><DailyMilestones /></ProtectedRoute>} />
        <Route path="/goal-creation-management" element={<ProtectedRoute><GoalCreationManagement /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
        <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
        <Route path="/meals" element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
        <Route path="/day" element={<ProtectedRoute><Day /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />

        {/* Default route */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/goals-dashboard" replace /> : <Navigate to="/login" replace />}
        />

        {/* Not Found route */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
    </>
  );
};

export default Routes;