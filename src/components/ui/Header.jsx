import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from '../AppIcon';
import Button from './Button';
import AchievementBadge from './AchievementBadge';

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

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target) &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowDownloadMenu(false);
        setIsMenuOpen(false);
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Download Dropdown */}
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
          </div>

          {/* Sync Status */}
          {/* Remove sync status display from header */}

          {/* Desktop Navigation */}
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

          {/* Right Side */}
          {/* Achievement Points and User Profile */}
          <div className="flex items-center space-x-3">
            {/* Achievement Points - Always visible and clickable */}
            <button
              onClick={() => navigate('/achievements')}
              className="flex items-center space-x-2 px-3 py-2 bg-surface-700 rounded-lg hover:bg-surface-600 transition-colors cursor-pointer flex-shrink-0"
            >
              <Icon name="Trophy" size={16} className="text-primary" />
              <span className="text-sm font-body-medium text-text-primary">{userPoints}</span>
            </button>
            {/* User Profile Icon and Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setIsMenuOpen(v => {
                    if (!v) setShowDownloadMenu(false);
                    return !v;
                  });
                }}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-surface-700 transition-colors border border-border"
                aria-label="User Profile"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-body-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <Icon name="ChevronDown" size={16} className="text-text-secondary" />
              </button>
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-body-medium text-text-primary truncate max-w-[140px] md:max-w-[200px] lg:max-w-[300px]" title={user?.name}>{user?.name}</p>
                    <p className="text-xs text-text-secondary">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/achievements');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors"
                  >
                    <Icon name="Trophy" size={16} />
                    <span>View Achievements</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings-configuration');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors"
                  >
                    <Icon name="Settings" size={16} />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors"
                  >
                    <Icon name="LogOut" size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
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