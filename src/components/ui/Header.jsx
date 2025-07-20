import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from './Icon';

const Header = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { achievements, unreadCount } = useAchievements();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const isMobile = settings?.mobile?.detected;
  const compactHeader = settings?.mobile?.compactHeader;

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

  const navigationItems = [
    { path: '/goals-dashboard', label: 'Goals', icon: 'Target' },
    { path: '/day', label: 'Today', icon: 'Calendar' },
    { path: '/focus-mode', label: 'Focus', icon: 'Zap' },
    { path: '/daily-milestones', label: 'Milestones', icon: 'CheckSquare' },
    { path: '/habits', label: 'Habits', icon: 'Repeat' },
    { path: '/journal', label: 'Journal', icon: 'BookOpen' },
    { path: '/analytics-dashboard', label: 'Analytics', icon: 'BarChart3' },
    { path: '/ai-assistant-chat-drift', label: 'Drift', icon: 'MessageCircle' },
  ];

  const getCurrentPage = () => {
    return navigationItems.find(item => location.pathname.startsWith(item.path))?.label || 'JustGoals';
  };

  return (
    <header className={`bg-surface border-b border-border sticky top-0 z-40 transition-all duration-200 ${
      compactHeader && isMobile ? 'py-2' : 'py-3'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Icon name="Target" className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className={`font-heading-bold text-text-primary transition-all duration-200 ${
              compactHeader && isMobile ? 'text-lg' : 'text-xl'
            }`}>
              JustGoals
            </h1>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                    }`}
                  >
                    <Icon name={item.icon} className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Side Items */}
          <div className="flex items-center space-x-2">
            {/* Achievement Badge */}
            <button
              onClick={() => navigate('/achievements')}
              className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-700 rounded-lg transition-all duration-200"
              title="Achievements"
            >
              <Icon name="Award" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-700 rounded-lg transition-all duration-200 md:hidden"
                title="Menu"
              >
                <Icon name={mobileMenuOpen ? "X" : "Menu"} className="w-5 h-5" />
              </button>
            )}

            {/* Profile Icon & Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold border-2 border-primary-400 hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => setProfileMenuOpen((v) => !v)}
                title="Profile"
              >
                {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
              </button>
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* User Info Section */}
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                          {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-text-primary truncate">
                            {user?.displayName ?? 'User'}
                          </div>
                          <div className="text-xs text-text-secondary truncate">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-text-primary hover:bg-surface-700 rounded-lg transition-colors duration-200"
                        onClick={() => navigate('/settings-configuration')}
                      >
                        <Icon name="Settings" className="w-4 h-4 text-primary" />
                        <span className="text-sm">Settings</span>
                      </button>
                      
                      <button
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-200 mt-1"
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
              className="md:hidden mt-3 border-t border-border pt-3"
            >
              <nav className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center space-x-2 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                      }`}
                    >
                      <Icon name={item.icon} className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;