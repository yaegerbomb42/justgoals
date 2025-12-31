import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from '../ui/Icon';

const SidebarItem = ({ item, isActive, isCollapsed, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
      isActive
        ? 'bg-primary/10 text-primary shadow-sm'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/50'
    }`}
    title={isCollapsed ? item.label : ''}
  >
    <div className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
      <Icon 
        name={item.icon} 
        className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}`} 
        strokeWidth={isActive ? 2.5 : 2}
      />
    </div>
    
    {!isCollapsed && (
      <span className={`font-medium text-sm truncate transition-opacity duration-200 ${isActive ? 'text-primary' : ''}`}>
        {item.label}
      </span>
    )}

    {isActive && !isCollapsed && (
      <motion.div
        layoutId="activeTab"
        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    )}
  </button>
);

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { settings, isMusicMuted, setMusicMuted } = useSettings();
  const { unreadCount } = useAchievements();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navigationItems = [
    { path: '/goals-dashboard', label: 'Goals', icon: 'Target', category: 'Core' },
    { path: '/day', label: 'Today', icon: 'Calendar', category: 'Core' },
    { path: '/focus-mode', label: 'Focus', icon: 'Zap', category: 'Core' },
    { path: '/ai-assistant-chat-drift', label: 'Drift AI', icon: 'MessageCircle', category: 'AI' },
    { path: '/journal', label: 'Journal', icon: 'BookOpen', category: 'Growth' },
    { path: '/habits', label: 'Habits', icon: 'Repeat', category: 'Growth' },
    { path: '/analytics-dashboard', label: 'Analytics', icon: 'BarChart3', category: 'Insights' },
    { path: '/progress', label: 'Progress', icon: 'TrendingUp', category: 'Insights' },
    { path: '/meals', label: 'Meals', icon: 'UtensilsCrossed', category: 'Lifestyle' },
    { path: '/settings-configuration', label: 'Settings', icon: 'Settings', category: 'System' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary font-sans selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col border-r border-border/50 bg-surface/30 backdrop-blur-xl z-20"
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center space-x-3 w-full">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Icon name="Target" className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary"
              >
                JustGoals
              </motion.span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-surface-600 scrollbar-track-transparent">
          {navigationItems.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              isCollapsed={isCollapsed}
              isActive={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>

        {/* User Profile & Footer */}
        <div className="p-3 border-t border-border/50 bg-surface/20">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 mb-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-700/50 transition-colors"
          >
            <Icon name={isCollapsed ? "ChevronRight" : "ChevronLeft"} className="w-4 h-4" />
          </button>
          
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-xl bg-surface/50 border border-border/50`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-secondary-400 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {(settings?.profile?.displayName || user?.displayName || user?.email || '?')[0].toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{settings?.profile?.displayName || user?.displayName || 'User'}</p>
                <button 
                  onClick={handleLogout}
                  className="text-xs text-text-muted hover:text-error transition-colors flex items-center space-x-1"
                >
                  <Icon name="LogOut" className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border/50 bg-surface/80 backdrop-blur-xl flex items-center justify-between px-4 z-30 sticky top-0">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Icon name="Target" className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">JustGoals</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-text-primary rounded-lg hover:bg-surface-700/50"
          >
            <Icon name={isMobileMenuOpen ? "X" : "Menu"} className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-16 left-0 right-0 bg-surface/95 backdrop-blur-xl border-b border-border/50 z-20 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="p-4 space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-surface-700/50'
                    }`}
                  >
                    <Icon name={item.icon} className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
                <div className="border-t border-border/50 my-2 pt-2">
                   <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-error rounded-xl hover:bg-error/10 transition-colors"
                  >
                    <Icon name="LogOut" className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative">
          {/* Background Gradient Mesh */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl opacity-50" />
             <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl opacity-50" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;