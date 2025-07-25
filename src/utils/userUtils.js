/**
 * User utilities to handle user ID consistency across the application
 */

/**
 * Get standardized user ID from user object
 * Prioritizes uid for Firebase auth compatibility, falls back to id for local users
 * @param {object} user - User object from auth context
 * @returns {string|null} - Standardized user ID or null if not available
 */
export const getUserId = (user) => {
  if (!user) return null;
  return user.uid || user.id || null;
};

/**
 * Create a standardized localStorage key with user ID
 * @param {string} baseKey - Base key name
 * @param {object} user - User object from auth context
 * @returns {string|null} - Storage key with user ID or null if user not available
 */
export const createUserStorageKey = (baseKey, user) => {
  const userId = getUserId(user);
  if (!userId) return null;
  return `${baseKey}_${userId}`;
};

/**
 * Get focus session stats with proper user ID handling
 * @param {object} user - User object from auth context
 * @returns {object} - Focus session stats object
 */
export const getFocusSessionStats = (user) => {
  const userId = getUserId(user);
  if (!userId) return { totalFocusTime: 0, sessionsToday: 0, currentStreak: 0 };

  try {
    // Try both possible key formats to handle legacy data
    const newKey = `focus_session_stats_${userId}`;
    let stats = localStorage.getItem(newKey);
    
    // If not found with new key and user has both uid and id, try legacy key
    if (!stats && user.uid && user.id && user.uid !== user.id) {
      const legacyKey = `focus_session_stats_${user.id}`;
      stats = localStorage.getItem(legacyKey);
      
      // If found with legacy key, migrate to new key
      if (stats) {
        localStorage.setItem(newKey, stats);
        localStorage.removeItem(legacyKey);
      }
    }
    
    return stats ? JSON.parse(stats) : { totalFocusTime: 0, sessionsToday: 0, currentStreak: 0 };
  } catch (e) {
    console.error('Error loading focus session stats:', e);
    return { totalFocusTime: 0, sessionsToday: 0, currentStreak: 0 };
  }
};

/**
 * Save focus session stats with proper user ID handling
 * @param {object} user - User object from auth context
 * @param {object} stats - Stats object to save
 */
export const saveFocusSessionStats = (user, stats) => {
  const userId = getUserId(user);
  if (!userId) return;

  try {
    const key = `focus_session_stats_${userId}`;
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving focus session stats:', e);
  }
};

/**
 * Get user streak data with proper user ID handling
 * @param {object} user - User object from auth context
 * @returns {object} - Streak data object
 */
export const getUserStreakData = (user) => {
  const userId = getUserId(user);
  if (!userId) return { currentStreak: 0, longestStreak: 0 };

  try {
    // Import the streak calculation utility
    const { calculateUserStreak } = require('./goalUtils');
    return calculateUserStreak(userId);
  } catch (e) {
    console.error('Error calculating user streak:', e);
    return { currentStreak: 0, longestStreak: 0 };
  }
};

/**
 * Migrate legacy localStorage keys to use standardized user ID
 * @param {object} user - User object from auth context
 */
export const migrateLegacyUserData = (user) => {
  if (!user || !user.uid || !user.id || user.uid === user.id) return;

  const legacyKeys = [
    'focus_session_stats',
    'focus_global_links',
    'onboardingDismissed',
    'ai_personality',
    'gemini_api_key'
  ];

  legacyKeys.forEach(baseKey => {
    try {
      const legacyKey = `${baseKey}_${user.id}`;
      const newKey = `${baseKey}_${user.uid}`;
      
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, legacyData);
        localStorage.removeItem(legacyKey);
        console.log(`Migrated ${legacyKey} to ${newKey}`);
      }
    } catch (e) {
      console.error(`Error migrating ${baseKey}:`, e);
    }
  });
};
