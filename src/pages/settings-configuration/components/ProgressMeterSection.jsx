import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressMeterSection = ({ settings, onSettingChange }) => {
  // Extract values from settings.progressMeter, providing defaults
  const progressMeterSettings = settings?.progressMeter || {};
  const progressMode = progressMeterSettings?.progressMode || 'auto';
  const autoUpdateInterval = progressMeterSettings?.autoUpdateInterval || 15; // Default to 15 minutes

  const handleProgressModeChange = (newMode) => {
    onSettingChange('progressMeter', 'progressMode', newMode);
  };

  const handleAutoUpdateIntervalChange = (newInterval) => {
    onSettingChange('progressMeter', 'autoUpdateInterval', parseInt(newInterval, 10));
  };

  const progressModes = [
    {
      id: 'auto',
      title: 'Auto-Determination',
      description: 'AI analyzes your progress and updates meters automatically',
      icon: 'Zap',
      color: 'primary'
    },
    {
      id: 'manual',
      title: 'Manual Control',
      description: 'You control when and how progress meters are updated',
      icon: 'Hand',
      color: 'secondary'
    },
    {
      id: 'hybrid',
      title: 'Hybrid Mode',
      description: 'AI suggestions with manual confirmation',
      icon: 'GitMerge',
      color: 'accent'
    }
  ];

  const intervalOptions = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 180, label: '3 hours' }
  ];

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
          <Icon name="BarChart3" size={16} color="#FFFFFF" />
        </div>
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary">Progress Tracking</h3>
          <p className="text-sm text-text-secondary">Configure how your goal progress is measured and updated</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-3">
            Progress Update Mode
          </label>
          <div className="grid gap-3" role="radiogroup" aria-label="Progress Update Mode"
            onKeyDown={e => {
              if (["ArrowUp", "ArrowDown"].includes(e.key)) {
                e.preventDefault();
                const idx = progressModes.findIndex(m => m.id === progressMode);
                let nextIdx = e.key === "ArrowUp" ? idx - 1 : idx + 1;
                if (nextIdx < 0) nextIdx = progressModes.length - 1;
                if (nextIdx >= progressModes.length) nextIdx = 0;
                handleProgressModeChange(progressModes[nextIdx].id);
                document.getElementById(`progress-mode-radio-${progressModes[nextIdx].id}`)?.focus();
              }
            }}
          >
            {progressModes.map((mode) => (
              <label
                key={mode.id}
                id={`progress-mode-radio-${mode.id}`}
                className={`
                  relative flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-normal
                  ${progressMode === mode.id
                    ? 'border-primary bg-primary/5' :'border-border hover:border-border-strong hover:bg-surface-700'
                  }
                `}
                role="radio"
                aria-checked={progressMode === mode.id}
                tabIndex={progressMode === mode.id ? 0 : -1}
                aria-label={mode.title}
              >
                <input
                  type="radio"
                  name="progressMode"
                  value={mode.id}
                  checked={progressMode === mode.id}
                  onChange={(e) => handleProgressModeChange(e.target.value)}
                  className="sr-only"
                />
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-normal
                  ${progressMode === mode.id
                    ? 'border-primary bg-primary' :'border-border'
                  }
                `}>
                  {progressMode === mode.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name={mode.icon} size={16} color={progressMode === mode.id ? '#6366F1' : '#94A3B8'} />
                    <span className="text-sm font-body-medium text-text-primary">{mode.title}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{mode.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {progressMode === 'auto' && (
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Auto-Update Interval
            </label>
            <select
              value={autoUpdateInterval}
              onChange={(e) => handleAutoUpdateIntervalChange(e.target.value)}
              className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label="Auto-Update Interval"
            >
              {intervalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-secondary mt-1">
              How often AI should check and update your progress
            </p>
          </div>
        )}

        <div className="bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-heading-medium text-text-primary mb-2">Progress Tracking Tips</h4>
          <ul className="text-xs text-text-secondary space-y-1 font-caption">
            <li>• Auto mode works best with detailed milestone descriptions</li>
            <li>• Manual mode gives you complete control over progress updates</li>
            <li>• Hybrid mode combines AI insights with your final decision</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProgressMeterSection;