import React, { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import Icon from '../../../components/ui/Icon';

const FocusModeSection = () => {
  const { settings, updateFocusModeSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings?.focusMode || {});

  const handleSettingChange = (key, value) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    updateFocusModeSettings(updated);
  };

  const presetDurations = [
    { label: '15 min', value: 15, icon: 'Clock' },
    { label: '25 min', value: 25, icon: 'Timer' },
    { label: '45 min', value: 45, icon: 'Clock' },
    { label: '60 min', value: 60, icon: 'Clock' },
    { label: '90 min', value: 90, icon: 'Clock' }
  ];

  const ambientSoundOptions = [
    { id: 'none', name: 'None', icon: 'VolumeX' },
    { id: 'rain', name: 'Rain', icon: 'CloudRain' },
    { id: 'forest', name: 'Forest', icon: 'Trees' },
    { id: 'ocean', name: 'Ocean Waves', icon: 'Waves' },
    { id: 'cafe', name: 'Coffee Shop', icon: 'Coffee' },
    { id: 'whitenoise', name: 'White Noise', icon: 'Radio' },
    { id: 'chime', name: 'Gentle Chime', icon: 'Bell' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name="Zap" className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary">Focus Mode</h3>
          <p className="text-sm text-text-secondary">Configure your focus session settings and preferences</p>
        </div>
      </div>

      {/* Session Duration */}
      <div className="space-y-4">
        <h4 className="font-medium text-text-primary">Session Duration</h4>
        
        <div className="grid grid-cols-3 gap-2 mb-3" role="radiogroup" aria-label="Session Duration Presets"
          onKeyDown={e => {
            if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
              e.preventDefault();
              const idx = presetDurations.findIndex(p => p.value === localSettings.defaultDuration);
              let nextIdx = e.key === "ArrowLeft" ? idx - 1 : idx + 1;
              if (nextIdx < 0) nextIdx = presetDurations.length - 1;
              if (nextIdx >= presetDurations.length) nextIdx = 0;
              handleSettingChange('defaultDuration', presetDurations[nextIdx].value);
              document.getElementById(`focus-duration-radio-${presetDurations[nextIdx].value}`)?.focus();
            }
          }}
        >
          {presetDurations.map((preset) => (
            <button
              key={preset.value}
              id={`focus-duration-radio-${preset.value}`}
              onClick={() => handleSettingChange('defaultDuration', preset.value)}
              className={`
                p-3 rounded-lg border transition-all duration-200 text-center
                ${localSettings.defaultDuration === preset.value
                  ? 'border-primary bg-primary/10 text-primary' :'border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
                }
              `}
              role="radio"
              aria-checked={localSettings.defaultDuration === preset.value}
              aria-label={`Set session duration to ${preset.label}`}
              tabIndex={localSettings.defaultDuration === preset.value ? 0 : -1}
            >
              <Icon name={preset.icon} className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-caption">{preset.label}</div>
            </button>
          ))}
        </div>
        
        {/* Custom Duration */}
        <div className="bg-surface-700 border border-border rounded-lg p-3">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Custom Duration
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Enter minutes"
              value={localSettings.defaultDuration || 25}
              onChange={(e) => handleSettingChange('defaultDuration', parseInt(e.target.value) || 25)}
              min="1"
              max="180"
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <span className="text-text-secondary text-sm font-medium">minutes</span>
          </div>
        </div>
      </div>

      {/* Break Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-text-primary">Break Settings</h4>
        
        <div className="bg-surface-700 border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium text-text-primary">Short Break Duration</label>
              <p className="text-xs text-text-secondary">Duration of short breaks between sessions</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={localSettings.breakDuration || 5}
                onChange={(e) => handleSettingChange('breakDuration', parseInt(e.target.value) || 5)}
                min="1"
                max="30"
                className="w-16 px-2 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <span className="text-text-secondary text-sm font-medium">min</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium text-text-primary">Long Break Duration</label>
              <p className="text-xs text-text-secondary">Duration of long breaks after multiple sessions</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={localSettings.longBreakDuration || 15}
                onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value) || 15)}
                min="5"
                max="60"
                className="w-16 px-2 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <span className="text-text-secondary text-sm font-medium">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sound Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-text-primary">Sound Settings</h4>
        
        {/* Enable/Disable Ambient Sounds */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div>
            <label className="text-sm font-medium text-text-primary">Ambient Sounds</label>
            <p className="text-xs text-text-secondary">Play background sounds during focus sessions</p>
          </div>
          <button
            onClick={() => handleSettingChange('ambientSounds', !localSettings.ambientSounds)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              localSettings.ambientSounds ? 'bg-primary' : 'bg-surface-600'
            }`}
            role="switch"
            aria-checked={localSettings.ambientSounds}
            aria-label="Toggle Ambient Sounds"
            tabIndex={0}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                localSettings.ambientSounds ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Sound Volume */}
        {localSettings.ambientSounds && (
          <div className="p-3 bg-surface-700 rounded-lg border border-border">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Sound Volume: {Math.round((localSettings.soundVolume || 0.5) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.soundVolume || 0.5}
              onChange={(e) => handleSettingChange('soundVolume', parseFloat(e.target.value))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              style={{
                background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${(localSettings.soundVolume || 0.5) * 100}%, var(--color-surface) ${(localSettings.soundVolume || 0.5) * 100}%, var(--color-surface) 100%)`
              }}
              aria-label="Sound Volume"
            />
          </div>
        )}

        {/* Background Effects */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div>
            <label className="text-sm font-medium text-text-primary">Background Effects</label>
            <p className="text-xs text-text-secondary">Show animated background effects during focus sessions</p>
          </div>
          <button
            onClick={() => handleSettingChange('backgroundEffects', !localSettings.backgroundEffects)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              localSettings.backgroundEffects ? 'bg-primary' : 'bg-surface-600'
            }`}
            role="switch"
            aria-checked={localSettings.backgroundEffects}
            aria-label="Toggle Background Effects"
            tabIndex={0}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                localSettings.backgroundEffects ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Auto-start Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-text-primary">Auto-start Settings</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
            <div>
              <label className="text-sm font-medium text-text-primary">Auto-start Breaks</label>
              <p className="text-xs text-text-secondary">Automatically start break timer after focus session</p>
            </div>
            <button
              onClick={() => handleSettingChange('autoStartBreaks', !localSettings.autoStartBreaks)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                localSettings.autoStartBreaks ? 'bg-primary' : 'bg-surface-600'
              }`}
              role="switch"
              aria-checked={localSettings.autoStartBreaks}
              aria-label="Toggle Auto-start Breaks"
              tabIndex={0}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                  localSettings.autoStartBreaks ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
            <div>
              <label className="text-sm font-medium text-text-primary">Auto-start Sessions</label>
              <p className="text-xs text-text-secondary">Automatically start focus session when goal is selected</p>
            </div>
            <button
              onClick={() => handleSettingChange('autoStartSessions', !localSettings.autoStartSessions)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                localSettings.autoStartSessions ? 'bg-primary' : 'bg-surface-600'
              }`}
              role="switch"
              aria-checked={localSettings.autoStartSessions}
              aria-label="Toggle Auto-start Sessions"
              tabIndex={0}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                  localSettings.autoStartSessions ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <Icon name="Info" className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-primary mb-1">Focus Mode Tips</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Focus mode helps you maintain concentration on your goals. Ambient sounds can improve focus, 
              while background effects create a calming environment. Adjust these settings to match your 
              personal productivity preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusModeSection;