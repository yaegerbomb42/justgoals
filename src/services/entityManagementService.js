// entityManagementService.js

/**
 * Service for managing goals, milestones, and journal entries.
 * Uses Firestore for cross-device sync with localStorage fallback.
 */

import firestoreService from './firestoreService';
import { firestore } from './firebaseClient';

// Helper function to get items from localStorage
const getItems = (storageKey) => {
  if (!storageKey) return [];
  const itemsJson = localStorage.getItem(storageKey);
  try {
    return itemsJson ? JSON.parse(itemsJson) : [];
  } catch (e) {
    console.error(`Error parsing items from localStorage key ${storageKey}:`, e);
    return []; // Return empty array on error
  }
};

// Helper function to save items to localStorage
const saveItems = (storageKey, items) => {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (e) {
    console.error(`Error saving items to localStorage key ${storageKey}:`, e);
  }
};

// Defensive: ensure all returned values are arrays and log if not
const ensureArray = (val, label) => {
  if (!Array.isArray(val)) {
    console.error(`Expected array for ${label}, got:`, val);
    return [];
  }
  return val;
};

// In-memory retry queue for failed Firestore saves
const retryQueue = [];

function queueRetry(fn) {
  retryQueue.push(fn);
  // Optionally, set up a background retry interval
  if (!window._entityRetryInterval) {
    window._entityRetryInterval = setInterval(async () => {
      for (let i = retryQueue.length - 1; i >= 0; i--) {
        try {
          await retryQueue[i]();
          retryQueue.splice(i, 1);
        } catch (e) {
          // Still failed, keep in queue
        }
      }
    }, 10000); // Retry every 10s
  }
}

// --- Goal Management ---

const getGoalStorageKey = (userId) => userId ? `goals_data_${userId}` : null;

export const createGoal = async (user, goalData) => {
  if (!user || !user.id) {
    console.error("User object with ID is required to create a goal.");
    return null;
  }
  try {
    const now = new Date().toISOString();
    const goalToSave = {
      ...goalData,
      createdAt: goalData.createdAt || now,
    };
    const savedGoal = await firestoreService.saveGoal(user.id, goalToSave);
    // Update localStorage with latest
    const storageKey = getGoalStorageKey(user.id);
    const goals = getItems(storageKey);
    const updatedGoals = [...goals, savedGoal];
    saveItems(storageKey, updatedGoals);
    return savedGoal;
  } catch (error) {
    console.error("Error creating goal:", error);
    // Fallback to localStorage only, and queue retry
    const storageKey = getGoalStorageKey(user.id);
    const goals = getItems(storageKey);
    const now = new Date().toISOString();
    const newGoal = {
      id: Date.now().toString(),
      ...goalData,
      progress: goalData.progress || 0,
      createdAt: goalData.createdAt || now,
      userId: user.id,
    };
    const updatedGoals = [...goals, newGoal];
    saveItems(storageKey, updatedGoals);
    queueRetry(() => firestoreService.saveGoal(user.id, newGoal));
    return newGoal;
  }
};

export const getGoals = async (user) => {
  if (!user || !user.id) return [];

  try {
    // Try to get from Firestore first
    const goals = await firestoreService.getGoals(user.id);
    
    // Update localStorage with latest data
    const storageKey = getGoalStorageKey(user.id);
    saveItems(storageKey, goals);
    
    return ensureArray(goals, 'goals');
  } catch (error) {
    console.error("Error getting goals from Firestore, falling back to localStorage:", error);
    
    // Fallback to localStorage
    const storageKey = getGoalStorageKey(user.id);
    return ensureArray(getItems(storageKey), 'goals');
  }
};

export const getGoalById = (user, goalId) => {
  if (!user || !user.id) return null;
  const goals = getGoals(user);
  return goals.find(goal => goal.id === goalId) || null;
};

export const updateGoal = async (user, goalId, updateData) => {
  if (!user || !user.id) return null;
  try {
    const updatedGoal = await firestoreService.updateGoal(user.id, goalId, updateData);
    const storageKey = getGoalStorageKey(user.id);
    let goals = getItems(storageKey);
    goals = goals.map(goal => goal.id === goalId ? updatedGoal : goal);
    saveItems(storageKey, goals);
    return updatedGoal;
  } catch (error) {
    console.error("Error updating goal in Firestore, falling back to localStorage:", error);
    const storageKey = getGoalStorageKey(user.id);
    let goals = getItems(storageKey);
    let updatedGoal = null;
    goals = goals.map(goal => {
      if (goal.id === goalId) {
        updatedGoal = { ...goal, ...updateData, updatedAt: new Date().toISOString() };
        queueRetry(() => firestoreService.updateGoal(user.id, goalId, updatedGoal));
        return updatedGoal;
      }
      return goal;
    });
    if (updatedGoal) {
      saveItems(storageKey, goals);
    }
    return updatedGoal;
  }
};

export const deleteGoal = async (user, goalId) => {
  if (!user || !user.id) return false;

  try {
    // Delete from Firestore
    await firestoreService.deleteGoal(user.id, goalId);
    
    // Delete from localStorage
    const storageKey = getGoalStorageKey(user.id);
    let goals = getItems(storageKey);
    goals = goals.filter(goal => goal.id !== goalId);
    saveItems(storageKey, goals);
    
    return true;
  } catch (error) {
    console.error("Error deleting goal from Firestore, falling back to localStorage:", error);
    
    // Fallback to localStorage only
    const storageKey = getGoalStorageKey(user.id);
    let goals = getItems(storageKey);
    goals = goals.filter(goal => goal.id !== goalId);
    saveItems(storageKey, goals);
    
    return true;
  }
};

export const saveGoalCalendarEventId = async (userId, goalId, eventId) => {
  await firestore.collection('users').doc(userId).collection('goals').doc(goalId).update({
    googleCalendarEventId: eventId,
  });
};

export const getGoalCalendarEventId = async (userId, goalId) => {
  const doc = await firestore.collection('users').doc(userId).collection('goals').doc(goalId).get();
  return doc.exists ? doc.data().googleCalendarEventId : null;
};

// Helper: update goal progress based on completed milestones
export const autoUpdateGoalProgress = async (user, goalId) => {
  if (!user || !user.id || !goalId) return;
  const storageKey = getGoalStorageKey(user.id);
  let goals = getItems(storageKey);
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return;

  // Get all milestones for this goal
  const milestonesKey = `milestones_data_${user.id}`;
  const milestones = getItems(milestonesKey).filter(m => m.goalId === goalId);
  const total = milestones.length;
  const completed = milestones.filter(m => m.completed).length;
  let progress = total > 0 ? Math.round((completed / total) * 100) : goal.progress;

  // If goal is in auto mode, call AI for a smarter update
  if (goal.progressMode === 'auto') {
    try {
      const recentActivities = []; // Optionally, fetch recent activities
      progress = await import('../services/geminiService').then(mod => mod.determineProgressUpdate(goal, recentActivities));
    } catch (e) { /* fallback to milestone-based progress */ }
  }

  // Update goal progress
  await updateGoal(user, goalId, { progress });
};

// Patch: after milestone completion, auto-update parent goal progress
export const completeMilestone = async (user, milestoneId) => {
  // ...existing code to mark milestone as completed...
  // After completion:
  const milestonesKey = `milestones_data_${user.id}`;
  const milestones = getItems(milestonesKey);
  const milestone = milestones.find(m => m.id === milestoneId);
  if (milestone && milestone.goalId) {
    await autoUpdateGoalProgress(user, milestone.goalId);
  }
  // ...existing code...
};

// Patch: after focus session ends, auto-update all active goals
export const endFocusSession = async (user, sessionId) => {
  // ...existing code to end session...
  // After ending:
  const storageKey = getGoalStorageKey(user.id);
  const goals = getItems(storageKey).filter(g => g.progress < 100);
  for (const goal of goals) {
    await autoUpdateGoalProgress(user, goal.id);
  }
  // ...existing code...
};

// --- Milestone Management ---

const getMilestoneStorageKey = (userId) => userId ? `milestones_data_${userId}` : null;

export const createMilestone = async (user, milestoneData) => {
  if (!user || !user.id) {
    console.error("User object with ID is required to create a milestone.");
    return null;
  }
  try {
    const savedMilestone = await firestoreService.saveMilestone(user.id, milestoneData);
    const storageKey = getMilestoneStorageKey(user.id);
    const milestones = getItems(storageKey);
    const updatedMilestones = [...milestones, savedMilestone];
    saveItems(storageKey, updatedMilestones);
    return savedMilestone;
  } catch (error) {
    console.error("Error creating milestone:", error);
    const storageKey = getMilestoneStorageKey(user.id);
    const milestones = getItems(storageKey);
    const newMilestone = {
      id: Date.now().toString(),
      ...milestoneData,
      createdAt: new Date().toISOString(),
      userId: user.id,
    };
    const updatedMilestones = [...milestones, newMilestone];
    saveItems(storageKey, updatedMilestones);
    queueRetry(() => firestoreService.saveMilestone(user.id, newMilestone));
    return newMilestone;
  }
};

export const getMilestones = async (user) => {
  if (!user || !user.id) return [];

  try {
    // Get from Firestore
    const milestones = await firestoreService.getMilestones(user.id);
    
    // Update localStorage
    const storageKey = getMilestoneStorageKey(user.id);
    saveItems(storageKey, milestones);
    
    return ensureArray(milestones, 'milestones');
  } catch (error) {
    console.error("Error getting milestones from Firestore, falling back to localStorage:", error);
    
    // Fallback to localStorage
    const storageKey = getMilestoneStorageKey(user.id);
    return ensureArray(getItems(storageKey), 'milestones');
  }
};

export const getMilestoneById = (user, milestoneId) => {
  if (!user || !user.id) return null;
  const milestones = getMilestones(user);
  return milestones.find(m => m.id === milestoneId) || null;
};

export const updateMilestone = async (user, milestoneId, updateData) => {
  if (!user || !user.id) return null;

  try {
    // Update in Firestore
    const updatedMilestone = await firestoreService.updateMilestone(user.id, milestoneId, updateData);
    
    // Update localStorage
    const storageKey = getMilestoneStorageKey(user.id);
    let milestones = getItems(storageKey);
    milestones = milestones.map(milestone => milestone.id === milestoneId ? updatedMilestone : milestone);
    saveItems(storageKey, milestones);
    
    return updatedMilestone;
  } catch (error) {
    console.error("Error updating milestone in Firestore, falling back to localStorage:", error);
    
    // Fallback to localStorage
    const storageKey = getMilestoneStorageKey(user.id);
    let milestones = getItems(storageKey);
    let updatedMilestone = null;

    milestones = milestones.map(milestone => {
      if (milestone.id === milestoneId) {
        updatedMilestone = { ...milestone, ...updateData, updatedAt: new Date().toISOString() };
        return updatedMilestone;
      }
      return milestone;
    });

    if (updatedMilestone) {
      saveItems(storageKey, milestones);
    }
    return updatedMilestone;
  }
};

export const deleteMilestone = async (user, milestoneId) => {
  if (!user || !user.id) return false;

  try {
    // Delete from Firestore
    await firestoreService.deleteMilestone(user.id, milestoneId);
    
    // Delete from localStorage
    const storageKey = getMilestoneStorageKey(user.id);
    let milestones = getItems(storageKey);
    milestones = milestones.filter(milestone => milestone.id !== milestoneId);
    saveItems(storageKey, milestones);
    
    return true;
  } catch (error) {
    console.error("Error deleting milestone from Firestore, falling back to localStorage:", error);
    
    // Fallback to localStorage
    const storageKey = getMilestoneStorageKey(user.id);
    let milestones = getItems(storageKey);
    milestones = milestones.filter(milestone => milestone.id !== milestoneId);
    saveItems(storageKey, milestones);
    
    return true;
  }
};

// --- Journal Entry Management ---

const getJournalStorageKey = (userId) => userId ? `journal_entries_${userId}` : null;

export const createJournalEntry = async (user, entryData) => {
  if (!user || !user.id) {
    console.error("User object with ID is required to create a journal entry.");
    return null;
  }
  try {
    const savedEntry = await firestoreService.saveJournalEntry(user.id, entryData);
    const storageKey = getJournalStorageKey(user.id);
    const entries = getItems(storageKey);
    const updatedEntries = [savedEntry, ...entries];
    saveItems(storageKey, updatedEntries);
    return savedEntry;
  } catch (error) {
    console.error("Error creating journal entry:", error);
    const storageKey = getJournalStorageKey(user.id);
    const entries = getItems(storageKey);
    const newEntry = {
      id: Date.now().toString(),
      ...entryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.id,
    };
    const updatedEntries = [newEntry, ...entries];
    saveItems(storageKey, updatedEntries);
    queueRetry(() => firestoreService.saveJournalEntry(user.id, newEntry));
    return newEntry;
  }
};

export const getJournalEntries = async (user) => {
  if (!user || !user.id) return [];

  try {
    // Get from Firestore
    const entries = await firestoreService.getJournalEntries(user.id);
    
    // Update localStorage
    const storageKey = getJournalStorageKey(user.id);
    saveItems(storageKey, entries);
    
    return ensureArray(entries, 'journal entries');
  } catch (error) {
    console.error("Error getting journal entries from Firestore, falling back to localStorage:", error);
    
    // Fallback to localStorage
    const storageKey = getJournalStorageKey(user.id);
    return ensureArray(getItems(storageKey), 'journal entries');
  }
};

export const getJournalEntryById = (user, entryId) => {
  if (!user || !user.id) return null;
  const entries = getJournalEntries(user);
  return entries.find(e => e.id === entryId) || null;
};

export const updateJournalEntry = async (user, entryId, updateData) => {
  if (!user || !user.id) return null;

  try {
    // Update in Firestore
    const updatedEntry = await firestoreService.updateJournalEntry(user.id, entryId, updateData);
    
    // Update localStorage
    const storageKey = getJournalStorageKey(user.id);
    let entries = getItems(storageKey);
    entries = entries.map(entry => entry.id === entryId ? updatedEntry : entry);
    saveItems(storageKey, entries);
    
    return updatedEntry;
  } catch (error) {
    console.error("Error updating journal entry in Firestore, falling back to localStorage:", error);
    
    // Fallback to localStorage
    const storageKey = getJournalStorageKey(user.id);
    let entries = getItems(storageKey);
    let updatedEntry = null;

    entries = entries.map(entry => {
      if (entry.id === entryId) {
        updatedEntry = { ...entry, ...updateData, updatedAt: new Date().toISOString() };
        return updatedEntry;
      }
      return entry;
    });

    if (updatedEntry) {
      saveItems(storageKey, entries);
    }
    return updatedEntry;
  }
};

export const deleteJournalEntry = async (user, entryId) => {
  if (!user || !user.id) return false;

  try {
    // Delete from Firestore
    await firestoreService.deleteJournalEntry(user.id, entryId);
    
    // Delete from localStorage
    const storageKey = getJournalStorageKey(user.id);
    let entries = getItems(storageKey);
    entries = entries.filter(entry => entry.id !== entryId);
    saveItems(storageKey, entries);
    
    return true;
  } catch (error) {
    console.error("Error deleting journal entry from Firestore, falling back to localStorage:", error);
    
    // Fallback to localStorage
    const storageKey = getJournalStorageKey(user.id);
    let entries = getItems(storageKey);
    entries = entries.filter(entry => entry.id !== entryId);
    saveItems(storageKey, entries);
    
    return true;
  }
};

// Example of how a component would get the user (e.g., using useAuth hook)
// This service itself does not manage auth state, it expects a user object.
//
// import { useAuth } from '../context/AuthContext';
// const { user } = useAuth();
// if (user) {
//   const userGoals = getGoals(user);
// }
