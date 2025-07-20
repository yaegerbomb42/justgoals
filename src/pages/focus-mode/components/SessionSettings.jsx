import React, { useState } from 'react';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SessionSettings = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange, 
  onAmbientSoundChange,
  focusSettings,
  onFocusSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localFocusSettings, setLocalFocusSettings] = useState(focusSettings);

  const presetDurations = [
    { label: '15 min', value: 15, icon: 'Clock' },
    { label: '25 min', value: 25, icon: 'Timer' },
    { label: '45 min', value: 45, icon: 'Clock' },
    { label: '60 min', value: 60, icon: 'Clock' },
    { label: '90 min', value: 90, icon: 'Clock' }
  ];

  const backgroundOptions = [
    { id: 'solid', label: 'Solid Color', preview: 'bg-background' },
    { id: 'gradient', label: 'Gradient', preview: 'bg-gradient-to-br from-background to-surface' },
    { id: 'pattern', label: 'Subtle Pattern', preview: 'bg-background' },
    { id: 'flowing-particles', label: 'Flowing Particles', preview: 'bg-background' },
    { id: 'abstract-waves', label: 'Abstract Waves', preview: 'bg-background' },
    { id: 'energy', label: 'Energy', preview: 'bg-background' },
    { id: 'confetti', label: 'Confetti', preview: 'bg-background' },
    { id: 'sunrise', label: 'Sunrise', preview: 'bg-background' },
  ];

  const soundOptions = [
    { id: 'none', label: 'Silent', icon: 'VolumeX' },
    { id: 'chime', label: 'Gentle Chime', icon: 'Volume1' },
    { id: 'nature', label: 'Nature Sounds', icon: 'Volume2' }
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

  const updateSetting = (key, value) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
  };

  const updateFocusSetting = (key, value) => {
    const updated = { ...localFocusSettings, [key]: value };
    setLocalFocusSettings(updated);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    if (onFocusSettingsChange) {
      onFocusSettingsChange(localFocusSettings);
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setLocalFocusSettings(focusSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Settings" className="w-5 h-5 text-text-primary" />
            <h2 className="text-text-primary font-heading-medium">Focus Settings</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconName="X"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Duration Presets */}
          <div>
            <h3 className="text-text-primary font-body-medium mb-3">Session Duration</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {presetDurations.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => updateFocusSetting('defaultDuration', preset.value)}
                  className={`
                    p-3 rounded-lg border transition-all duration-normal text-center
                    ${localFocusSettings.defaultDuration === preset.value
                      ? 'border-primary bg-primary/10 text-primary' :'border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
                    }
                  `}
                >
                  <Icon name={preset.icon} className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs font-caption">{preset.label}</div>
                </button>
              ))}
            </div>
            
            {/* Custom Duration */}
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Custom minutes"
                value={localFocusSettings.defaultDuration}
                onChange={(e) => updateFocusSetting('defaultDuration', parseInt(e.target.value) || 25)}
                min="1"
                max="180"
                className="flex-1"
              />
              <span className="text-text-secondary text-sm">minutes</span>
            </div>
          </div>

          {/* Sound Settings */}
          <div>
            <h3 className="text-text-primary font-body-medium mb-3">Sound Settings</h3>
            
            {/* Enable/Disable Ambient Sounds */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-medium text-text-primary">Ambient Sounds</label>
                <p className="text-xs text-text-secondary">Play background sounds during focus sessions</p>
              </div>
              <button
                onClick={() => updateFocusSetting('ambientSounds', !localFocusSettings.ambientSounds)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  localFocusSettings.ambientSounds ? 'bg-primary' : 'bg-surface-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    localFocusSettings.ambientSounds ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound Volume */}
            {localFocusSettings.ambientSounds && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Sound Volume: {Math.round(localFocusSettings.soundVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localFocusSettings.soundVolume}
                  onChange={(e) => updateFocusSetting('soundVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-surface-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Ambient Sound Options */}
            {localFocusSettings.ambientSounds && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Ambient Sound
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ambientSoundOptions.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => onAmbientSoundChange(sound.id)}
                      className={`
                        flex flex-col items-center space-y-2 p-3 rounded-lg border transition-all duration-normal
                        ${settings.selectedAmbientSound === sound.id
                          ? 'border-primary bg-primary/5' :'border-border hover:border-border-strong hover:bg-surface-700'
                        }
                      `}
                    >
                      <Icon 
                        name={sound.icon} 
                        className="w-5 h-5" 
                        color={settings.selectedAmbientSound === sound.id ? '#6366F1' : '#94A3B8'} 
                      />
                      <span className="text-xs font-caption text-text-primary text-center">{sound.name}</span>
                      {settings.selectedAmbientSound === sound.id && (
                        <Icon name="Check" className="w-3 h-3 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Sound */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Completion Sound
              </label>
              <div className="space-y-2">
                {soundOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateSetting('completionSound', option.id)}
                    className={`
                      w-full p-3 rounded-lg border transition-all duration-normal text-left
                      ${localSettings.completionSound === option.id
                        ? 'border-primary bg-primary/10' :'border-border hover:border-border-strong'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name={option.icon} className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-primary text-sm">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Background Options */}
          <div>
            <h3 className="text-text-primary font-body-medium mb-3">Background</h3>
            <div className="space-y-2">
              {backgroundOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateSetting('background', option.id)}
                  className={`
                    w-full p-3 rounded-lg border transition-all duration-normal text-left
                    ${localSettings.background === option.id
                      ? 'border-primary bg-primary/10' :'border-border hover:border-border-strong'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded ${option.preview} border border-border`}></div>
                    <span className="text-text-primary text-sm">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-start Settings */}
          <div>
            <h3 className="text-text-primary font-body-medium mb-3">Auto-start Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-text-primary">Auto-start Breaks</label>
                  <p className="text-xs text-text-secondary">Automatically start break timer after focus session</p>
                </div>
                <button
                  onClick={() => updateFocusSetting('autoStartBreaks', !localFocusSettings.autoStartBreaks)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                    localFocusSettings.autoStartBreaks ? 'bg-primary' : 'bg-surface-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                      localFocusSettings.autoStartBreaks ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-text-primary">Auto-start Sessions</label>
                  <p className="text-xs text-text-secondary">Automatically start focus session when goal is selected</p>
                </div>
                <button
                  onClick={() => updateFocusSetting('autoStartSessions', !localFocusSettings.autoStartSessions)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                    localFocusSettings.autoStartSessions ? 'bg-primary' : 'bg-surface-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                      localFocusSettings.autoStartSessions ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionSettings;