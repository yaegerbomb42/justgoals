import React from 'react';
import Icon from '../../../components/AppIcon';
import { useSettings } from '../../../context/SettingsContext';
import { getAvailableThemes } from '../../../utils/themeUtils';

const AppearanceSection = () => {
  const { settings, updateAppearanceSettings } = useSettings();
  const appearance = settings?.appearance || {};
  const theme = appearance?.theme || 'dark';
  const accentColor = appearance?.accentColor || 'indigo';
  const backgroundEffect = appearance?.backgroundEffect || 'none';
  const backgroundMusic = appearance?.backgroundMusic || 'none';
  const backgroundMusicVolume = appearance?.backgroundMusicVolume ?? 0.5;
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

  // Grouped theme palettes - use the comprehensive theme utility
  const palettes = getAvailableThemes();

  const handlePaletteChange = (paletteId) => {
    updateAppearanceSettings({ accentColor: paletteId });
  };

  // animationLevels removed

  const musicOptions = [
    { id: 'none', name: 'None', icon: 'VolumeX' },
    { id: 'rain', name: 'Rain', icon: 'CloudRain' },
    { id: 'forest', name: 'Forest', icon: 'Trees' },
    { id: 'ocean', name: 'Ocean Waves', icon: 'Waves' },
    { id: 'cafe', name: 'Coffee Shop', icon: 'Coffee' },
    { id: 'whitenoise', name: 'White Noise', icon: 'Radio' },
    { id: 'chime', name: 'Gentle Chime', icon: 'Bell' }
  ];

  return (
    <div className="bg-surface rounded-lg p-6 border border-border transition-colors duration-200" style={{ minHeight: '600px' }}>
      {/* Live Preview Bar - Fixed height to prevent layout shift */}
      <div className="flex items-center space-x-4 mb-6 min-h-[60px]">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg border-2 transition-all duration-200 ${theme === 'dark' ? 'bg-slate-900 border-primary' : theme === 'light' ? 'bg-slate-50 border-accent' : 'bg-gradient-to-r from-slate-900 to-slate-50 border-secondary'}`}>
          <Icon name={theme === 'dark' ? 'Moon' : theme === 'light' ? 'Sun' : 'Monitor'} size={20} color={theme === 'light' ? '#0F172A' : '#FFFFFF'} />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-secondary">Accent:</span>
          <span className="w-5 h-5 rounded-full border border-border transition-colors duration-200" style={{ backgroundColor: palettes.find(p => p.id === accentColor)?.colors[0] || '#6366F1' }}></span>
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

        {/* Background Music Selection */}
        <div className="mt-6">
          <label className="block text-sm font-body-medium text-text-primary mb-3">
            Background Music
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {musicOptions.map((music) => (
              <button
                key={music.id}
                onClick={() => updateAppearanceSettings({ backgroundMusic: music.id })}
                className={`flex flex-col items-center space-y-2 p-3 rounded-lg border transition-all duration-normal
                  ${backgroundMusic === music.id ? 'border-primary bg-primary/5' : 'border-border hover:border-border-strong hover:bg-surface-700'}
                `}
              >
                <Icon name={music.icon} className="w-5 h-5" color={backgroundMusic === music.id ? '#6366F1' : '#94A3B8'} />
                <span className="text-xs font-caption text-text-primary text-center">{music.name}</span>
                {backgroundMusic === music.id && (
                  <Icon name="Check" className="w-3 h-3 text-primary" />
                )}
              </button>
            ))}
          </div>
          {backgroundMusic !== 'none' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Music Volume: {Math.round(backgroundMusicVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={backgroundMusicVolume}
                onChange={e => updateAppearanceSettings({ backgroundMusicVolume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-surface-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
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