/**
 * Comprehensive theme utility functions for dynamic color palette generation
 * This enables automatic theming for all UI components based on user's accent color choice
 */

// Color palette definitions for each accent color theme
export const themeColorPalettes = {
  indigo: {
    light: {
      primary: '#6366F1',
      'primary-foreground': '#FFFFFF',
      secondary: '#8B5CF6',
      'secondary-foreground': '#FFFFFF',
      accent: '#10B981',
      'accent-foreground': '#FFFFFF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      // Extended UI colors based on indigo theme
      muted: '#6366F1',
      'muted-foreground': '#FFFFFF',
      card: '#F8FAFC',
      'card-foreground': '#0F172A',
      popover: '#FFFFFF',
      'popover-foreground': '#0F172A',
      destructive: '#EF4444',
      'destructive-foreground': '#FFFFFF',
      ring: '#6366F1',
      input: '#E2E8F0',
      // Component-specific colors
      'button-ghost-hover': '#6366F1',
      'button-outline-border': '#6366F1',
      'nav-active': '#6366F1',
      'nav-hover': '#EEF2FF',
      'sidebar-accent': '#6366F1',
      'form-focus': '#6366F1',
      'chart-primary': '#6366F1',
      'chart-secondary': '#8B5CF6',
      'chart-tertiary': '#10B981',
    },
    dark: {
      primary: '#818CF8',
      'primary-foreground': '#FFFFFF',
      secondary: '#A78BFA',
      'secondary-foreground': '#FFFFFF',
      accent: '#34D399',
      'accent-foreground': '#0F172A',
      success: '#34D399',
      warning: '#FCD34D',
      error: '#F87171',
      // Extended UI colors based on indigo theme
      muted: '#818CF8',
      'muted-foreground': '#FFFFFF',
      card: '#1E293B',
      'card-foreground': '#F8FAFC',
      popover: '#1E293B',
      'popover-foreground': '#F8FAFC',
      destructive: '#F87171',
      'destructive-foreground': '#FFFFFF',
      ring: '#818CF8',
      input: '#334155',
      // Component-specific colors
      'button-ghost-hover': '#818CF8',
      'button-outline-border': '#818CF8',
      'nav-active': '#818CF8',
      'nav-hover': '#312E81',
      'sidebar-accent': '#818CF8',
      'form-focus': '#818CF8',
      'chart-primary': '#818CF8',
      'chart-secondary': '#A78BFA',
      'chart-tertiary': '#34D399',
    }
  },

  emerald: {
    light: {
      primary: '#10B981',
      'primary-foreground': '#FFFFFF',
      secondary: '#059669',
      'secondary-foreground': '#FFFFFF',
      accent: '#6366F1',
      'accent-foreground': '#FFFFFF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      // Extended UI colors
      muted: '#10B981',
      'muted-foreground': '#FFFFFF',
      card: '#F8FAFC',
      'card-foreground': '#0F172A',
      popover: '#FFFFFF',
      'popover-foreground': '#0F172A',
      destructive: '#EF4444',
      'destructive-foreground': '#FFFFFF',
      ring: '#10B981',
      input: '#E2E8F0',
      'button-ghost-hover': '#10B981',
      'button-outline-border': '#10B981',
      'nav-active': '#10B981',
      'nav-hover': '#ECFDF5',
      'sidebar-accent': '#10B981',
      'form-focus': '#10B981',
      'chart-primary': '#10B981',
      'chart-secondary': '#059669',
      'chart-tertiary': '#6366F1',
    },
    dark: {
      primary: '#34D399',
      'primary-foreground': '#064E3B',
      secondary: '#10B981',
      'secondary-foreground': '#FFFFFF',
      accent: '#818CF8',
      'accent-foreground': '#0F172A',
      success: '#34D399',
      warning: '#FCD34D',
      error: '#F87171',
      // Extended UI colors
      muted: '#34D399',
      'muted-foreground': '#064E3B',
      card: '#1E293B',
      'card-foreground': '#F8FAFC',
      popover: '#1E293B',
      'popover-foreground': '#F8FAFC',
      destructive: '#F87171',
      'destructive-foreground': '#FFFFFF',
      ring: '#34D399',
      input: '#334155',
      'button-ghost-hover': '#34D399',
      'button-outline-border': '#34D399',
      'nav-active': '#34D399',
      'nav-hover': '#064E3B',
      'sidebar-accent': '#34D399',
      'form-focus': '#34D399',
      'chart-primary': '#34D399',
      'chart-secondary': '#10B981',
      'chart-tertiary': '#818CF8',
    }
  },

  violet: {
    light: {
      primary: '#8B5CF6',
      'primary-foreground': '#FFFFFF',
      secondary: '#A78BFA',
      'secondary-foreground': '#FFFFFF',
      accent: '#10B981',
      'accent-foreground': '#FFFFFF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      // Extended UI colors
      muted: '#8B5CF6',
      'muted-foreground': '#FFFFFF',
      card: '#F8FAFC',
      'card-foreground': '#0F172A',
      popover: '#FFFFFF',
      'popover-foreground': '#0F172A',
      destructive: '#EF4444',
      'destructive-foreground': '#FFFFFF',
      ring: '#8B5CF6',
      input: '#E2E8F0',
      'button-ghost-hover': '#8B5CF6',
      'button-outline-border': '#8B5CF6',
      'nav-active': '#8B5CF6',
      'nav-hover': '#F5F3FF',
      'sidebar-accent': '#8B5CF6',
      'form-focus': '#8B5CF6',
      'chart-primary': '#8B5CF6',
      'chart-secondary': '#A78BFA',
      'chart-tertiary': '#10B981',
    },
    dark: {
      primary: '#A78BFA',
      'primary-foreground': '#FFFFFF',
      secondary: '#C4B5FD',
      'secondary-foreground': '#4C1D95',
      accent: '#34D399',
      'accent-foreground': '#0F172A',
      success: '#34D399',
      warning: '#FCD34D',
      error: '#F87171',
      // Extended UI colors
      muted: '#A78BFA',
      'muted-foreground': '#FFFFFF',
      card: '#1E293B',
      'card-foreground': '#F8FAFC',
      popover: '#1E293B',
      'popover-foreground': '#F8FAFC',
      destructive: '#F87171',
      'destructive-foreground': '#FFFFFF',
      ring: '#A78BFA',
      input: '#334155',
      'button-ghost-hover': '#A78BFA',
      'button-outline-border': '#A78BFA',
      'nav-active': '#A78BFA',
      'nav-hover': '#4C1D95',
      'sidebar-accent': '#A78BFA',
      'form-focus': '#A78BFA',
      'chart-primary': '#A78BFA',
      'chart-secondary': '#C4B5FD',
      'chart-tertiary': '#34D399',
    }
  },

  blue: {
    light: {
      primary: '#3B82F6',
      'primary-foreground': '#FFFFFF',
      secondary: '#60A5FA',
      'secondary-foreground': '#FFFFFF',
      accent: '#10B981',
      'accent-foreground': '#FFFFFF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      // Extended UI colors
      muted: '#3B82F6',
      'muted-foreground': '#FFFFFF',
      card: '#F8FAFC',
      'card-foreground': '#0F172A',
      popover: '#FFFFFF',
      'popover-foreground': '#0F172A',
      destructive: '#EF4444',
      'destructive-foreground': '#FFFFFF',
      ring: '#3B82F6',
      input: '#E2E8F0',
      'button-ghost-hover': '#3B82F6',
      'button-outline-border': '#3B82F6',
      'nav-active': '#3B82F6',
      'nav-hover': '#EFF6FF',
      'sidebar-accent': '#3B82F6',
      'form-focus': '#3B82F6',
      'chart-primary': '#3B82F6',
      'chart-secondary': '#60A5FA',
      'chart-tertiary': '#10B981',
    },
    dark: {
      primary: '#60A5FA',
      'primary-foreground': '#FFFFFF',
      secondary: '#93C5FD',
      'secondary-foreground': '#1E3A8A',
      accent: '#34D399',
      'accent-foreground': '#0F172A',
      success: '#34D399',
      warning: '#FCD34D',
      error: '#F87171',
      // Extended UI colors
      muted: '#60A5FA',
      'muted-foreground': '#FFFFFF',
      card: '#1E293B',
      'card-foreground': '#F8FAFC',
      popover: '#1E293B',
      'popover-foreground': '#F8FAFC',
      destructive: '#F87171',
      'destructive-foreground': '#FFFFFF',
      ring: '#60A5FA',
      input: '#334155',
      'button-ghost-hover': '#60A5FA',
      'button-outline-border': '#60A5FA',
      'nav-active': '#60A5FA',
      'nav-hover': '#1E3A8A',
      'sidebar-accent': '#60A5FA',
      'form-focus': '#60A5FA',
      'chart-primary': '#60A5FA',
      'chart-secondary': '#93C5FD',
      'chart-tertiary': '#34D399',
    }
  },

  rose: {
    light: {
      primary: '#F43F5E',
      'primary-foreground': '#FFFFFF',
      secondary: '#FB7185',
      'secondary-foreground': '#FFFFFF',
      accent: '#10B981',
      'accent-foreground': '#FFFFFF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      // Extended UI colors
      muted: '#F43F5E',
      'muted-foreground': '#FFFFFF',
      card: '#F8FAFC',
      'card-foreground': '#0F172A',
      popover: '#FFFFFF',
      'popover-foreground': '#0F172A',
      destructive: '#EF4444',
      'destructive-foreground': '#FFFFFF',
      ring: '#F43F5E',
      input: '#E2E8F0',
      'button-ghost-hover': '#F43F5E',
      'button-outline-border': '#F43F5E',
      'nav-active': '#F43F5E',
      'nav-hover': '#FFF1F2',
      'sidebar-accent': '#F43F5E',
      'form-focus': '#F43F5E',
      'chart-primary': '#F43F5E',
      'chart-secondary': '#FB7185',
      'chart-tertiary': '#10B981',
    },
    dark: {
      primary: '#FB7185',
      'primary-foreground': '#FFFFFF',
      secondary: '#FDA4AF',
      'secondary-foreground': '#881337',
      accent: '#34D399',
      'accent-foreground': '#0F172A',
      success: '#34D399',
      warning: '#FCD34D',
      error: '#F87171',
      // Extended UI colors
      muted: '#FB7185',
      'muted-foreground': '#FFFFFF',
      card: '#1E293B',
      'card-foreground': '#F8FAFC',
      popover: '#1E293B',
      'popover-foreground': '#F8FAFC',
      destructive: '#F87171',
      'destructive-foreground': '#FFFFFF',
      ring: '#FB7185',
      input: '#334155',
      'button-ghost-hover': '#FB7185',
      'button-outline-border': '#FB7185',
      'nav-active': '#FB7185',
      'nav-hover': '#881337',
      'sidebar-accent': '#FB7185',
      'form-focus': '#FB7185',
      'chart-primary': '#FB7185',
      'chart-secondary': '#FDA4AF',
      'chart-tertiary': '#34D399',
    }
  },

  amber: {
    light: {
      primary: '#F59E0B',
      'primary-foreground': '#FFFFFF',
      secondary: '#FBBF24',
      'secondary-foreground': '#FFFFFF',
      accent: '#6366F1',
      'accent-foreground': '#FFFFFF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      // Extended UI colors
      muted: '#F59E0B',
      'muted-foreground': '#FFFFFF',
      card: '#F8FAFC',
      'card-foreground': '#0F172A',
      popover: '#FFFFFF',
      'popover-foreground': '#0F172A',
      destructive: '#EF4444',
      'destructive-foreground': '#FFFFFF',
      ring: '#F59E0B',
      input: '#E2E8F0',
      'button-ghost-hover': '#F59E0B',
      'button-outline-border': '#F59E0B',
      'nav-active': '#F59E0B',
      'nav-hover': '#FFFBEB',
      'sidebar-accent': '#F59E0B',
      'form-focus': '#F59E0B',
      'chart-primary': '#F59E0B',
      'chart-secondary': '#FBBF24',
      'chart-tertiary': '#6366F1',
    },
    dark: {
      primary: '#FBBF24',
      'primary-foreground': '#78350F',
      secondary: '#FCD34D',
      'secondary-foreground': '#78350F',
      accent: '#818CF8',
      'accent-foreground': '#0F172A',
      success: '#34D399',
      warning: '#FCD34D',
      error: '#F87171',
      // Extended UI colors
      muted: '#FBBF24',
      'muted-foreground': '#78350F',
      card: '#1E293B',
      'card-foreground': '#F8FAFC',
      popover: '#1E293B',
      'popover-foreground': '#F8FAFC',
      destructive: '#F87171',
      'destructive-foreground': '#FFFFFF',
      ring: '#FBBF24',
      input: '#334155',
      'button-ghost-hover': '#FBBF24',
      'button-outline-border': '#FBBF24',
      'nav-active': '#FBBF24',
      'nav-hover': '#78350F',
      'sidebar-accent': '#FBBF24',
      'form-focus': '#FBBF24',
      'chart-primary': '#FBBF24',
      'chart-secondary': '#FCD34D',
      'chart-tertiary': '#818CF8',
    }
  },

  // Special theme palettes
  'blue-teal': {
    light: {
      primary: '#3E54D3',
      'primary-foreground': '#FFFFFF',
      secondary: '#4F80E2',
      'secondary-foreground': '#FFFFFF',
      accent: '#15CDCA',
      'accent-foreground': '#FFFFFF',
      success: '#4FE086',
      warning: '#F59E0B',
      error: '#EF4444',
      // Extended UI colors
      muted: '#3E54D3',
      'muted-foreground': '#FFFFFF',
      card: '#F8FAFC',
      'card-foreground': '#0F172A',
      popover: '#FFFFFF',
      'popover-foreground': '#0F172A',
      destructive: '#EF4444',
      'destructive-foreground': '#FFFFFF',
      ring: '#3E54D3',
      input: '#E2E8F0',
      'button-ghost-hover': '#3E54D3',
      'button-outline-border': '#3E54D3',
      'nav-active': '#3E54D3',
      'nav-hover': '#F0F4FF',
      'sidebar-accent': '#3E54D3',
      'form-focus': '#3E54D3',
      'chart-primary': '#3E54D3',
      'chart-secondary': '#4F80E2',
      'chart-tertiary': '#15CDCA',
    },
    dark: {
      primary: '#4F80E2',
      'primary-foreground': '#FFFFFF',
      secondary: '#6B95F4',
      'secondary-foreground': '#FFFFFF',
      accent: '#2DD4D1',
      'accent-foreground': '#0F172A',
      success: '#5FE896',
      warning: '#FCD34D',
      error: '#F87171',
      // Extended UI colors
      muted: '#4F80E2',
      'muted-foreground': '#FFFFFF',
      card: '#1E293B',
      'card-foreground': '#F8FAFC',
      popover: '#1E293B',
      'popover-foreground': '#F8FAFC',
      destructive: '#F87171',
      'destructive-foreground': '#FFFFFF',
      ring: '#4F80E2',
      input: '#334155',
      'button-ghost-hover': '#4F80E2',
      'button-outline-border': '#4F80E2',
      'nav-active': '#4F80E2',
      'nav-hover': '#1E3A8A',
      'sidebar-accent': '#4F80E2',
      'form-focus': '#4F80E2',
      'chart-primary': '#4F80E2',
      'chart-secondary': '#6B95F4',
      'chart-tertiary': '#2DD4D1',
    }
  },

  dopamine: {
    light: {
      primary: '#FF05D0',
      'primary-foreground': '#FFFFFF',
      secondary: '#FEF400',
      'secondary-foreground': '#000000',
      accent: '#00DF60',
      'accent-foreground': '#FFFFFF',
      success: '#00DF60',
      warning: '#FEF400',
      error: '#FF05D0',
      // Extended UI colors
      muted: '#FF05D0',
      'muted-foreground': '#FFFFFF',
      card: '#F8FAFC',
      'card-foreground': '#0F172A',
      popover: '#FFFFFF',
      'popover-foreground': '#0F172A',
      destructive: '#FF05D0',
      'destructive-foreground': '#FFFFFF',
      ring: '#FF05D0',
      input: '#E2E8F0',
      'button-ghost-hover': '#FF05D0',
      'button-outline-border': '#FF05D0',
      'nav-active': '#FF05D0',
      'nav-hover': '#FDF2F8',
      'sidebar-accent': '#FF05D0',
      'form-focus': '#FF05D0',
      'chart-primary': '#FF05D0',
      'chart-secondary': '#FEF400',
      'chart-tertiary': '#00DF60',
    },
    dark: {
      primary: '#FF05D0',
      'primary-foreground': '#FFFFFF',
      secondary: '#FEF400',
      'secondary-foreground': '#000000',
      accent: '#00DF60',
      'accent-foreground': '#000000',
      success: '#00DF60',
      warning: '#FEF400',
      error: '#FF6B6B',
      // Extended UI colors
      muted: '#FF05D0',
      'muted-foreground': '#FFFFFF',
      card: '#1E293B',
      'card-foreground': '#F8FAFC',
      popover: '#1E293B',
      'popover-foreground': '#F8FAFC',
      destructive: '#FF6B6B',
      'destructive-foreground': '#FFFFFF',
      ring: '#FF05D0',
      input: '#334155',
      'button-ghost-hover': '#FF05D0',
      'button-outline-border': '#FF05D0',
      'nav-active': '#FF05D0',
      'nav-hover': '#831843',
      'sidebar-accent': '#FF05D0',
      'form-focus': '#FF05D0',
      'chart-primary': '#FF05D0',
      'chart-secondary': '#FEF400',
      'chart-tertiary': '#00DF60',
    }
  }
};

/**
 * Apply theme colors to CSS variables on the document root
 * @param {string} accentColor - The accent color key (e.g., 'indigo', 'emerald')
 * @param {string} theme - The theme mode ('light', 'dark', 'system')
 */
export const applyThemeColors = (accentColor = 'indigo', theme = 'system') => {
  const root = document.documentElement;
  
  // Determine actual theme based on system preference if needed
  let actualTheme = theme;
  if (theme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // Get the color palette for the selected accent color and theme
  const palette = themeColorPalettes[accentColor];
  if (!palette || !palette[actualTheme]) {
    console.warn(`Theme palette not found for accent color: ${accentColor}, theme: ${actualTheme}`);
    return;
  }
  
  const colors = palette[actualTheme];
  
  // Apply all colors from the palette to CSS variables
  Object.entries(colors).forEach(([colorName, colorValue]) => {
    root.style.setProperty(`--color-${colorName}`, colorValue);
  });
  
  // Update the legacy accent color variables for backwards compatibility
  root.style.setProperty('--chosen-accent-light', colors.primary);
  root.style.setProperty('--chosen-accent-dark', colors.primary);
  root.style.setProperty('--chosen-accent-foreground', colors['primary-foreground']);
  
  // Ensure the theme class is applied to the body
  document.body.classList.remove('dark', 'light');
  if (actualTheme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.add('light');
  }
  
  // Force a repaint to ensure theme changes are applied immediately
  document.body.style.visibility = 'hidden';
  document.body.offsetHeight; // Trigger a reflow
  document.body.style.visibility = 'visible';
};

/**
 * Get available theme color options for UI display
 */
export const getAvailableThemes = () => {
  return Object.keys(themeColorPalettes).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '),
    colors: [
      themeColorPalettes[key].light.primary,
      themeColorPalettes[key].light.secondary,
      themeColorPalettes[key].light.accent
    ]
  }));
};

/**
 * Initialize theme on app load
 */
export const initializeTheme = (settings) => {
  const accentColor = settings?.appearance?.accentColor || settings?.accentColor || 'indigo';
  const theme = settings?.appearance?.theme || settings?.theme || 'system';
  
  applyThemeColors(accentColor, theme);
};