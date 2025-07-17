import React from 'react';
import Icon from '../../../components/AppIcon';

const FocusModeSection = ({ settings, onSettingChange }) => {
  // Extract values from settings.focusMode, providing defaults
  const focusModeSettings = settings?.focusMode || {};
  const focusSessionDuration = focusModeSettings?.defaultDuration || 25;
  const shortBreakDuration = focusModeSettings?.shortBreakDuration || 5;
  const longBreakDuration = focusModeSettings?.longBreakDuration || 15;
  const ambientSoundsEnabled = focusModeSettings?.soundEnabled !== undefined ? focusModeSettings.soundEnabled : true;
  const selectedAmbientSound = focusModeSettings?.selectedAmbientSound || 'none';

  // Handlers to update settings via onSettingChange
  const handleChange = (key, value) => {
    // Ensure numeric values for durations are parsed correctly
    const numericKeys = ['defaultDuration', 'shortBreakDuration', 'longBreakDuration'];
    const valToSet = numericKeys.includes(key) ? parseInt(value, 10) : value;
    onSettingChange('focusMode', key, valToSet);
  };

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 25, label: '25 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' }
  ];

  const breakOptions = [
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' }
  ];

  const ambientSoundOptions = [
    { id: 'none', name: 'None', icon: 'VolumeX' },
    { id: 'rain', name: 'Rain', icon: 'CloudRain' },
    { id: 'forest', name: 'Forest', icon: 'Trees' },
    { id: 'ocean', name: 'Ocean Waves', icon: 'Waves' },
    { id: 'cafe', name: 'Coffee Shop', icon: 'Coffee' },
    { id: 'whitenoise', name: 'White Noise', icon: 'Radio' }
  ];

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-warning rounded-lg flex items-center justify-center">
          <Icon name="Focus" size={16} color="#FFFFFF" />
        </div>
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary">Focus Mode</h3>
          <p className="text-sm text-text-secondary">Configure your focus sessions and break preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Focus Session Duration */}
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-2">
            Focus Session Duration
          </label>
          <select
            value={focusSessionDuration}
            onChange={(e) => handleChange('defaultDuration', e.target.value)}
            className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Break Durations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Short Break Duration
            </label>
            <select
              value={shortBreakDuration}
              onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
              className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {breakOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Long Break Duration
            </label>
            <select
              value={longBreakDuration}
              onChange={(e) => handleChange('longBreakDuration', e.target.value)}
              className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {breakOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ambient Sounds */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-body-medium text-text-primary">
              Ambient Sounds
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ambientSoundsEnabled}
                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-surface-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {ambientSoundsEnabled && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ambientSoundOptions.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleChange('selectedAmbientSound', sound.id)}
                  className={`
                    flex flex-col items-center space-y-2 p-3 rounded-lg border transition-all duration-normal
                    ${selectedAmbientSound === sound.id
                      ? 'border-primary bg-primary/5' :'border-border hover:border-border-strong hover:bg-surface-700'
                    }
                  `}
                >
                  <Icon 
                    name={sound.icon} 
                    size={20} 
                    color={selectedAmbientSound === sound.id ? '#6366F1' : '#94A3B8'} 
                  />
                  <span className="text-xs font-caption text-text-primary text-center">{sound.name}</span>
                  {selectedAmbientSound === sound.id && (
                    <Icon name="Check" size={12} color="#6366F1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-heading-medium text-text-primary mb-2">Focus Session Tips</h4>
          <ul className="text-xs text-text-secondary space-y-1 font-caption">
            <li>• 25-minute sessions are scientifically proven for optimal focus</li>
            <li>• Take regular breaks to maintain productivity throughout the day</li>
            <li>• Ambient sounds can help mask distracting background noise</li>
            <li>• Long breaks every 4 sessions help prevent mental fatigue</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FocusModeSection;