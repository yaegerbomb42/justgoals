import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SessionSettings = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange, 
  onAmbientSoundChange 
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const presetDurations = [
    { label: '15 min', value: 15 * 60, icon: 'Clock' },
    { label: '25 min', value: 25 * 60, icon: 'Timer' },
    { label: '45 min', value: 45 * 60, icon: 'Clock' },
    { label: '60 min', value: 60 * 60, icon: 'Clock' },
    { label: '90 min', value: 90 * 60, icon: 'Clock' }
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

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-500 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Settings" size={20} color="var(--color-text-primary)" />
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
                  onClick={() => updateSetting('duration', preset.value)}
                  className={`
                    p-3 rounded-lg border transition-all duration-normal text-center
                    ${localSettings.duration === preset.value
                      ? 'border-primary bg-primary/10 text-primary' :'border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
                    }
                  `}
                >
                  <Icon name={preset.icon} size={16} className="mx-auto mb-1" />
                  <div className="text-xs font-caption">{preset.label}</div>
                </button>
              ))}
            </div>
            
            {/* Custom Duration */}
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Custom minutes"
                value={Math.floor(localSettings.duration / 60)}
                onChange={(e) => updateSetting('duration', parseInt(e.target.value) * 60 || 25 * 60)}
                min="1"
                max="180"
                className="flex-1"
              />
              <span className="text-text-secondary text-sm">minutes</span>
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

          {/* Sound Options */}
          <div>
            <h3 className="text-text-primary font-body-medium mb-3">Completion Sound</h3>
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
                    <Icon name={option.icon} size={16} color="var(--color-text-secondary)" />
                    <span className="text-text-primary text-sm">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Sound Options */}
          {settings.soundEnabled && (
            <div className="mb-4">
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Ambient Sound
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ambientSoundOptions.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => onAmbientSoundChange ? onAmbientSoundChange(sound.id) : onSettingsChange({ ...settings, selectedAmbientSound: sound.id })}
                    className={`
                      flex flex-col items-center space-y-2 p-3 rounded-lg border transition-all duration-normal
                      ${settings.selectedAmbientSound === sound.id
                        ? 'border-primary bg-primary/5' :'border-border hover:border-border-strong hover:bg-surface-700'
                      }
                    `}
                  >
                    <Icon 
                      name={sound.icon} 
                      size={20} 
                      color={settings.selectedAmbientSound === sound.id ? '#6366F1' : '#94A3B8'} 
                    />
                    <span className="text-xs font-caption text-text-primary text-center">{sound.name}</span>
                    {settings.selectedAmbientSound === sound.id && (
                      <Icon name="Check" size={12} color="#6366F1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Break Reminders */}
          <div>
            <h3 className="text-text-primary font-body-medium mb-3">Break Reminders</h3>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">Enable break notifications</span>
              <button
                onClick={() => updateSetting('breakReminders', !localSettings.breakReminders)}
                className={`
                  relative w-12 h-6 rounded-full transition-colors duration-normal
                  ${localSettings.breakReminders ? 'bg-primary' : 'bg-surface-600'}
                `}
              >
                <div className={`
                  absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-normal
                  ${localSettings.breakReminders ? 'translate-x-7' : 'translate-x-1'}
                `}></div>
              </button>
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