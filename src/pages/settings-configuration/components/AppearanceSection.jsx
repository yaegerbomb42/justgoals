import React from 'react';
import Icon from '../../../components/AppIcon';

const AppearanceSection = ({ settings, onSettingChange }) => {
  // Extract values from settings.appearance, providing defaults
  const appearance = settings?.appearance || {};
  const theme = appearance?.theme || 'dark';
  const accentColor = appearance?.accentColor || 'indigo';
  const backgroundEffect = appearance?.backgroundEffect || 'none';
  // animationIntensity is being removed

  const handleThemeChange = (newTheme) => {
    onSettingChange('appearance', 'theme', newTheme);
  };

  const handleAccentColorChange = (newAccentColor) => {
    onSettingChange('appearance', 'accentColor', newAccentColor);
  };

  const themes = [
    {
      id: 'dark',
      title: 'Dark Theme',
      description: 'Optimized for low-light environments',
      icon: 'Moon',
      preview: 'bg-slate-900'
    },
    {
      id: 'light',
      title: 'Light Theme',
      description: 'Clean and bright interface',
      icon: 'Sun',
      preview: 'bg-slate-50'
    },
    {
      id: 'auto',
      title: 'System Theme',
      description: 'Follows your system preference',
      icon: 'Monitor',
      preview: 'bg-gradient-to-r from-slate-900 to-slate-50'
    }
  ];

  // Grouped theme palettes
  const palettes = [
    {
      id: 'blue-teal',
      name: 'Blue Teal',
      colors: ['#3E54D3', '#4F80E2', '#15CDCA', '#4FE086']
    },
    {
      id: 'dopamine',
      name: 'Dopamine',
      colors: ['#FEF400', '#FF05D0', '#00DF60']
    },
    {
      id: 'indigo',
      name: 'Indigo',
      colors: ['#6366F1', '#818CF8', '#8B5CF6']
    },
    {
      id: 'emerald',
      name: 'Emerald',
      colors: ['#10B981', '#34D399', '#A7F3D0']
    },
    // Add more palettes as desired
  ];

  const handlePaletteChange = (paletteId) => {
    onSettingChange('appearance', 'accentColor', paletteId);
  };

  // animationLevels removed

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
          <Icon name="Palette" size={16} color="#FFFFFF" />
        </div>
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary">Appearance</h3>
          <p className="text-sm text-text-secondary">Customize the visual experience to match your preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-3">
            Theme
          </label>
          <div className="grid gap-3">
            {themes.map((themeOption) => (
              <label
                key={themeOption.id}
                className={`
                  relative flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-normal
                  ${theme === themeOption.id
                    ? 'border-primary bg-primary/5' :'border-border hover:border-border-strong hover:bg-surface-700'
                  }
                `}
              >
                <input
                  type="radio"
                  name="theme"
                  value={themeOption.id}
                  checked={theme === themeOption.id}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-8 h-8 rounded-lg ${themeOption.preview} flex items-center justify-center`}>
                  <Icon name={themeOption.icon} size={16} color={themeOption.id === 'light' ? '#0F172A' : '#FFFFFF'} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-body-medium text-text-primary">{themeOption.title}</div>
                  <div className="text-xs text-text-secondary">{themeOption.description}</div>
                </div>
                {theme === themeOption.id && (
                  <Icon name="Check" size={16} color="#6366F1" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Theme Palette Selection */}
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-3">
            Theme Palette
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {palettes.map((palette) => (
              <button
                key={palette.id}
                onClick={() => handlePaletteChange(palette.id)}
                className={`
                  flex items-center space-x-3 p-4 rounded-lg border transition-all duration-normal
                  ${accentColor === palette.id
                    ? 'border-primary bg-primary/5' :'border-border hover:border-border-strong hover:bg-surface-700'
                  }
                `}
              >
                <div className="flex space-x-1">
                  {palette.colors.map((color, idx) => (
                    <span
                      key={color}
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: color, marginLeft: idx === 0 ? 0 : 4 }}
                    />
                  ))}
                </div>
                <span className="ml-4 text-sm font-body-medium text-text-primary">{palette.name}</span>
                {accentColor === palette.id && (
                  <Icon name="Check" size={16} color="#6366F1" className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background Effect Selection */}
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-3">
            Animated Background Effect
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'none', name: 'None', description: 'Solid background color' },
              { id: 'subtle-gradient', name: 'Gentle Gradient', description: 'Slowly shifting background colors' },
              { id: 'flowing-particles', name: 'Flowing Particles', description: 'Abstract particle animation' },
              { id: 'abstract-waves', name: 'Abstract Waves', description: 'Calm wave-like motion' },
              { id: 'energy', name: 'Energy', description: 'Vibrant, motivational energy background' },
              { id: 'confetti', name: 'Confetti', description: 'Celebratory confetti animation' },
              { id: 'sunrise', name: 'Sunrise', description: 'Uplifting animated sunrise' },
            ].map((effect) => (
              <label
                key={effect.id}
                className={`
                  relative flex flex-col items-start p-4 rounded-lg border cursor-pointer transition-all duration-normal
                  ${backgroundEffect === effect.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border-strong hover:bg-surface-700'
                  }
                `}
              >
                <input
                  type="radio"
                  name="backgroundEffect"
                  value={effect.id}
                  checked={backgroundEffect === effect.id}
                  onChange={(e) => onSettingChange('appearance', 'backgroundEffect', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-sm font-body-medium text-text-primary">{effect.name}</span>
                  {backgroundEffect === effect.id && (
                    <Icon name="CheckCircle" size={18} className="text-primary" />
                  )}
                </div>
                <p className="text-xs text-text-secondary">{effect.description}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Animation Intensity section removed */}

        <div className="bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-heading-medium text-text-primary mb-2">Visual Experience</h4>
          <ul className="text-xs text-text-secondary space-y-1 font-caption">
            <li>• Theme and color changes apply immediately.</li>
            <li>• Enjoy a visually consistent experience across the app.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;