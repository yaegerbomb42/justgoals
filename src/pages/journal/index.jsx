import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as entityService from '../../services/entityManagementService'; // Import the service
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import JournalEntry from './components/JournalEntry';
import JournalEditor from './components/JournalEditor';
import AIInsightsPanel from './components/AIInsightsPanel';
import SearchFilter from './components/SearchFilter';
import geminiService from '../../services/geminiService';

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedGoal, setSelectedGoal] = useState('all');
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Load goals using entityService instead of mock data
  const [goals, setGoals] = useState([]);

  // Load goals using the entity service
  useEffect(() => {
    if (isAuthenticated && user) {
      try {
        const userGoals = entityService.getGoals(user);
        setGoals(Array.isArray(userGoals) ? userGoals : []);
      } catch (e) {
        setGoals([]);
        setError('Failed to load goals. Please check your connection or permissions.');
      }
    } else {
      setGoals([]);
    }
  }, [isAuthenticated, user]);

  // Load journal entries using the entity service
  useEffect(() => {
    if (isAuthenticated && user) {
      try {
        const userEntries = entityService.getJournalEntries(user);
        setEntries(Array.isArray(userEntries) ? userEntries : []);
      } catch (e) {
        setEntries([]);
        setError('Failed to load journal entries. Please check your connection or permissions.');
      }
    } else {
      setEntries([]);
    }
  }, [isAuthenticated, user]);

  // Filter entries based on search and filters. This useEffect remains largely the same.
  useEffect(() => {
    let filtered = Array.isArray(entries) ? entries : [];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Mood filter
    if (selectedMood !== 'all') {
      filtered = filtered.filter(entry => entry.mood === selectedMood);
    }

    // Goal filter
    if (selectedGoal !== 'all') {
      filtered = filtered.filter(entry =>
        Array.isArray(entry.goals) && entry.goals.includes(selectedGoal)
      );
    }

    setFilteredEntries(filtered);
  }, [entries, searchQuery, selectedMood, selectedGoal]);

  const handleSaveEntry = (entryData) => { // entryData comes from JournalEditor
    if (user) {
      if (selectedEntry) {
        // Update existing entry
        const updatedEntry = entityService.updateJournalEntry(user, selectedEntry.id, entryData);
        if (updatedEntry) {
          setEntries(prevEntries =>
            prevEntries.map(entry =>
              entry.id === selectedEntry.id ? updatedEntry : entry
            )
          );
        }
      } else {
        // Create new entry
        const createdEntry = entityService.createJournalEntry(user, entryData);
        if (createdEntry) {
          // The service prepends, so we can just fetch all again or prepend locally
          setEntries(prevEntries => [createdEntry, ...prevEntries]);
        }
      }
    }
    setIsEditorOpen(false);
    setSelectedEntry(null);
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setIsEditorOpen(true);
  };

  const handleDeleteEntry = (entryId) => {
    if (user && window.confirm('Are you sure you want to delete this entry?')) {
      const success = entityService.deleteJournalEntry(user, entryId);
      if (success) {
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      }
    }
  };

  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true);
    setIsAIInsightsOpen(true);
    
    try {
      // Get API key using standardized method
      const apiKey = geminiService.getApiKey(user?.id);
      if (!apiKey) {
        throw new Error('Please configure your Gemini API key in Settings');
      }

      // Initialize Gemini service
      geminiService.initialize(apiKey);

      // Get recent entries for analysis
      const recentEntries = entries.slice(0, 10);
      const insights = await geminiService.analyzeJournalEntries(recentEntries);
      
      setAiInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      setAiInsights(`Error generating insights: ${error.message}`);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      'excellent': '🤩',
      'good': '😊',
      'okay': '😐',
      'bad': '😞',
      'terrible': '😢'
    };
    return moodEmojis[mood] || '😐';
  };

  const getStreakDays = () => {
    if (entries.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasEntry = entries.some(entry => 
        entry.date === dateStr
      );
      
      if (hasEntry) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const streakDays = getStreakDays();

  // Defensive: ensure entries, filteredEntries, and goals are always arrays
  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeFilteredEntries = Array.isArray(filteredEntries) ? filteredEntries : [];
  const safeGoals = Array.isArray(goals) ? goals : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-heading-bold text-text-primary mb-2">
                  Daily Journal
                </h1>
                <p className="text-text-secondary">
                  Reflect on your progress, thoughts, and experiences
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Streak Counter */}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg px-4 py-2 border border-primary/30"
                >
                  <Icon name="Flame" size={16} className="text-warning" />
                  <span className="text-sm font-medium text-text-primary">
                    {streakDays} day streak
                  </span>
                </motion.div>
                
                <Button
                  variant="primary"
                  onClick={() => setIsEditorOpen(true)}
                  iconName="Plus"
                  iconPosition="left"
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  New Entry
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface rounded-lg p-4 border border-border"
              >
                <div className="flex items-center space-x-2">
                  <Icon name="BookOpen" size={20} className="text-primary" />
                  <span className="text-sm text-text-secondary">Total Entries</span>
                </div>
                <div className="text-2xl font-heading-semibold text-text-primary mt-1">
                  {safeEntries.length}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface rounded-lg p-4 border border-border"
              >
                <div className="flex items-center space-x-2">
                  <Icon name="Calendar" size={20} className="text-accent" />
                  <span className="text-sm text-text-secondary">This Month</span>
                </div>
                <div className="text-2xl font-heading-semibold text-text-primary mt-1">
                  {safeEntries.filter(entry => {
                    const entryDate = new Date(entry.date);
                    const now = new Date();
                    return entryDate.getMonth() === now.getMonth() && 
                           entryDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-surface rounded-lg p-4 border border-border"
              >
                <div className="flex items-center space-x-2">
                  <Icon name="Smile" size={20} className="text-secondary" />
                  <span className="text-sm text-text-secondary">Avg Mood</span>
                </div>
                <div className="text-2xl font-heading-semibold text-text-primary mt-1">
                  {safeEntries.length > 0 ? getMoodEmoji(safeEntries[0]?.mood || 'okay') : '😐'}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface rounded-lg p-4 border border-border"
              >
                <Button
                  variant="ghost"
                  onClick={handleGenerateInsights}
                  disabled={safeEntries.length === 0 || isLoadingInsights}
                  loading={isLoadingInsights}
                  iconName="Brain"
                  iconPosition="left"
                  className="w-full justify-start"
                >
                  AI Insights
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedMood={selectedMood}
            onMoodChange={setSelectedMood}
            selectedGoal={selectedGoal}
            onGoalChange={setSelectedGoal}
            goals={safeGoals}
          />

          {/* Journal Entries */}
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded text-error text-center mb-4">{error}</div>
          )}
          {safeFilteredEntries.length > 0 ? (
            <AnimatePresence mode="wait">
              {safeFilteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <JournalEntry
                    entry={entry}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                    goals={safeGoals}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <Icon name="BookOpen" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No journal entries found. Start by adding a new entry!</p>
            </div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-surface rounded-lg border border-border p-6"
          >
            <h3 className="font-heading-medium text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/goals-dashboard"
                className="flex flex-col items-center p-4 rounded-lg hover:bg-surface-700 transition-colors"
              >
                <Icon name="Target" size={24} className="text-primary mb-2" />
                <span className="text-sm text-text-secondary">Goals</span>
              </Link>
              
              <Link
                to="/focus-mode"
                className="flex flex-col items-center p-4 rounded-lg hover:bg-surface-700 transition-colors"
              >
                <Icon name="Focus" size={24} className="text-accent mb-2" />
                <span className="text-sm text-text-secondary">Focus Mode</span>
              </Link>
              
              <Link
                to="/ai-assistant-chat-drift"
                className="flex flex-col items-center p-4 rounded-lg hover:bg-surface-700 transition-colors"
              >
                <Icon name="Bot" size={24} className="text-secondary mb-2" />
                <span className="text-sm text-text-secondary">Chat with Drift</span>
              </Link>
              
              <Link
                to="/daily-milestones"
                className="flex flex-col items-center p-4 rounded-lg hover:bg-surface-700 transition-colors"
              >
                <Icon name="CheckSquare" size={24} className="text-warning mb-2" />
                <span className="text-sm text-text-secondary">Milestones</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Journal Editor Modal */}
      <JournalEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSaveEntry}
        entry={selectedEntry}
        goals={safeGoals}
      />

      {/* AI Insights Panel */}
      <AIInsightsPanel
        isOpen={isAIInsightsOpen}
        onClose={() => setIsAIInsightsOpen(false)}
        insights={aiInsights}
        isLoading={isLoadingInsights}
      />
    </div>
  );
};

export default Journal;