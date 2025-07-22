import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Icon from '../../components/ui/Icon';
import ProfileSection from './components/ProfileSection';
import ApiKeySection from './components/ApiKeySection';
import NotificationSection from './components/NotificationSection';
import AppearanceSection from './components/AppearanceSection';
import FocusModeSection from './components/FocusModeSection';
import ProgressMeterSection from './components/ProgressMeterSection';
import DataManagementSection from './components/DataManagementSection';
import MealPreferencesSection from './components/MealPreferencesSection';

const SettingsPage = () => {
  const { settings } = useSettings();
  const [activeSection, setActiveSection] = useState('api');
  const isMobile = settings?.mobile?.detected;

  const sections = [
    { id: 'profile', label: 'Profile', icon: 'User' },
    { id: 'api', label: 'API Keys', icon: 'Key' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell' },
    { id: 'appearance', label: 'Appearance', icon: 'Palette' },
    { id: 'focus', label: 'Focus Mode', icon: 'Zap' },
    { id: 'progress', label: 'Progress', icon: 'BarChart3' },
    { id: 'meals', label: 'Meal Preferences', icon: 'UtensilsCrossed' },
    { id: 'data', label: 'Data', icon: 'Database' },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'notifications':
        return <NotificationSection />;
      case 'api':
        return <ApiKeySection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'focus':
        return <FocusModeSection />;
      case 'progress':
        return <ProgressMeterSection />;
      case 'meals':
        return <MealPreferencesSection />;
      case 'data':
        return <DataManagementSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading-bold text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Customize your JustGoals experience</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className={`lg:w-64 ${isMobile ? 'order-2' : 'order-1'}`}>
            <div className="bg-surface rounded-lg border border-border p-4">
              <h2 className="text-lg font-heading-semibold text-text-primary mb-4">Categories</h2>
              
              {isMobile ? (
                // Mobile: Horizontal scrollable tabs
                <div
                  className="flex space-x-2 overflow-x-auto pb-2"
                  role="tablist"
                  aria-label="Settings Categories"
                  onKeyDown={e => {
                    if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                      e.preventDefault();
                      const idx = sections.findIndex(s => s.id === activeSection);
                      let nextIdx = e.key === "ArrowLeft" ? idx - 1 : idx + 1;
                      if (nextIdx < 0) nextIdx = sections.length - 1;
                      if (nextIdx >= sections.length) nextIdx = 0;
                      setActiveSection(sections[nextIdx].id);
                      document.getElementById(`settings-tab-${sections[nextIdx].id}`)?.focus();
                    }
                  }}
                >
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      id={`settings-tab-${section.id}`}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                      }`}
                      role="tab"
                      aria-selected={activeSection === section.id}
                      aria-controls={`settings-tabpanel-${section.id}`}
                      tabIndex={activeSection === section.id ? 0 : -1}
                    >
                      <Icon name={section.icon} className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Desktop: Vertical sidebar
                <nav
                  className="space-y-1"
                  role="tablist"
                  aria-label="Settings Categories"
                  onKeyDown={e => {
                    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
                      e.preventDefault();
                      const idx = sections.findIndex(s => s.id === activeSection);
                      let nextIdx = e.key === "ArrowUp" ? idx - 1 : idx + 1;
                      if (nextIdx < 0) nextIdx = sections.length - 1;
                      if (nextIdx >= sections.length) nextIdx = 0;
                      setActiveSection(sections[nextIdx].id);
                      document.getElementById(`settings-tab-${sections[nextIdx].id}`)?.focus();
                    }
                  }}
                >
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      id={`settings-tab-${section.id}`}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                      }`}
                      role="tab"
                      aria-selected={activeSection === section.id}
                      aria-controls={`settings-tabpanel-${section.id}`}
                      tabIndex={activeSection === section.id ? 0 : -1}
                    >
                      <Icon name={section.icon} className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
