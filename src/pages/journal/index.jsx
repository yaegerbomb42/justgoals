import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as entityService from '../../services/entityManagementService'; // Import the service
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import Page from '../../components/ui/Page';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import JournalEntry from './components/JournalEntry';
import JournalEditor from './components/JournalEditor';
import AIInsightsPanel from './components/AIInsightsPanel';
import SearchFilter from './components/SearchFilter';
import { geminiService } from '../../services/geminiService';

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
    const loadGoals = async () => {
      if (isAuthenticated && user) {
        try {
          const userGoals = await entityService.getGoals(user);
          setGoals(Array.isArray(userGoals) ? userGoals : []);
        } catch (e) {
          console.error('Error loading goals:', e);
          setGoals([]);
          setError('Failed to load goals. Please check your connection or permissions.');
        }
      } else {
        setGoals([]);
      }
    };

    loadGoals();
  }, [isAuthenticated, user]);

  // Load journal entries using the entity service
  useEffect(() => {
    const loadEntries = async () => {
      if (isAuthenticated && user) {
        try {
          setError(null);
          const userEntries = await entityService.getJournalEntries(user);
          setEntries(Array.isArray(userEntries) ? userEntries : []);
        } catch (e) {
          console.error('Error loading journal entries:', e);
          setEntries([]);
          setError('Failed to load journal entries. Please check your connection or permissions.');
        }
      } else {
        setEntries([]);
      }
    };

    loadEntries();
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

  const handleSaveEntry = async (entryData) => { // entryData comes from JournalEditor
    if (!user) return;

    try {
      setError(null);
      
      if (selectedEntry) {
        // Update existing entry
        const updatedEntry = await entityService.updateJournalEntry(user, selectedEntry.id, entryData);
        if (updatedEntry) {
          setEntries(prevEntries =>
            prevEntries.map(entry =>
              entry.id === selectedEntry.id ? updatedEntry : entry
            )
          );
        }
      } else {
        // Create new entry
        const createdEntry = await entityService.createJournalEntry(user, entryData);
        if (createdEntry) {
          // The service prepends, so we can just fetch all again or prepend locally
          setEntries(prevEntries => [createdEntry, ...prevEntries]);
        }
      }
      
      // Close editor and clear selection
      setIsEditorOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      setError('Failed to save journal entry. Please try again.');
    }
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setIsEditorOpen(true);
  };

  const handleDeleteEntry = async (entryId) => {
    if (!user) return;
    
    try {
      setError(null);
      const success = await entityService.deleteJournalEntry(user, entryId);
      if (success) {
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      setError('Failed to delete journal entry. Please try again.');
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

  const thisMonthCount = safeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <Page width="lg">
      <PageHeader
        icon="BookOpen"
        title="Daily Journal"
        subtitle="Reflect on your progress, thoughts, and experiences"
        actions={(
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
              <Icon name="Flame" size={16} className="text-warning" />
              <span className="text-sm font-medium text-text-primary">
                {streakDays} day streak
              </span>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsEditorOpen(true)}
              iconName="Plus"
              iconPosition="left"
            >
              New Entry
            </Button>
          </>
        )}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon="BookOpen"
          label="Total Entries"
          value={safeEntries.length}
          tone="primary"
        />
        <StatCard
          icon="Calendar"
          label="This Month"
          value={thisMonthCount}
          tone="accent"
        />
        <StatCard
          icon="Smile"
          label="Avg Mood"
          value={safeEntries.length > 0 ? getMoodEmoji(safeEntries[0]?.mood || 'okay') : '😐'}
          tone="secondary"
        />
        <Card padding="md" className="flex items-center">
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
        </Card>
      </div>

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
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-center mb-4">{error}</div>
      )}
      {safeFilteredEntries.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {safeFilteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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
        </div>
      ) : (
        <EmptyState
          icon="BookOpen"
          title="No journal entries found"
          description="Start by adding a new entry to capture your day."
          action={(
            <Button
              variant="primary"
              onClick={() => setIsEditorOpen(true)}
              iconName="Plus"
              iconPosition="left"
            >
              New Entry
            </Button>
          )}
        />
      )}

      {/* Quick Actions */}
      <Card padding="lg" className="mt-8">
        <h3 className="font-heading-medium text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/goals-dashboard"
            className="flex flex-col items-center p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <Icon name="Target" size={24} className="text-primary mb-2" />
            <span className="text-sm text-text-secondary">Goals</span>
          </Link>

          <Link
            to="/focus-mode"
            className="flex flex-col items-center p-4 rounded-xl border border-border hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <Icon name="Zap" size={24} className="text-accent mb-2" />
            <span className="text-sm text-text-secondary">Focus Mode</span>
          </Link>

          <Link
            to="/ai-assistant-chat-drift"
            className="flex flex-col items-center p-4 rounded-xl border border-border hover:border-secondary/40 hover:bg-secondary/5 transition-all"
          >
            <Icon name="Bot" size={24} className="text-secondary mb-2" />
            <span className="text-sm text-text-secondary">Chat with Drift</span>
          </Link>

          <Link
            to="/progress"
            className="flex flex-col items-center p-4 rounded-xl border border-border hover:border-warning/40 hover:bg-warning/5 transition-all"
          >
            <Icon name="CheckSquare" size={24} className="text-warning mb-2" />
            <span className="text-sm text-text-secondary">Milestones</span>
          </Link>
        </div>
      </Card>

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
    </Page>
  );
};

export default Journal;