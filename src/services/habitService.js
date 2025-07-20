import { firestore } from './firebaseClient';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore';

// Default habit categories
export const defaultDailyHabits = [
  { id: 'brush-teeth', name: 'Brush Teeth', emoji: '🦷', completed: false, isDefault: true },
  { id: 'shower', name: 'Shower', emoji: '🚿', completed: false, isDefault: true },
  { id: 'breakfast', name: 'Eat Breakfast', emoji: '🥞', completed: false, isDefault: true },
  { id: 'lunch', name: 'Eat Lunch', emoji: '🥗', completed: false, isDefault: true },
  { id: 'dinner', name: 'Eat Dinner', emoji: '🍽️', completed: false, isDefault: true },
];

export const defaultWeeklyHabits = [
  { id: 'laundry', name: 'Do Laundry', emoji: '👕', completed: false, dayOfWeek: null, isDefault: true },
  { id: 'volleyball', name: 'Volleyball on Thursday', emoji: '🏐', completed: false, dayOfWeek: 4, isDefault: true },
];

// Helper functions for date management
const getToday = () => new Date().toISOString().split('T')[0];
const getCurrentWeek = () => {
  const today = new Date();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  return startOfWeek.toISOString().split('T')[0];
};

export { getToday, getCurrentWeek };

class HabitService {
  constructor() {
    this.db = firestore;
    this.localStorageKey = 'habits_offline_data';
  }

  // Get user habits collection reference
  getUserHabitsCollection(userId) {
    return collection(this.db, 'users', userId, 'habits');
  }

  // Get user habits data document reference
  getUserHabitsDoc(userId) {
    return doc(this.db, 'users', userId, 'habitData', 'current');
  }

  // Generate unique habit ID
  generateHabitId(name) {
    return `habit_${Date.now()}_${name.toLowerCase().replace(/\s+/g, '-')}_${Math.random().toString(36).substr(2, 5)}`;
  }

  // Load habit data from Firebase or localStorage fallback
  async loadHabitsData(userId) {
    try {
      if (!userId) {
        // Use localStorage for demo/offline mode
        return this.loadFromLocalStorage();
      }

      const habitsDoc = this.getUserHabitsDoc(userId);
      const docSnap = await getDoc(habitsDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          dailyHabits: data.dailyHabits || defaultDailyHabits,
          weeklyHabits: data.weeklyHabits || defaultWeeklyHabits,
          customDailyHabits: data.customDailyHabits || [],
          customWeeklyHabits: data.customWeeklyHabits || [],
          dailyChain: data.dailyChain || 0,
          weeklyChain: data.weeklyChain || 0,
          dailyCompletions: data.dailyCompletions || {},
          weeklyCompletions: data.weeklyCompletions || {},
          lastDailyReset: data.lastDailyReset || getToday(),
          lastWeeklyReset: data.lastWeeklyReset || getCurrentWeek(),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      } else {
        // Initialize with default data
        const initialData = {
          dailyHabits: defaultDailyHabits,
          weeklyHabits: defaultWeeklyHabits,
          customDailyHabits: [],
          customWeeklyHabits: [],
          dailyChain: 0,
          weeklyChain: 0,
          dailyCompletions: {},
          weeklyCompletions: {},
          lastDailyReset: getToday(),
          lastWeeklyReset: getCurrentWeek(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await this.saveHabitsData(userId, initialData);
        return initialData;
      }
    } catch (error) {
      console.error('Error loading habits data from Firebase:', error);
      // Fallback to localStorage
      return this.loadFromLocalStorage();
    }
  }

  // Save habit data to Firebase or localStorage fallback
  async saveHabitsData(userId, data) {
    try {
      if (!userId) {
        // Save to localStorage for demo/offline mode
        this.saveToLocalStorage(data);
        return;
      }

      const habitsDoc = this.getUserHabitsDoc(userId);
      const dataToSave = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(habitsDoc, dataToSave, { merge: true });
      
      // Also save to localStorage as backup
      this.saveToLocalStorage(data);
    } catch (error) {
      console.error('Error saving habits data to Firebase:', error);
      // Fallback to localStorage
      this.saveToLocalStorage(data);
      throw error;
    }
  }

  // Add a new custom habit
  async addCustomHabit(userId, habitData, isWeekly = false) {
    try {
      const currentData = await this.loadHabitsData(userId);
      const newHabit = {
        id: this.generateHabitId(habitData.name),
        name: habitData.name,
        emoji: habitData.emoji,
        completed: false,
        isDefault: false,
        createdAt: new Date().toISOString(),
        ...(isWeekly && habitData.dayOfWeek !== undefined && { dayOfWeek: habitData.dayOfWeek })
      };

      const updatedData = {
        ...currentData,
        [isWeekly ? 'customWeeklyHabits' : 'customDailyHabits']: [
          ...(currentData[isWeekly ? 'customWeeklyHabits' : 'customDailyHabits'] || []),
          newHabit
        ]
      };

      await this.saveHabitsData(userId, updatedData);
      return newHabit;
    } catch (error) {
      console.error('Error adding custom habit:', error);
      throw error;
    }
  }

  // Remove a custom habit
  async removeCustomHabit(userId, habitId, isWeekly = false) {
    try {
      const currentData = await this.loadHabitsData(userId);
      const habitKey = isWeekly ? 'customWeeklyHabits' : 'customDailyHabits';
      
      const updatedData = {
        ...currentData,
        [habitKey]: currentData[habitKey].filter(habit => habit.id !== habitId)
      };

      await this.saveHabitsData(userId, updatedData);
      return true;
    } catch (error) {
      console.error('Error removing custom habit:', error);
      throw error;
    }
  }

  // Update habit completion status
  async toggleHabitCompletion(userId, habitId, isWeekly = false, isCustom = false) {
    try {
      const currentData = await this.loadHabitsData(userId);
      let updatedData = { ...currentData };

      // Determine which array to update
      let habitArray;
      let habitKey;
      
      if (isCustom) {
        habitKey = isWeekly ? 'customWeeklyHabits' : 'customDailyHabits';
        habitArray = [...(currentData[habitKey] || [])];
      } else {
        habitKey = isWeekly ? 'weeklyHabits' : 'dailyHabits';
        habitArray = [...currentData[habitKey]];
      }

      // Toggle the habit
      const habitIndex = habitArray.findIndex(habit => habit.id === habitId);
      if (habitIndex !== -1) {
        habitArray[habitIndex] = {
          ...habitArray[habitIndex],
          completed: !habitArray[habitIndex].completed
        };
        updatedData[habitKey] = habitArray;
      }

      // Check for chain updates
      updatedData = this.updateChainsOnCompletion(updatedData, isWeekly);

      await this.saveHabitsData(userId, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      throw error;
    }
  }

  // Update chains based on completion status
  updateChainsOnCompletion(data, isWeekly = false) {
    const updatedData = { ...data };
    
    if (isWeekly) {
      // Check if all weekly habits (default + custom) are completed
      const allWeeklyHabits = [...data.weeklyHabits, ...(data.customWeeklyHabits || [])];
      const allWeeklyCompleted = allWeeklyHabits.every(habit => habit.completed);
      const currentWeek = getCurrentWeek();
      
      if (allWeeklyCompleted && !data.weeklyCompletions[currentWeek]) {
        updatedData.weeklyChain = data.weeklyChain + 1;
        updatedData.weeklyCompletions = {
          ...data.weeklyCompletions,
          [currentWeek]: true
        };
      } else if (!allWeeklyCompleted && data.weeklyCompletions[currentWeek]) {
        updatedData.weeklyChain = Math.max(0, data.weeklyChain - 1);
        const { [currentWeek]: removed, ...remainingCompletions } = data.weeklyCompletions;
        updatedData.weeklyCompletions = remainingCompletions;
      }
    } else {
      // Check if all daily habits (default + custom) are completed
      const allDailyHabits = [...data.dailyHabits, ...(data.customDailyHabits || [])];
      const allDailyCompleted = allDailyHabits.every(habit => habit.completed);
      const today = getToday();
      
      if (allDailyCompleted && !data.dailyCompletions[today]) {
        updatedData.dailyChain = data.dailyChain + 1;
        updatedData.dailyCompletions = {
          ...data.dailyCompletions,
          [today]: true
        };
      } else if (!allDailyCompleted && data.dailyCompletions[today]) {
        updatedData.dailyChain = Math.max(0, data.dailyChain - 1);
        const { [today]: removed, ...remainingCompletions } = data.dailyCompletions;
        updatedData.dailyCompletions = remainingCompletions;
      }
    }

    return updatedData;
  }

  // Reset habits for a new day/week
  async checkAndResetHabits(userId) {
    try {
      const currentData = await this.loadHabitsData(userId);
      const today = getToday();
      const thisWeek = getCurrentWeek();
      let updated = { ...currentData };

      // Reset daily habits if new day
      if (currentData.lastDailyReset !== today) {
        // Reset completion status for all daily habits
        updated.dailyHabits = currentData.dailyHabits.map(habit => ({ ...habit, completed: false }));
        updated.customDailyHabits = (currentData.customDailyHabits || []).map(habit => ({ ...habit, completed: false }));
        updated.lastDailyReset = today;

        // Check if we need to break daily chain
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayCompleted = currentData.dailyCompletions[yesterdayStr];
        if (!yesterdayCompleted) {
          updated.dailyChain = 0;
        }
      }

      // Reset weekly habits if new week
      if (currentData.lastWeeklyReset !== thisWeek) {
        // Reset completion status for all weekly habits
        updated.weeklyHabits = currentData.weeklyHabits.map(habit => ({ ...habit, completed: false }));
        updated.customWeeklyHabits = (currentData.customWeeklyHabits || []).map(habit => ({ ...habit, completed: false }));
        updated.lastWeeklyReset = thisWeek;

        // Check if we need to break weekly chain
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekStr = new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() - lastWeek.getDay()).toISOString().split('T')[0];
        const lastWeekCompleted = currentData.weeklyCompletions[lastWeekStr];
        if (!lastWeekCompleted) {
          updated.weeklyChain = 0;
        }
      }

      if (updated.lastDailyReset !== currentData.lastDailyReset || updated.lastWeeklyReset !== currentData.lastWeeklyReset) {
        await this.saveHabitsData(userId, updated);
      }

      return updated;
    } catch (error) {
      console.error('Error checking and resetting habits:', error);
      throw error;
    }
  }

  // Reset all habit progress (for testing)
  async resetAllProgress(userId) {
    try {
      const currentData = await this.loadHabitsData(userId);
      const resetData = {
        ...currentData,
        dailyHabits: defaultDailyHabits,
        weeklyHabits: defaultWeeklyHabits,
        customDailyHabits: (currentData.customDailyHabits || []).map(habit => ({ ...habit, completed: false })),
        customWeeklyHabits: (currentData.customWeeklyHabits || []).map(habit => ({ ...habit, completed: false })),
        dailyChain: 0,
        weeklyChain: 0,
        dailyCompletions: {},
        weeklyCompletions: {},
        lastDailyReset: getToday(),
        lastWeeklyReset: getCurrentWeek()
      };

      await this.saveHabitsData(userId, resetData);
      return resetData;
    } catch (error) {
      console.error('Error resetting all progress:', error);
      throw error;
    }
  }

  // LocalStorage fallback methods
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(this.localStorageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    
    return {
      dailyHabits: defaultDailyHabits,
      weeklyHabits: defaultWeeklyHabits,
      customDailyHabits: [],
      customWeeklyHabits: [],
      dailyChain: 0,
      weeklyChain: 0,
      dailyCompletions: {},
      weeklyCompletions: {},
      lastDailyReset: getToday(),
      lastWeeklyReset: getCurrentWeek(),
    };
  }

  saveToLocalStorage(data) {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
}

export default new HabitService();