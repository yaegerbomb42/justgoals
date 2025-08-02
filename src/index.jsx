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

// Global error handling for better stability
window.addEventListener('error', (event) => {
  // Suppress known third-party errors that don't affect functionality
  if (event.message && (
    event.message.includes('mce-autosize-textarea') ||
    event.message.includes('webcomponents-ce.js') ||
    event.message.includes('overlay_bundle.js')
  )) {
    console.warn('Suppressed third-party error:', event.message);
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Log but don't crash the app for certain errors
  if (event.reason && typeof event.reason === 'string') {
    if (event.reason.includes('Cross-Origin-Opener-Policy') ||
        event.reason.includes('identitytoolkit.googleapis.com')) {
      console.warn('Suppressed known external service error:', event.reason);
      event.preventDefault();
      return;
    }
  }
  console.error('Unhandled promise rejection:', event.reason);
});

// Prevent custom element re-registration errors
const originalDefine = window.customElements?.define;
if (originalDefine) {
  window.customElements.define = function(name, constructor, options) {
    if (!window.customElements.get(name)) {
      return originalDefine.call(this, name, constructor, options);
    } else {
      console.warn(`Custom element '${name}' already defined, skipping re-registration`);
    }
  };
}

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
