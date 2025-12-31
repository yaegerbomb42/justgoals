import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from './Icon';
import UnifiedAICommandBar from './UnifiedAICommandBar';

const Header = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { isMusicMuted, setMusicMuted } = useSettings();
  const { achievements, unreadCount } = useAchievements();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommandBar, setShowCommandBar] = useState(false);
  const profileMenuRef = useRef(null);

  const isMobile = settings?.mobile?.detected;
  const compactHeader = settings?.mobile?.compactHeader;

  // Global keyboard shortcut for command bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandBar(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const primaryNavItems = [
    { path: '/goals-dashboard', label: 'Goals', icon: 'Target' },
    { path: '/temp-todos', label: 'Todos', icon: 'ListTodo' },
    { path: '/day', label: 'Today', icon: 'Calendar' },
    { path: '/focus-mode', label: 'Focus', icon: 'Zap' },
  ];

  const secondaryNavItems = [
    { path: '/progress', label: 'Progress', icon: 'TrendingUp' },
    { path: '/habits', label: 'Habits', icon: 'Repeat' },
    { path: '/meals', label: 'Meals', icon: 'UtensilsCrossed' },
    { path: '/journal', label: 'Journal', icon: 'BookOpen' },
    { path: '/analytics-dashboard', label: 'Analytics', icon: 'BarChart3' },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems, 
    { path: '/ai-assistant-chat-drift', label: 'Drift', icon: 'MessageCircle' },
    { path: '/settings-configuration', label: 'Settings', icon: 'Settings' }
  ];

  const getCurrentPage = () => {
    return allNavItems.find(item => location.pathname.startsWith(item.path))?.label || 'JustGoals';
  };

  const isActivePath = (path) => location.pathname.startsWith(path);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        compactHeader && isMobile ? 'py-2' : 'py-2'
      }`}>
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-surface/70 backdrop-blur-xl border-b border-border/30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 cursor-pointer"
                onClick={() => navigate('/goals-dashboard')}
              >
                <div className="w-9 h-9 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Icon name="Target" className="w-5 h-5 text-white" />
                </div>
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-text-primary text-lg tracking-tight">
                  Just<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Goals</span>
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="hidden md:flex items-center space-x-1 bg-surface-700/30 rounded-xl p-1 border border-border/20">
                {primaryNavItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  return (
                    <motion.button
                      key={item.path}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(item.path)}
                      className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNavBg"
                          className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg shadow-lg"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center space-x-2">
                        <Icon name={item.icon} className="w-4 h-4" />
                        <span>{item.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
                
                {/* More dropdown for secondary items */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 px-3 py-2 text-text-secondary hover:text-text-primary rounded-lg transition-colors">
                    <Icon name="MoreHorizontal" className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                    {secondaryNavItems.map((item) => {
                      const isActive = isActivePath(item.path);
                      return (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/50'
                          }`}
                        >
                          <Icon name={item.icon} className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </nav>
            )}

            {/* Right Side Items */}
            <div className="flex items-center space-x-1">
              {/* AI Command Bar Trigger */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCommandBar(true)}
                className="relative flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border border-primary/20 rounded-xl text-text-primary transition-all group"
              >
                <Icon name="Sparkles" className="w-4 h-4 text-primary group-hover:animate-pulse" />
                <span className="hidden sm:inline text-sm font-medium">Drift AI</span>
                <div className="hidden sm:flex items-center space-x-1 text-[10px] text-text-muted">
                  <kbd className="px-1 py-0.5 bg-surface-700/50 rounded">⌘K</kbd>
                </div>
              </motion.button>

              {/* Drift Chat Link */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/ai-assistant-chat-drift')}
                className={`p-2 rounded-xl transition-all ${
                  isActivePath('/ai-assistant-chat-drift')
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/50'
                }`}
                title="Drift Chat"
              >
                <Icon name="MessageCircle" className="w-5 h-5" />
              </motion.button>

              {/* Mute/Unmute */}
              <button
                onClick={() => setMusicMuted((v) => !v)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-700/50 rounded-xl transition-all"
                title={isMusicMuted ? 'Unmute Music' : 'Mute Music'}
              >
                <Icon name={isMusicMuted ? 'VolumeX' : 'Volume2'} className="w-5 h-5" />
              </button>

              {/* Achievements */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/achievements')}
                className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-700/50 rounded-xl transition-all"
                title="Achievements"
              >
                <Icon name="Award" className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-error to-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Settings */}
              <button
                onClick={() => navigate('/settings-configuration')}
                className={`p-2 rounded-xl transition-all ${
                  isActivePath('/settings-configuration')
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/50'
                }`}
                title="Settings"
              >
                <Icon name="Settings" className="w-5 h-5" />
              </button>

              {/* Mobile Menu Button */}
              {isMobile && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-700/50 rounded-xl transition-all md:hidden"
                  title="Menu"
                >
                  <Icon name={mobileMenuOpen ? "X" : "Menu"} className="w-5 h-5" />
                </button>
              )}

              {/* Profile */}
              <div className="relative" ref={profileMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-sm border-2 border-primary/20 shadow-lg hover:shadow-primary/20 transition-all"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  title="Profile"
                >
                  {(settings?.profile?.displayName || user?.displayName)?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
                </motion.button>
                
                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-72 bg-surface/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {(settings?.profile?.displayName || user?.displayName)?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-text-primary truncate">
                              {settings?.profile?.displayName || user?.displayName || 'User'}
                            </div>
                            <div className="text-xs text-text-secondary truncate">
                              {user?.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="p-3 grid grid-cols-3 gap-2 border-b border-border/30">
                        <div className="text-center p-2 bg-surface-700/30 rounded-lg">
                          <div className="text-lg font-bold text-primary">0</div>
                          <div className="text-[10px] text-text-muted">Goals</div>
                        </div>
                        <div className="text-center p-2 bg-surface-700/30 rounded-lg">
                          <div className="text-lg font-bold text-accent">0</div>
                          <div className="text-[10px] text-text-muted">Streak</div>
                        </div>
                        <div className="text-center p-2 bg-surface-700/30 rounded-lg">
                          <div className="text-lg font-bold text-secondary">0</div>
                          <div className="text-[10px] text-text-muted">XP</div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <button
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-text-secondary hover:text-text-primary hover:bg-surface-700/50 rounded-xl transition-colors"
                          onClick={() => { navigate('/settings-configuration'); setProfileMenuOpen(false); }}
                        >
                          <Icon name="Settings" className="w-4 h-4" />
                          <span className="text-sm font-medium">Settings</span>
                        </button>
                        <button
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-error hover:bg-error/10 rounded-xl transition-colors"
                          onClick={handleLogout}
                        >
                          <Icon name="LogOut" className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {mobileMenuOpen && isMobile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-2 pb-3"
              >
                <nav className="grid grid-cols-3 gap-2 p-2 bg-surface-700/30 rounded-xl border border-border/20">
                  {allNavItems.map((item) => {
                    const isActive = isActivePath(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/50'
                        }`}
                      >
                        <Icon name={item.icon} className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16" />

      {/* AI Command Bar */}
      <UnifiedAICommandBar 
        isOpen={showCommandBar} 
        onClose={() => setShowCommandBar(false)} 
      />
    </>
  );
};

export default Header;
