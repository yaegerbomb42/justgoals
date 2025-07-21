// firestoreService.js
import { firestore } from './firebaseClient';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

class FirestoreService {
  constructor() {
    this.db = firestore;
  }

  // Helper function to get user collection reference
  getUserCollection(userId, collectionName) {
    return collection(this.db, 'users', userId, collectionName);
  }

  // Helper function to get user document reference
  getUserDoc(userId, collectionName, docId) {
    return doc(this.db, 'users', userId, collectionName, docId);
  }

  // Goals CRUD operations
  async saveGoal(userId, goalData) {
    if (!userId || !goalData) {
      throw new Error('User ID and goal data are required');
    }

    try {
      const goalId = goalData.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const goalDoc = this.getUserDoc(userId, 'goals', goalId);
      
      const goalToSave = {
        ...goalData,
        id: goalId,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: goalData.createdAt || serverTimestamp()
      };

      await setDoc(goalDoc, goalToSave);
      return { ...goalToSave, id: goalId };
    } catch (error) {
      console.error('Error saving goal to Firestore:', error);
      throw error;
    }
  }

  async getGoals(userId) {
    try {
      const goalsRef = collection(this.db, `users/${userId}/goals`);
      const querySnapshot = await getDocs(goalsRef);
      return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.error('Firestore permission denied for getGoals:', error);
        return [];
      }
      console.error('Error getting goals:', error);
      return [];
    }
  }

  async updateGoal(userId, goalId, updates) {
    if (!userId || !goalId) {
      throw new Error('User ID and goal ID are required');
    }

    try {
      const goalDoc = this.getUserDoc(userId, 'goals', goalId);
      await updateDoc(goalDoc, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Return updated goal
      const updatedDoc = await getDoc(goalDoc);
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      console.error('Error updating goal in Firestore:', error);
      throw error;
    }
  }

  async deleteGoal(userId, goalId) {
    if (!userId || !goalId) {
      throw new Error('User ID and goal ID are required');
    }

    try {
      const goalDoc = this.getUserDoc(userId, 'goals', goalId);
      await deleteDoc(goalDoc);
      return true;
    } catch (error) {
      console.error('Error deleting goal from Firestore:', error);
      throw error;
    }
  }

  // Milestones CRUD operations
  async saveMilestone(userId, milestoneData) {
    if (!userId || !milestoneData) {
      throw new Error('User ID and milestone data are required');
    }

    try {
      const milestoneId = milestoneData.id || `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const milestoneDoc = this.getUserDoc(userId, 'milestones', milestoneId);
      
      const milestoneToSave = {
        ...milestoneData,
        id: milestoneId,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: milestoneData.createdAt || serverTimestamp()
      };

      await setDoc(milestoneDoc, milestoneToSave);
      return { ...milestoneToSave, id: milestoneId };
    } catch (error) {
      console.error('Error saving milestone to Firestore:', error);
      throw error;
    }
  }

  async getMilestones(userId) {
    try {
      const milestonesRef = collection(this.db, `users/${userId}/milestones`);
      const querySnapshot = await getDocs(milestonesRef);
      return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.error('Firestore permission denied for getMilestones:', error);
        return [];
      }
      console.error('Error getting milestones:', error);
      return [];
    }
  }

  async updateMilestone(userId, milestoneId, updates) {
    if (!userId || !milestoneId) {
      throw new Error('User ID and milestone ID are required');
    }

    try {
      const milestoneDoc = this.getUserDoc(userId, 'milestones', milestoneId);
      await updateDoc(milestoneDoc, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      const updatedDoc = await getDoc(milestoneDoc);
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      console.error('Error updating milestone in Firestore:', error);
      throw error;
    }
  }

  async deleteMilestone(userId, milestoneId) {
    if (!userId || !milestoneId) {
      throw new Error('User ID and milestone ID are required');
    }

    try {
      const milestoneDoc = this.getUserDoc(userId, 'milestones', milestoneId);
      await deleteDoc(milestoneDoc);
      return true;
    } catch (error) {
      console.error('Error deleting milestone from Firestore:', error);
      throw error;
    }
  }

  // Journal entries CRUD operations
  async saveJournalEntry(userId, entryData) {
    if (!userId || !entryData) {
      throw new Error('User ID and entry data are required');
    }

    try {
      const entryId = entryData.id || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const entryDoc = this.getUserDoc(userId, 'journalEntries', entryId);
      
      const entryToSave = {
        ...entryData,
        id: entryId,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: entryData.createdAt || serverTimestamp()
      };

      await setDoc(entryDoc, entryToSave);
      return { ...entryToSave, id: entryId };
    } catch (error) {
      console.error('Error saving journal entry to Firestore:', error);
      throw error;
    }
  }

  async getJournalEntries(userId) {
    try {
      const journalRef = collection(this.db, `users/${userId}/journalEntries`);
      const querySnapshot = await getDocs(journalRef);
      return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.error('Firestore permission denied for getJournalEntries:', error);
        return [];
      }
      console.error('Error getting journal entries:', error);
      return [];
    }
  }

  async updateJournalEntry(userId, entryId, updates) {
    if (!userId || !entryId) {
      throw new Error('User ID and entry ID are required');
    }

    try {
      const entryDoc = this.getUserDoc(userId, 'journalEntries', entryId);
      await updateDoc(entryDoc, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      const updatedDoc = await getDoc(entryDoc);
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      console.error('Error updating journal entry in Firestore:', error);
      throw error;
    }
  }

  async deleteJournalEntry(userId, entryId) {
    if (!userId || !entryId) {
      throw new Error('User ID and entry ID are required');
    }

    try {
      const entryDoc = this.getUserDoc(userId, 'journalEntries', entryId);
      await deleteDoc(entryDoc);
      return true;
    } catch (error) {
      console.error('Error deleting journal entry from Firestore:', error);
      throw error;
    }
  }

  // Focus session stats and history
  async saveFocusSessionStats(userId, stats) {
    if (!userId || !stats) {
      throw new Error('User ID and stats are required');
    }

    try {
      const statsDoc = this.getUserDoc(userId, 'focusSessionStats', 'current');
      await setDoc(statsDoc, {
        ...stats,
        userId,
        updatedAt: serverTimestamp()
      });
      return stats;
    } catch (error) {
      console.error('Error saving focus session stats to Firestore:', error);
      throw error;
    }
  }

  async getFocusSessionStats(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const statsDoc = this.getUserDoc(userId, 'focusSessionStats', 'current');
      const docSnapshot = await getDoc(statsDoc);
      
      if (docSnapshot.exists()) {
        return docSnapshot.data();
      }
      return {};
    } catch (error) {
      console.error('Error getting focus session stats from Firestore:', error);
      throw error;
    }
  }

  async saveFocusSessionHistory(userId, sessionData) {
    if (!userId || !sessionData) {
      throw new Error('User ID and session data are required');
    }

    try {
      const sessionId = sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionDoc = this.getUserDoc(userId, 'focusSessionHistory', sessionId);
      
      const sessionToSave = {
        ...sessionData,
        id: sessionId,
        userId,
        createdAt: sessionData.createdAt || serverTimestamp()
      };

      await setDoc(sessionDoc, sessionToSave);
      return { ...sessionToSave, id: sessionId };
    } catch (error) {
      console.error('Error saving focus session to Firestore:', error);
      throw error;
    }
  }

  async getFocusSessionHistory(userId) {
    const focusRef = collection(this.db, `users/${userId}/focusSessionHistory`);
    const querySnapshot = await getDocs(focusRef);
    return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // App settings
  async saveAppSettings(userId, settings) {
    if (!userId || !settings) {
      throw new Error('User ID and settings are required');
    }

    try {
      const settingsDoc = this.getUserDoc(userId, 'appSettings', 'current');
      await setDoc(settingsDoc, {
        ...settings,
        userId,
        updatedAt: serverTimestamp()
      });
      return settings;
    } catch (error) {
      console.error('Error saving app settings to Firestore:', error);
      throw error;
    }
  }

  async getAppSettings(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const settingsDoc = this.getUserDoc(userId, 'appSettings', 'current');
      const docSnapshot = await getDoc(settingsDoc);
      
      if (docSnapshot.exists()) {
        return docSnapshot.data();
      }
      return {};
    } catch (error) {
      console.error('Error getting app settings from Firestore:', error);
      throw error;
    }
  }

  // Save Gemini API key to Firestore
  async saveApiKey(userId, apiKey) {
    if (!userId) throw new Error('User ID required');
    const settingsDoc = this.getUserDoc(userId, 'appSettings', 'current');
    await setDoc(settingsDoc, { apiKey }, { merge: true });
  }

  // Load Gemini API key from Firestore
  async loadApiKey(userId) {
    if (!userId) return '';
    const settingsDoc = this.getUserDoc(userId, 'appSettings', 'current');
    const docSnap = await getDoc(settingsDoc);
    if (docSnap.exists() && docSnap.data().apiKey) {
      return docSnap.data().apiKey;
    }
    return '';
  }

  // Save chat messages for a goal
  async saveGoalChatMessages(userId, goalId, messages) {
    if (!userId || !goalId) return;
    try {
      const chatDoc = this.getUserDoc(userId, 'goalChats', goalId);
      await setDoc(chatDoc, { messages, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error('Error saving goal chat messages to Firestore:', error);
    }
  }

  // Load chat messages for a goal
  async getGoalChatMessages(userId, goalId) {
    if (!userId || !goalId) return [];
    try {
      const chatDoc = this.getUserDoc(userId, 'goalChats', goalId);
      const docSnap = await getDoc(chatDoc);
      if (docSnap.exists() && Array.isArray(docSnap.data().messages)) {
        return docSnap.data().messages;
      }
      return [];
    } catch (error) {
      console.error('Error loading goal chat messages from Firestore:', error);
      return [];
    }
  }

  // Save total time logged (in seconds) to Firestore appSettings
  async saveTotalTimeLogged(userId, totalTime) {
    if (!userId) throw new Error('User ID required');
    const settingsDoc = this.getUserDoc(userId, 'appSettings', 'current');
    await setDoc(settingsDoc, { totalTimeLoggedSeconds: totalTime }, { merge: true });
  }

  // Get total time logged (in seconds) from Firestore appSettings
  async getTotalTimeLogged(userId) {
    if (!userId) throw new Error('User ID required');
    const settingsDoc = this.getUserDoc(userId, 'appSettings', 'current');
    const docSnap = await getDoc(settingsDoc);
    if (docSnap.exists() && typeof docSnap.data().totalTimeLoggedSeconds === 'number') {
      return docSnap.data().totalTimeLoggedSeconds;
    }
    return 0;
  }

  // Migration helper: migrate from localStorage to Firestore
  async migrateFromLocalStorage(userId) {
    if (!userId) {
      throw new Error('User ID is required for migration');
    }

    try {
      console.log(`Starting migration for user ${userId}...`);

      // Migrate goals
      const goalsKey = `goals_data_${userId}`;
      const goalsData = localStorage.getItem(goalsKey);
      if (goalsData) {
        const goals = JSON.parse(goalsData);
        for (const goal of goals) {
          await this.saveGoal(userId, goal);
        }
        console.log(`Migrated ${goals.length} goals`);
      }

      // Migrate milestones
      const milestonesKey = `milestones_data_${userId}`;
      const milestonesData = localStorage.getItem(milestonesKey);
      if (milestonesData) {
        const milestones = JSON.parse(milestonesData);
        for (const milestone of milestones) {
          await this.saveMilestone(userId, milestone);
        }
        console.log(`Migrated ${milestones.length} milestones`);
      }

      // Migrate journal entries
      const journalKey = `journal_entries_${userId}`;
      const journalData = localStorage.getItem(journalKey);
      if (journalData) {
        const entries = JSON.parse(journalData);
        for (const entry of entries) {
          await this.saveJournalEntry(userId, entry);
        }
        console.log(`Migrated ${entries.length} journal entries`);
      }

      // Migrate focus session stats
      const focusStatsKey = `focus_session_stats_${userId}`;
      const focusStatsData = localStorage.getItem(focusStatsKey);
      if (focusStatsData) {
        const stats = JSON.parse(focusStatsData);
        await this.saveFocusSessionStats(userId, stats);
        console.log('Migrated focus session stats');
      }

      // Migrate focus session history
      const focusHistoryKey = `focus_session_history_${userId}`;
      const focusHistoryData = localStorage.getItem(focusHistoryKey);
      if (focusHistoryData) {
        const history = JSON.parse(focusHistoryData);
        for (const session of history) {
          await this.saveFocusSessionHistory(userId, session);
        }
        console.log(`Migrated ${history.length} focus sessions`);
      }

      // Migrate app settings
      const appSettingsKey = `app_settings_${userId}`;
      const appSettingsData = localStorage.getItem(appSettingsKey);
      if (appSettingsData) {
        const settings = JSON.parse(appSettingsData);
        await this.saveAppSettings(userId, settings);
        console.log('Migrated app settings');
      }

      console.log(`Migration completed for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Migration failed for user ${userId}:`, error);
      throw error;
    }
  }

  // Sync helper: sync from Firestore to localStorage (for offline fallback)
  async syncToLocalStorage(userId) {
    if (!userId) {
      throw new Error('User ID is required for sync');
    }

    try {
      console.log(`Starting sync to localStorage for user ${userId}...`);

      // Sync goals
      const goals = await this.getGoals(userId);
      localStorage.setItem(`goals_data_${userId}`, JSON.stringify(goals));

      // Sync milestones
      const milestones = await this.getMilestones(userId);
      localStorage.setItem(`milestones_data_${userId}`, JSON.stringify(milestones));

      // Sync journal entries
      const entries = await this.getJournalEntries(userId);
      localStorage.setItem(`journal_entries_${userId}`, JSON.stringify(entries));

      // Sync focus session stats
      const focusStats = await this.getFocusSessionStats(userId);
      localStorage.setItem(`focus_session_stats_${userId}`, JSON.stringify(focusStats));

      // Sync focus session history
      const focusHistory = await this.getFocusSessionHistory(userId);
      localStorage.setItem(`focus_session_history_${userId}`, JSON.stringify(focusHistory));

      // Sync app settings
      const appSettings = await this.getAppSettings(userId);
      localStorage.setItem(`app_settings_${userId}`, JSON.stringify(appSettings));

      console.log(`Sync to localStorage completed for user ${userId}`);
      return true;
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.error('Firestore permission denied during syncToLocalStorage:', error);
        return false;
      }
      console.error(`Sync to localStorage failed for user ${userId}:`, error);
      return false;
    }
  }

  // Merge and sync user data between Firestore and localStorage
  async robustSyncUserData(userId) {
    if (!userId) throw new Error('User ID is required for sync');
    try {
      // 1. Load all data from Firestore
      const [goals, milestones, focusStats, focusHistory, journalEntries, appSettings] = await Promise.all([
        this.getGoals(userId),
        this.getMilestones(userId),
        this.getFocusSessionStats(userId),
        this.getFocusSessionHistory(userId),
        this.getJournalEntries(userId),
        this.getAppSettings(userId)
      ]);
      // 2. Load all data from localStorage
      const localGoals = JSON.parse(localStorage.getItem(`goals_data_${userId}`) || '[]');
      const localMilestones = JSON.parse(localStorage.getItem(`milestones_data_${userId}`) || '[]');
      const localFocusStats = JSON.parse(localStorage.getItem(`focus_session_stats_${userId}`) || '{}');
      const localFocusHistory = JSON.parse(localStorage.getItem(`focus_session_history_${userId}`) || '[]');
      const localJournalEntries = JSON.parse(localStorage.getItem(`journal_entries_${userId}`) || '[]');
      const localAppSettings = JSON.parse(localStorage.getItem(`app_settings_${userId}`) || '{}');
      // 3. Merge logic (favor most recent or highest value)
      const mergedGoals = goals.length >= localGoals.length ? goals : localGoals;
      const mergedMilestones = milestones.length >= localMilestones.length ? milestones : localMilestones;
      const mergedFocusStats = (focusStats.updatedAt && (!localFocusStats.updatedAt || focusStats.updatedAt > localFocusStats.updatedAt)) ? focusStats : localFocusStats;
      const mergedFocusHistory = focusHistory.length >= localFocusHistory.length ? focusHistory : localFocusHistory;
      const mergedJournalEntries = journalEntries.length >= localJournalEntries.length ? journalEntries : localJournalEntries;
      const mergedAppSettings = (appSettings.updatedAt && (!localAppSettings.updatedAt || appSettings.updatedAt > localAppSettings.updatedAt)) ? appSettings : localAppSettings;
      // 4. Save merged data to Firestore (if local is newer or has more data)
      // (Implement save methods for each type as needed)
      // 5. Update localStorage with merged data
      localStorage.setItem(`goals_data_${userId}`, JSON.stringify(mergedGoals));
      localStorage.setItem(`milestones_data_${userId}`, JSON.stringify(mergedMilestones));
      localStorage.setItem(`focus_session_stats_${userId}`, JSON.stringify(mergedFocusStats));
      localStorage.setItem(`focus_session_history_${userId}`, JSON.stringify(mergedFocusHistory));
      localStorage.setItem(`journal_entries_${userId}`, JSON.stringify(mergedJournalEntries));
      localStorage.setItem(`app_settings_${userId}`, JSON.stringify(mergedAppSettings));
      return true;
    } catch (error) {
      console.error('Robust user data sync failed:', error);
      return false;
    }
  }

  // Achievement methods
  async getAchievements(userId) {
    if (!userId) return [];
    
    try {
      const docRef = doc(this.db, 'users', userId, 'achievements', 'user_achievements');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().achievements || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  async saveAchievement(userId, achievement) {
    if (!userId || !achievement) return false;
    
    try {
      const docRef = doc(this.db, 'users', userId, 'achievements', 'user_achievements');
      const docSnap = await getDoc(docRef);
      
      let achievements = [];
      if (docSnap.exists()) {
        achievements = docSnap.data().achievements || [];
      }
      
      // Update or add achievement
      const existingIndex = achievements.findIndex(a => a.id === achievement.id);
      if (existingIndex >= 0) {
        achievements[existingIndex] = achievement;
      } else {
        achievements.push(achievement);
      }
      
      await setDoc(docRef, { achievements, updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error('Error saving achievement:', error);
      return false;
    }
  }

  // Notification settings methods
  async getNotificationSettings(userId) {
    if (!userId) return null;
    
    try {
      const docRef = doc(this.db, 'users', userId, 'settings', 'notifications');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  async saveNotificationSettings(userId, settings) {
    if (!userId || !settings) return false;
    
    try {
      const docRef = doc(this.db, 'users', userId, 'settings', 'notifications');
      await setDoc(docRef, { ...settings, updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      return false;
    }
  }

  // Calendar sync settings methods
  async getCalendarSyncSettings(userId) {
    if (!userId) return null;
    
    try {
      const docRef = doc(this.db, 'users', userId, 'settings', 'calendar_sync');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting calendar sync settings:', error);
      return null;
    }
  }

  async saveCalendarSyncSettings(userId, settings) {
    if (!userId || !settings) return false;
    
    try {
      const docRef = doc(this.db, 'users', userId, 'settings', 'calendar_sync');
      await setDoc(docRef, { ...settings, updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error('Error saving calendar sync settings:', error);
      return false;
    }
  }

  // Gamification data methods
  async getGamificationData(userId) {
    if (!userId) return null;
    
    try {
      const docRef = doc(this.db, 'users', userId, 'gamification', 'user_data');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting gamification data:', error);
      return null;
    }
  }

  async saveGamificationData(userId, data) {
    if (!userId || !data) return false;
    
    try {
      const docRef = doc(this.db, 'users', userId, 'gamification', 'user_data');
      await setDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error('Error saving gamification data:', error);
      return false;
    }
  }

  // Add a method to initialize empty user data structure
  async initializeUserData(userId) {
    const userDocRef = doc(this.db, `users/${userId}`);
    await setDoc(userDocRef, { createdAt: new Date(), userId }, { merge: true });
    // Create empty subcollections by adding a dummy doc and deleting it (Firestore does not allow empty subcollections)
    const emptyCollections = ['goals', 'milestones', 'journalEntries', 'focusSessionHistory'];
    for (const col of emptyCollections) {
      const dummyDocRef = doc(this.db, `users/${userId}/${col}/__init__`);
      await setDoc(dummyDocRef, { _init: true });
      await deleteDoc(dummyDocRef);
    }
  }

  // Save Drift memory (profile, chats, etc.)
  async saveDriftMemory(userId, memory) {
    if (!userId || !memory) return;
    try {
      const driftDoc = this.getUserDoc(userId, 'drift', 'memory');
      await setDoc(driftDoc, { ...memory, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error('Error saving Drift memory to Firestore:', error);
    }
  }

  // Load Drift memory
  async getDriftMemory(userId) {
    if (!userId) return null;
    try {
      const driftDoc = this.getUserDoc(userId, 'drift', 'memory');
      const docSnap = await getDoc(driftDoc);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error loading Drift memory from Firestore:', error);
      return null;
    }
  }

  // Meals CRUD operations
  async saveMeal(userId, mealData) {
    if (!userId || !mealData) {
      throw new Error('User ID and meal data are required');
    }

    try {
      const mealId = mealData.id || `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mealDoc = this.getUserDoc(userId, 'meals', mealId);
      
      const mealToSave = {
        ...mealData,
        id: mealId,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: mealData.createdAt || serverTimestamp()
      };

      await setDoc(mealDoc, mealToSave);
      return { ...mealToSave, id: mealId };
    } catch (error) {
      console.error('Error saving meal to Firestore:', error);
      throw error;
    }
  }

  async getMeals(userId) {
    try {
      const mealsRef = collection(this.db, `users/${userId}/meals`);
      const querySnapshot = await getDocs(mealsRef);
      return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting meals from Firestore:', error);
      return [];
    }
  }

  async deleteMeal(userId, mealId) {
    if (!userId || !mealId) {
      throw new Error('User ID and meal ID are required');
    }

    try {
      const mealDoc = this.getUserDoc(userId, 'meals', mealId);
      await deleteDoc(mealDoc);
    } catch (error) {
      console.error('Error deleting meal from Firestore:', error);
      throw error;
    }
  }

  // Meal Plans CRUD operations
  async saveMealPlan(userId, mealPlanData) {
    if (!userId || !mealPlanData) {
      throw new Error('User ID and meal plan data are required');
    }

    try {
      const planId = mealPlanData.id || `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const planDoc = this.getUserDoc(userId, 'mealPlans', planId);
      
      const planToSave = {
        ...mealPlanData,
        id: planId,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: mealPlanData.createdAt || serverTimestamp()
      };

      await setDoc(planDoc, planToSave);
      return { ...planToSave, id: planId };
    } catch (error) {
      console.error('Error saving meal plan to Firestore:', error);
      throw error;
    }
  }

  async getMealPlans(userId) {
    try {
      const plansRef = collection(this.db, `users/${userId}/mealPlans`);
      const querySnapshot = await getDocs(query(plansRef, orderBy('startDate', 'desc')));
      return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting meal plans from Firestore:', error);
      return [];
    }
  }

  // Meal Preferences
  async saveMealPreferences(userId, preferencesData) {
    if (!userId || !preferencesData) {
      throw new Error('User ID and preferences data are required');
    }

    try {
      const prefsDoc = this.getUserDoc(userId, 'mealPreferences', 'current');
      await setDoc(prefsDoc, {
        ...preferencesData,
        userId,
        updatedAt: serverTimestamp()
      });
      return preferencesData;
    } catch (error) {
      console.error('Error saving meal preferences to Firestore:', error);
      throw error;
    }
  }

  async getMealPreferences(userId) {
    try {
      const prefsDoc = this.getUserDoc(userId, 'mealPreferences', 'current');
      const docSnapshot = await getDoc(prefsDoc);
      
      if (docSnapshot.exists()) {
        return docSnapshot.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting meal preferences from Firestore:', error);
      return null;
    }
  }

  // Meal Completion Tracking
  async markMealCompleted(userId, mealId, date, completed = true) {
    if (!userId || !mealId || !date) {
      throw new Error('User ID, meal ID, and date are required');
    }

    try {
      const completionId = `${mealId}_${date}`;
      const completionDoc = this.getUserDoc(userId, 'mealCompletions', completionId);
      
      const completionData = {
        mealId,
        date,
        completed,
        completedAt: completed ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      };

      await setDoc(completionDoc, completionData);
      return completionData;
    } catch (error) {
      console.error('Error marking meal completion in Firestore:', error);
      throw error;
    }
  }

  async getMealCompletions(userId, startDate, endDate) {
    try {
      const completionsRef = collection(this.db, `users/${userId}/mealCompletions`);
      let queryRef = completionsRef;
      
      if (startDate && endDate) {
        queryRef = query(
          completionsRef,
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );
      }
      
      const querySnapshot = await getDocs(queryRef);
      return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting meal completions from Firestore:', error);
      return [];
    }
  }

  // Temporary Todos CRUD operations
  async saveTempTodo(userId, todoData) {
    if (!userId || !todoData) {
      throw new Error('User ID and todo data are required');
    }

    try {
      const todoId = todoData.id || `temp_todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const todoDoc = this.getUserDoc(userId, 'tempTodos', todoId);
      
      const todoToSave = {
        ...todoData,
        id: todoId,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: todoData.createdAt || serverTimestamp()
      };

      await setDoc(todoDoc, todoToSave);
      return { ...todoToSave, id: todoId };
    } catch (error) {
      console.error('Error saving temp todo to Firestore:', error);
      throw error;
    }
  }

  async getTempTodos(userId) {
    try {
      const todosRef = collection(this.db, `users/${userId}/tempTodos`);
      const q = query(todosRef, where('archived', '!=', true), orderBy('priority', 'desc'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting temp todos from Firestore:', error);
      return [];
    }
  }

  async getArchivedTempTodos(userId) {
    try {
      const todosRef = collection(this.db, `users/${userId}/tempTodos`);
      const q = query(todosRef, where('archived', '==', true), orderBy('completedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting archived temp todos from Firestore:', error);
      return [];
    }
  }

  async updateTempTodo(userId, todoId, updates) {
    try {
      const todoDoc = this.getUserDoc(userId, 'tempTodos', todoId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      await updateDoc(todoDoc, updateData);
      return { id: todoId, ...updates };
    } catch (error) {
      console.error('Error updating temp todo in Firestore:', error);
      throw error;
    }
  }

  async completeTempTodo(userId, todoId) {
    try {
      const updates = {
        completed: true,
        archived: true,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      return await this.updateTempTodo(userId, todoId, updates);
    } catch (error) {
      console.error('Error completing temp todo in Firestore:', error);
      throw error;
    }
  }

  async deleteTempTodo(userId, todoId) {
    try {
      const todoDoc = this.getUserDoc(userId, 'tempTodos', todoId);
      await deleteDoc(todoDoc);
      return todoId;
    } catch (error) {
      console.error('Error deleting temp todo from Firestore:', error);
      throw error;
    }
  }

  async batchUpdateTempTodosPriority(userId, todosWithPriority) {
    try {
      const promises = todosWithPriority.map(({ id, priority }) => 
        this.updateTempTodo(userId, id, { priority, aiPrioritized: true })
      );
      await Promise.all(promises);
      return todosWithPriority;
    } catch (error) {
      console.error('Error batch updating temp todos priority in Firestore:', error);
      throw error;
    }
  }
}

// Create singleton instance
const firestoreService = new FirestoreService();

export default firestoreService; 