import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import { applyThemeColors, getAvailableThemes } from '../utils/themeUtils';

const ThemeDemo = () => {
  const [currentTheme, setCurrentTheme] = useState('indigo');
  const availableThemes = getAvailableThemes();

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    applyThemeColors(themeId, 'light');
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Enhanced Theme System Demo
        </h1>
        <p className="text-text-secondary mb-6">
          This demonstrates the comprehensive theme system that automatically applies colors to all UI components.
        </p>

        {/* Theme Selector */}
        <div className="bg-surface rounded-lg border border-border p-6 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Select a Theme
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  currentTheme === theme.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/50'
                    : 'border-border hover:border-primary/50 hover:bg-surface-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {theme.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="text-sm font-medium text-text-primary">
                  {theme.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* UI Components Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buttons */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Buttons</h3>
            <div className="space-y-3">
              <Button variant="primary" className="w-full">
                Primary Button
              </Button>
              <Button variant="secondary" className="w-full">
                Secondary Button
              </Button>
              <Button variant="outline" className="w-full">
                Outline Button
              </Button>
              <Button variant="ghost" className="w-full">
                Ghost Button
              </Button>
            </div>
          </div>

          {/* Inputs */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Form Elements</h3>
            <div className="space-y-3">
              <Input placeholder="Text input with theme colors" />
              <div className="flex items-center space-x-2">
                <Input type="checkbox" id="checkbox1" />
                <label htmlFor="checkbox1" className="text-text-primary">
                  Themed checkbox
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Input type="radio" id="radio1" name="theme-radio" />
                <label htmlFor="radio1" className="text-text-primary">
                  Themed radio button
                </label>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              Themed Card
            </h3>
            <p className="text-text-secondary mb-4">
              This card uses theme-aware colors for background and text.
            </p>
            <div className="flex space-x-2">
              <Button variant="primary" size="sm">
                Action
              </Button>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>

          {/* Status Elements */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Status Colors</h3>
            <div className="space-y-3">
              <Button variant="success" className="w-full">
                Success Action
              </Button>
              <Button variant="warning" className="w-full">
                Warning Action
              </Button>
              <Button variant="danger" className="w-full">
                Danger Action
              </Button>
            </div>
          </div>
        </div>

        {/* Typography Demo */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Typography</h3>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">
              Primary Text (Heading)
            </h1>
            <p className="text-text-secondary">
              Secondary text for descriptions and subtitles.
            </p>
            <p className="text-text-muted text-sm">
              Muted text for less important information.
            </p>
            <p className="text-primary">
              Accent text using the current theme's primary color.
            </p>
          </div>
        </div>

        {/* Live Theme Variables Display */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Current Theme Variables
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-primary border"></div>
                <span className="text-text-primary font-mono">--color-primary</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-secondary border"></div>
                <span className="text-text-primary font-mono">--color-secondary</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-accent border"></div>
                <span className="text-text-primary font-mono">--color-accent</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-success border"></div>
                <span className="text-text-primary font-mono">--color-success</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-warning border"></div>
                <span className="text-text-primary font-mono">--color-warning</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-error border"></div>
                <span className="text-text-primary font-mono">--color-error</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-muted border"></div>
                <span className="text-text-primary font-mono">--color-muted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-ring border"></div>
                <span className="text-text-primary font-mono">--color-ring</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-form-focus border"></div>
                <span className="text-text-primary font-mono">--color-form-focus</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-text-muted text-sm">
          Theme changes apply instantly to all components using CSS variables.
          Future UI components will automatically inherit the selected theme colors.
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;