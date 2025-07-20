import React from 'react';
import Icon from '../../../components/AppIcon';
import { useSettings } from '../../../context/SettingsContext';

const AppearanceSection = () => {
  const { settings, updateAppearanceSettings } = useSettings();
  const appearance = settings?.appearance || {};
  const theme = appearance?.theme || 'dark';
  const accentColor = appearance?.accentColor || 'indigo';
  const backgroundEffect = appearance?.backgroundEffect || 'none';
  // animationIntensity is being removed

  const handleThemeChange = (newTheme) => {
    updateAppearanceSettings({ theme: newTheme });
  };

  const handleAccentColorChange = (newAccentColor) => {
    updateAppearanceSettings({ accentColor: newAccentColor });
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
    updateAppearanceSettings({ accentColor: paletteId });
  };

  // animationLevels removed

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      {/* Live Preview Bar */}
      <div className="flex items-center space-x-4 mb-6">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg border-2 ${theme === 'dark' ? 'bg-slate-900 border-primary' : theme === 'light' ? 'bg-slate-50 border-accent' : 'bg-gradient-to-r from-slate-900 to-slate-50 border-secondary'}`}>
          <Icon name={theme === 'dark' ? 'Moon' : theme === 'light' ? 'Sun' : 'Monitor'} size={20} color={theme === 'light' ? '#0F172A' : '#FFFFFF'} />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-secondary">Accent:</span>
          <span className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: palettes.find(p => p.id === accentColor)?.colors[0] || '#6366F1' }}></span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-secondary">Effect:</span>
          <span className="text-xs font-body-medium text-text-primary">{backgroundEffect.charAt(0).toUpperCase() + backgroundEffect.slice(1)}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-3">
            Theme
          </label>
          <div
            className="grid gap-3"
            role="radiogroup"
            aria-label="Theme Selection"
            onKeyDown={e => {
              if (["ArrowUp", "ArrowDown"].includes(e.key)) {
                e.preventDefault();
                const idx = themes.findIndex(t => t.id === theme);
                let nextIdx = e.key === "ArrowUp" ? idx - 1 : idx + 1;
                if (nextIdx < 0) nextIdx = themes.length - 1;
                if (nextIdx >= themes.length) nextIdx = 0;
                handleThemeChange(themes[nextIdx].id);
                document.getElementById(`theme-radio-${themes[nextIdx].id}`)?.focus();
              }
            }}
          >
            {themes.map((themeOption) => (
              <label
                key={themeOption.id}
                id={`theme-radio-${themeOption.id}`}
                className={`
                  relative flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-normal
                  ${theme === themeOption.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border hover:border-border-strong hover:bg-surface-700'}
                `}
                role="radio"
                aria-checked={theme === themeOption.id}
                aria-label={themeOption.title}
                tabIndex={theme === themeOption.id ? 0 : -1}
              >
                <input
                  type="radio"
                  name="theme"
                  value={themeOption.id}
                  checked={theme === themeOption.id}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
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
        <div className="mt-6">
          <label className="block text-sm font-body-medium text-text-primary mb-3">
            Accent Color
          </label>
          <div
            className="flex flex-wrap gap-3"
            role="radiogroup"
            aria-label="Accent Color Selection"
            onKeyDown={e => {
              if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                const idx = palettes.findIndex(p => p.id === accentColor);
                let nextIdx = e.key === "ArrowLeft" ? idx - 1 : idx + 1;
                if (nextIdx < 0) nextIdx = palettes.length - 1;
                if (nextIdx >= palettes.length) nextIdx = 0;
                handlePaletteChange(palettes[nextIdx].id);
                document.getElementById(`palette-radio-${palettes[nextIdx].id}`)?.focus();
              }
            }}
          >
            {palettes.map((palette) => (
              <button
                key={palette.id}
                id={`palette-radio-${palette.id}`}
                type="button"
                onClick={() => handlePaletteChange(palette.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                  ${accentColor === palette.id ? 'border-primary bg-primary/10 shadow-lg' : 'border-border hover:border-primary/30 hover:bg-surface-700'}
                `}
                role="radio"
                aria-checked={accentColor === palette.id}
                aria-label={`Select ${palette.name} accent color`}
                tabIndex={accentColor === palette.id ? 0 : -1}
              >
                <div className="flex space-x-1">
                  {palette.colors.map((color, idx) => (
                    <span
                      key={color}
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color, marginLeft: idx > 0 ? '-0.5rem' : 0 }}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm font-body-medium text-text-primary">{palette.name}</span>
                {accentColor === palette.id && (
                  <Icon name="Check" size={16} color="#6366F1" className="ml-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background Effect Selection */}
        <div className="mt-6">
          <label className="block text-sm font-body-medium text-text-primary mb-3">
            Background Effect
          </label>
          <div
            className="flex flex-wrap gap-3"
            role="radiogroup"
            aria-label="Background Effect Selection"
            onKeyDown={e => {
              if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                const effects = [
                  { id: 'none', label: 'None' },
                  { id: 'particles', label: 'Particles' },
                  { id: 'creative', label: 'Creative' },
                  { id: 'abstract', label: 'Abstract' },
                  { id: 'motivational', label: 'Motivational' },
                ];
                const idx = effects.findIndex(eff => eff.id === backgroundEffect);
                let nextIdx = e.key === "ArrowLeft" ? idx - 1 : idx + 1;
                if (nextIdx < 0) nextIdx = effects.length - 1;
                if (nextIdx >= effects.length) nextIdx = 0;
                updateAppearanceSettings({ backgroundEffect: effects[nextIdx].id });
                document.getElementById(`effect-radio-${effects[nextIdx].id}`)?.focus();
              }
            }}
          >
            {[
              { id: 'none', label: 'None' },
              { id: 'particles', label: 'Particles' },
              { id: 'creative', label: 'Creative' },
              { id: 'abstract', label: 'Abstract' },
              { id: 'motivational', label: 'Motivational' },
            ].map((effect) => (
              <button
                key={effect.id}
                id={`effect-radio-${effect.id}`}
                type="button"
                onClick={() => updateAppearanceSettings({ backgroundEffect: effect.id })}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                  ${backgroundEffect === effect.id ? 'border-primary bg-primary/10 shadow-lg' : 'border-border hover:border-primary/30 hover:bg-surface-700'}
                `}
                role="radio"
                aria-checked={backgroundEffect === effect.id}
                aria-label={`Select ${effect.label} background effect`}
                tabIndex={backgroundEffect === effect.id ? 0 : -1}
              >
                <span className="text-sm font-body-medium text-text-primary">{effect.label}</span>
                {backgroundEffect === effect.id && (
                  <Icon name="Check" size={16} color="#6366F1" className="ml-2" />
                )}
              </button>
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