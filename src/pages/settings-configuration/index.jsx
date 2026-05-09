import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import Icon from '../../components/ui/Icon';
import Page from '../../components/ui/Page';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
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
  const [activeSection, setActiveSection] = useState('profile');
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
    <Page>
      <PageHeader
        icon="Settings"
        title="Settings"
        subtitle="Customize your JustGoals experience"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className={`lg:w-60 flex-shrink-0 ${isMobile ? 'order-2' : 'order-1'}`}>
          <Card padding="md">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 px-1">
              Categories
            </h2>

            {isMobile ? (
              // Mobile: Horizontal scrollable tabs
              <div
                className="flex space-x-2 overflow-x-auto pb-2"
                role="tablist"
                aria-label="Settings Categories"
                onKeyDown={(e) => {
                  if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                    e.preventDefault();
                    const idx = sections.findIndex((s) => s.id === activeSection);
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
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/40'
                    }`}
                    role="tab"
                    aria-selected={activeSection === section.id}
                    aria-controls={`settings-tabpanel-${section.id}`}
                    tabIndex={activeSection === section.id ? 0 : -1}
                  >
                    <Icon name={section.icon} className="w-4 h-4" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              // Desktop: Vertical sidebar
              <nav
                className="space-y-1"
                role="tablist"
                aria-label="Settings Categories"
                onKeyDown={(e) => {
                  if (["ArrowUp", "ArrowDown"].includes(e.key)) {
                    e.preventDefault();
                    const idx = sections.findIndex((s) => s.id === activeSection);
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
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/40'
                    }`}
                    role="tab"
                    aria-selected={activeSection === section.id}
                    aria-controls={`settings-tabpanel-${section.id}`}
                    tabIndex={activeSection === section.id ? 0 : -1}
                  >
                    <Icon name={section.icon} className="w-4 h-4" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            )}
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[600px] transition-all duration-200" style={{ contain: 'layout' }}>
          <div className="min-h-full">{renderSection()}</div>
        </main>
      </div>
    </Page>
  );
};

export default SettingsPage;
