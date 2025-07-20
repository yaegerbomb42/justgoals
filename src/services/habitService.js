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
    this.localStorageKey = 'habits_tree_data';
  }

  // Get user habits collection reference
  getUserHabitsCollection(userId) {
    return collection(this.db, 'users', userId, 'habits');
  }

  // Generate unique habit ID
  generateHabitId(name) {
    return `habit_${Date.now()}_${name.toLowerCase().replace(/\s+/g, '-')}_${Math.random().toString(36).substr(2, 5)}`;
  }

  // Generate unique node ID
  generateNodeId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  // Load habits from Firebase or localStorage fallback
  async getHabits(userId) {
    try {
      if (!userId) {
        return this.loadFromLocalStorage();
      }

      const habitsCollection = this.getUserHabitsCollection(userId);
      const querySnapshot = await getDocs(query(habitsCollection, orderBy('createdAt', 'desc')));
      
      const habits = [];
      querySnapshot.forEach((doc) => {
        habits.push({ id: doc.id, ...doc.data() });
      });

      return habits;
    } catch (error) {
      console.error('Error loading habits from Firebase:', error);
      return this.loadFromLocalStorage();
    }
  }

  // Create a new habit with tree-based tracking
  async createHabit(userId, habitData) {
    try {
      const habitId = this.generateHabitId(habitData.title);
      const today = getToday();
      
      const newHabit = {
        id: habitId,
        title: habitData.title,
        description: habitData.description || '',
        category: habitData.category || 'general',
        frequency: habitData.frequency || 'daily',
        targetChecks: habitData.targetChecks || 1,
        allowMultipleChecks: habitData.allowMultipleChecks || false,
        color: habitData.color || '#3B82F6',
        emoji: habitData.emoji || '🎯',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        treeNodes: [{
          id: this.generateNodeId(),
          date: today,
          checks: [],
          status: 'active',
          parentId: null,
          createdAt: new Date().toISOString()
        }]
      };

      if (!userId) {
        // Save to localStorage for demo/offline mode
        const existingHabits = this.loadFromLocalStorage();
        existingHabits.push(newHabit);
        this.saveToLocalStorage(existingHabits);
        return newHabit;
      }

      const habitDoc = doc(this.getUserHabitsCollection(userId), habitId);
      await setDoc(habitDoc, newHabit);
      
      // Also save to localStorage as backup
      const existingHabits = await this.getHabits(userId);
      existingHabits.push(newHabit);
      this.saveToLocalStorage(existingHabits);
      
      return newHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  // Add a check-in to a habit node
  async addCheckIn(userId, habitId, nodeId, checkType = 'default') {
    try {
      const habits = await this.getHabits(userId);
      const habitIndex = habits.findIndex(h => h.id === habitId);
      
      if (habitIndex === -1) {
        throw new Error('Habit not found');
      }

      const habit = habits[habitIndex];
      const nodeIndex = habit.treeNodes.findIndex(n => n.id === nodeId);
      
      if (nodeIndex === -1) {
        throw new Error('Node not found');
      }

      const node = habit.treeNodes[nodeIndex];
      const newCheck = {
        id: Date.now(),
        type: checkType,
        timestamp: new Date().toISOString(),
        completed: true
      };

      node.checks.push(newCheck);
      
      // Check if node is completed
      if (node.checks.length >= habit.targetChecks) {
        node.status = 'completed';
      }

      // Update the habit
      habit.updatedAt = serverTimestamp();
      habits[habitIndex] = habit;

      if (!userId) {
        this.saveToLocalStorage(habits);
      } else {
        const habitDoc = doc(this.getUserHabitsCollection(userId), habitId);
        await updateDoc(habitDoc, {
          treeNodes: habit.treeNodes,
          updatedAt: serverTimestamp()
        });
        this.saveToLocalStorage(habits);
      }

      return habit;
    } catch (error) {
      console.error('Error adding check-in:', error);
      throw error;
    }
  }

  // Create a new branch from an existing node
  async createBranch(userId, habitId, parentNodeId) {
    try {
      const habits = await this.getHabits(userId);
      const habitIndex = habits.findIndex(h => h.id === habitId);
      
      if (habitIndex === -1) {
        throw new Error('Habit not found');
      }

      const habit = habits[habitIndex];
      const parentNode = habit.treeNodes.find(n => n.id === parentNodeId);
      
      if (!parentNode) {
        throw new Error('Parent node not found');
      }

      const today = getToday();
      const newNode = {
        id: this.generateNodeId(),
        date: today,
        checks: [],
        status: 'active',
        parentId: parentNodeId,
        createdAt: new Date().toISOString()
      };

      habit.treeNodes.push(newNode);
      habit.updatedAt = serverTimestamp();
      habits[habitIndex] = habit;

      if (!userId) {
        this.saveToLocalStorage(habits);
      } else {
        const habitDoc = doc(this.getUserHabitsCollection(userId), habitId);
        await updateDoc(habitDoc, {
          treeNodes: habit.treeNodes,
          updatedAt: serverTimestamp()
        });
        this.saveToLocalStorage(habits);
      }

      return habit;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  // Reset a failed branch
  async resetBranch(userId, habitId, nodeId) {
    try {
      const habits = await this.getHabits(userId);
      const habitIndex = habits.findIndex(h => h.id === habitId);
      
      if (habitIndex === -1) {
        throw new Error('Habit not found');
      }

      const habit = habits[habitIndex];
      const nodeIndex = habit.treeNodes.findIndex(n => n.id === nodeId);
      
      if (nodeIndex === -1) {
        throw new Error('Node not found');
      }

      const node = habit.treeNodes[nodeIndex];
      node.checks = [];
      node.status = 'active';
      node.updatedAt = new Date().toISOString();

      habit.updatedAt = serverTimestamp();
      habits[habitIndex] = habit;

      if (!userId) {
        this.saveToLocalStorage(habits);
      } else {
        const habitDoc = doc(this.getUserHabitsCollection(userId), habitId);
        await updateDoc(habitDoc, {
          treeNodes: habit.treeNodes,
          updatedAt: serverTimestamp()
        });
        this.saveToLocalStorage(habits);
      }

      return habit;
    } catch (error) {
      console.error('Error resetting branch:', error);
      throw error;
    }
  }

  // Delete a habit
  async deleteHabit(userId, habitId) {
    try {
      if (!userId) {
        const habits = this.loadFromLocalStorage();
        const filteredHabits = habits.filter(h => h.id !== habitId);
        this.saveToLocalStorage(filteredHabits);
        return true;
      }

      const habitDoc = doc(this.getUserHabitsCollection(userId), habitId);
      await deleteDoc(habitDoc);
      
      // Update localStorage
      const habits = await this.getHabits(userId);
      const filteredHabits = habits.filter(h => h.id !== habitId);
      this.saveToLocalStorage(filteredHabits);
      
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  // Update habit details
  async updateHabit(userId, habitId, updates) {
    try {
      const habits = await this.getHabits(userId);
      const habitIndex = habits.findIndex(h => h.id === habitId);
      
      if (habitIndex === -1) {
        throw new Error('Habit not found');
      }

      const updatedHabit = {
        ...habits[habitIndex],
        ...updates,
        updatedAt: serverTimestamp()
      };

      habits[habitIndex] = updatedHabit;

      if (!userId) {
        this.saveToLocalStorage(habits);
      } else {
        const habitDoc = doc(this.getUserHabitsCollection(userId), habitId);
        await updateDoc(habitDoc, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        this.saveToLocalStorage(habits);
      }

      return updatedHabit;
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  // Get habit statistics
  getHabitStats(habit) {
    if (!habit.treeNodes) {
      return { totalDays: 0, completedDays: 0, currentStreak: 0, longestStreak: 0 };
    }

    const completedNodes = habit.treeNodes.filter(node => node.status === 'completed');
    const totalDays = habit.treeNodes.length;
    const completedDays = completedNodes.length;

    // Calculate current streak
    let currentStreak = 0;
    const sortedNodes = habit.treeNodes
      .filter(node => node.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const node of sortedNodes) {
      const checks = node.checks || [];
      const targetChecks = habit.targetChecks || 1;
      if (checks.length >= targetChecks) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified)
    let longestStreak = currentStreak;

    return {
      totalDays,
      completedDays,
      currentStreak,
      longestStreak,
      completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
    };
  }

  // Check and auto-manage chains (no manual chain breaking)
  async checkAndAutoManageChains(userId) {
    try {
      const habits = await this.getHabits(userId);
      const today = getToday();
      let updated = false;

      for (const habit of habits) {
        const todayNode = habit.treeNodes?.find(node => node.date === today);
        
        if (!todayNode) {
          // Create new node for today
          const newNode = {
            id: this.generateNodeId(),
            date: today,
            checks: [],
            status: 'active',
            parentId: null,
            createdAt: new Date().toISOString()
          };
          
          habit.treeNodes = habit.treeNodes || [];
          habit.treeNodes.push(newNode);
          updated = true;
        } else if (todayNode.status === 'active') {
          // Check if today's node should be marked as failed
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          const yesterdayNode = habit.treeNodes?.find(node => node.date === yesterdayStr);
          
          if (yesterdayNode && yesterdayNode.status === 'active' && yesterdayNode.checks.length < (habit.targetChecks || 1)) {
            yesterdayNode.status = 'failed';
            updated = true;
          }
        }
      }

      if (updated) {
        if (!userId) {
          this.saveToLocalStorage(habits);
        } else {
          // Update all modified habits
          for (const habit of habits) {
            const habitDoc = doc(this.getUserHabitsCollection(userId), habit.id);
            await updateDoc(habitDoc, {
              treeNodes: habit.treeNodes,
              updatedAt: serverTimestamp()
            });
          }
          this.saveToLocalStorage(habits);
        }
      }

      return habits;
    } catch (error) {
      console.error('Error checking and managing chains:', error);
      throw error;
    }
  }

  // Load from localStorage
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  // Save to localStorage
  saveToLocalStorage(habits) {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
}

// Create singleton instance
const habitService = new HabitService();

export default habitService;