import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from '../AppIcon';
import Button from './Button';
import AchievementBadge from './AchievementBadge';
import { AnimatePresence, motion } from 'framer-motion';

const Header = () => {
  // Defensive: always provide safe defaults
  let auth = {};
  try {
    auth = useAuth() || {};
  } catch (e) {
    auth = {};
  }
  const { user = {}, isAuthenticated = false, logout = () => {} } = auth;

  let achievements = {};
  try {
    achievements = useAchievements() || {};
  } catch (e) {
    achievements = {};
  }
  const {
    userPoints = 0,
    showAllAchievementsModal = () => {},
    syncStatus = '',
    lastSync = null
  } = achievements;

  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target) &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowDownloadMenu(false);
        setIsMenuOpen(false);
        setProfileMenuOpen(false);
      } else if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target)
      ) {
        setShowDownloadMenu(false);
      } else if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      } else if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navigationItems = [
    { path: '/goals-dashboard', label: 'Goals', icon: 'Target' },
    { path: '/daily-milestones', label: 'Milestones', icon: 'CheckSquare' },
    { path: '/day', label: 'Day', icon: 'Calendar' },
    { path: '/focus-mode', label: 'Focus', icon: 'Timer' },
    { path: '/journal', label: 'Journal', icon: 'BookOpen' },
    { path: '/habits', label: 'Habits', icon: 'Repeat' },
    { path: '/ai-assistant-chat-drift', label: 'Drift AI', icon: 'MessageSquare' },
    { path: '/analytics-dashboard', label: 'Analytics', icon: 'BarChart3' },
    { path: '/achievements', label: 'Achievements', icon: 'Award' },
    { path: '/settings-configuration', label: 'Settings', icon: 'Settings' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-warning/10 border-b border-warning/20 text-warning text-center py-2">
        You are not logged in. <a href="/login" className="underline">Log in</a> to access all features.
      </div>
    );
  }

  // Move navigation items left, and group profile/achievement on the right
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center space-x-4 md:space-x-6 lg:space-x-8 pr-4 md:pr-8">
            {/* Download Dropdown */}
            <div className="relative" ref={downloadMenuRef}>
              <button
                className="flex items-center px-2 py-1 rounded hover:bg-surface-700 transition-colors"
                onClick={() => setShowDownloadMenu(v => !v)}
                aria-label="Download App"
              >
                <Icon name="Download" size={20} className="mr-1" />
                <span className="font-body-medium text-sm">Download</span>
                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showDownloadMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-surface-800 border border-border rounded shadow-lg z-50">
                  <a
                    href="/YaegerGoals-0.1.0-x64.dmg"
                    download
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-700 rounded-t"
                  >
                    Mac (DMG)
                  </a>
                  <a
                    href="/YaegerGoals-darwin-x64-0.1.0.zip"
                    download
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-700"
                  >
                    Mac (ZIP)
                  </a>
                  <span className="block px-4 py-2 text-sm text-text-secondary cursor-not-allowed bg-surface-700 rounded-b opacity-60">
                    Windows (coming soon)
                  </span>
                </div>
              )}
            </div>
            {/* App Logo/Title */}
            <Link to="/goals-dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'}}>
                <Icon name="Target" size={20} color="#FFFFFF" />
              </div>
              <span className="text-xl font-heading-bold text-text-primary whitespace-nowrap">JustGoals</span>
            </Link>
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-3 xl:space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-body-medium transition-colors
                    ${isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                    }
                  `}
                  style={item.label === 'Drift AI' ? { whiteSpace: 'nowrap', minWidth: 0 } : {}}
                >
                  <Icon name={item.icon} size={16} />
                  <span className={item.label === 'Drift AI' ? 'whitespace-nowrap' : ''}>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Profile, Achievements, Settings */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Achievement Badge */}
            <div className="relative flex items-center">
              <button
                className="flex items-center px-2 py-1 rounded-full bg-yellow-100 hover:bg-yellow-200 transition"
                onClick={() => navigate('/achievements')}
                title="Achievements"
              >
                <Icon name="Award" className="text-yellow-500 mr-1" />
                <span className="font-bold text-yellow-700 text-sm">{user?.points ?? 0}</span>
              </button>
            </div>
            {/* Profile Icon & Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-200 text-primary-900 font-bold border-2 border-primary-400 hover:shadow-lg transition"
                onClick={() => setProfileMenuOpen((v) => !v)}
                title="Profile"
              >
                {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
              </button>
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 border border-border"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <div className="font-semibold">{user?.displayName ?? user?.email}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                      onClick={() => navigate('/achievements')}
                    >
                      <Icon name="Award" className="inline-block mr-2 text-yellow-500" /> View Achievements
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                      onClick={() => navigate('/settings-configuration')}
                    >
                      <Icon name="Settings" className="inline-block mr-2 text-primary-500" /> Settings
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition border-t border-border"
                      onClick={logout}
                    >
                      <Icon name="LogOut" className="inline-block mr-2 text-red-500" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Settings Tab (icon) */}
            <button
              className="ml-2 p-2 rounded-full hover:bg-gray-100 transition"
              onClick={() => navigate('/settings-configuration')}
              title="Settings"
            >
              <Icon name="Settings" className="text-primary-500" />
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-body-medium transition-colors
                    ${isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                    }
                  `}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-text-secondary">Points:</span>
                <button
                  onClick={() => {
                    navigate('/achievements');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 text-sm font-body-medium text-text-primary hover:text-primary"
                >
                  <Icon name="Trophy" size={16} />
                  <span>{userPoints}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;