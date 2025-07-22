import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { PlanDataProvider } from './context/PlanDataContext';
import AchievementProvider from './context/AchievementContext';
import { NotificationProvider } from './context/NotificationContext';
import { MealsProvider } from './context/MealsContext';
import { TemporaryTodosProvider } from './context/TemporaryTodosContext';

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <AuthProvider>
    <SettingsProvider>
      <PlanDataProvider>
        <AchievementProvider>
          <NotificationProvider>
            <MealsProvider>
              <TemporaryTodosProvider>
                <App />
              </TemporaryTodosProvider>
            </MealsProvider>
          </NotificationProvider>
        </AchievementProvider>
      </PlanDataProvider>
    </SettingsProvider>
  </AuthProvider>
);

// Register service worker with update notification
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              if (window.confirm('A new version is available. Reload now?')) {
                window.location.reload();
              }
            }
          }
        };
      };
    });
  });
}
