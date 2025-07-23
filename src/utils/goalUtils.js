// src/utils/goalUtils.js

/**
 * Saves a new goal to localStorage for a specific user.
 *
 * @param {object} goalData - The goal object to save. Expected to have at least a 'title'.
 *                            It can also include 'description', 'category', 'priority',
 *                            'deadline', 'targetValue', 'unit', etc.
 * @param {string} userId - The ID of the user for whom to save the goal.
 * @returns {object} The saved goal object, including its new unique ID and any defaults.
 * @throws {Error} If userId is not provided or if there's an issue saving.
 */
export const saveGoal = (goalData, userId) => {
  if (!userId) {
    throw new Error("User ID is required to save a goal.");
  }
  if (!goalData || typeof goalData.title !== 'string' || goalData.title.trim() === '') {
    throw new Error("Goal title is required and cannot be empty.");
  }

  const goalsKey = `goals_data_${userId}`;
  let goals = [];

  try {
    const existingGoalsJson = localStorage.getItem(goalsKey);
    if (existingGoalsJson) {
      goals = JSON.parse(existingGoalsJson);
      if (!Array.isArray(goals)) { // Basic validation if something went wrong with stored data
        console.warn(`Data at ${goalsKey} was not an array. Resetting to empty array.`);
        goals = [];
      }
    }
  } catch (error) {
    console.error(`Error parsing existing goals for user ${userId}:`, error);
    // Decide if we want to throw here or try to overwrite with a new list containing this goal
    // For robustness, let's try to continue by assuming an empty list if parsing fails.
    goals = [];
  }

  const newGoal = {
    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
    title: goalData.title.trim(),
    description: goalData.description?.trim() || '',
    category: goalData.category?.trim() || 'General',
    priority: goalData.priority || 'medium',
    deadline: goalData.deadline || null, // Expects YYYY-MM-DD or null
    progress: 0, // Initial progress
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isCompleted: false,
    targetValue: goalData.targetValue || null,
    unit: goalData.unit || null,
    // Add any other fields that should be part of a new goal
    ...goalData // Spread goalData to include any other fields passed, like parsed ones
  };

  // Ensure specific fields from goalData overwrite defaults if they exist
  // and are valid, for example, if AI provided a specific category or priority.
  // The spread above handles this, but explicit assignments can be clearer for core fields.
  if (goalData.category) newGoal.category = goalData.category;
  if (goalData.priority) newGoal.priority = goalData.priority;


  goals.push(newGoal);

  try {
    localStorage.setItem(goalsKey, JSON.stringify(goals));
    return newGoal; // Return the fully formed new goal
  } catch (error) {
    console.error(`Error saving goals for user ${userId}:`, error);
    throw new Error("Failed to save goal to localStorage.");
  }
};

/**
 * Calculate user streak based on completed milestones and focus sessions
 * @param {string} userId - The user ID
 * @returns {object} Streak information including current streak, longest streak, and last activity
 */
export const calculateUserStreak = (userId) => {
  if (!userId) {
    return { currentStreak: 0, longestStreak: 0, lastActivity: null };
  }

  try {
    // Import daily activity service for more accurate streak calculation
    import('../services/dailyActivityService').then(module => {
      const dailyActivityService = module.default;
      const activityStreak = dailyActivityService.getStreak(userId);
      
      // Fall back to milestone-based calculation if no activity data
      if (activityStreak.currentStreak > 0) {
        return activityStreak;
      }
    }).catch(() => {
      // Fallback to original calculation if service not available
    });

    // Get milestones data
    const milestonesKey = `milestones_data_${userId}`;
    const milestonesData = localStorage.getItem(milestonesKey);
    const milestones = milestonesData ? JSON.parse(milestonesData) : [];

    // Get focus session history
    const focusHistoryKey = `focus_session_history_${userId}`;
    const focusHistoryData = localStorage.getItem(focusHistoryKey);
    const focusHistory = focusHistoryData ? JSON.parse(focusHistoryData) : [];

    // Combine all activity dates
    const activityDates = new Set();

    // Add milestone completion dates
    milestones.forEach(milestone => {
      if (milestone.completed && milestone.completedAt) {
        const date = new Date(milestone.completedAt).toISOString().split('T')[0];
        activityDates.add(date);
      }
    });

    // Add focus session dates
    focusHistory.forEach(session => {
      if (session.endTime) {
        const date = new Date(session.endTime).toISOString().split('T')[0];
        activityDates.add(date);
      }
    });

    // Convert to sorted array of dates
    const sortedDates = Array.from(activityDates).sort().reverse();
    
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActivity: null };
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let checkDate = today;
    while (sortedDates.includes(checkDate)) {
      currentStreak++;
      const checkDateObj = new Date(checkDate);
      checkDateObj.setDate(checkDateObj.getDate() - 1);
      checkDate = checkDateObj.toISOString().split('T')[0];
    }

    // If no activity today, check if yesterday was the last activity
    if (currentStreak === 0 && sortedDates[0] === yesterday) {
      currentStreak = 1;
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      
      if (prevDate) {
        const prevDateObj = new Date(prevDate);
        const dayDiff = Math.floor((prevDateObj - currentDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      
      prevDate = sortedDates[i];
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastActivity: sortedDates[0] || null
    };
  } catch (error) {
    console.error(`Error calculating streak for user ${userId}:`, error);
    return { currentStreak: 0, longestStreak: 0, lastActivity: null };
  }
};

/**
 * Retrieves all goals for a specific user from localStorage.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Array<object>} An array of goal objects, or an empty array if none found or on error.
 */
export const getGoals = (userId) => {
  if (!userId) {
    console.error("User ID is required to retrieve goals.");
    return [];
  }
  const goalsKey = `goals_data_${userId}`;
  try {
    const goalsJson = localStorage.getItem(goalsKey);
    if (goalsJson) {
      const parsedGoals = JSON.parse(goalsJson);
      return Array.isArray(parsedGoals) ? parsedGoals : [];
    }
    return [];
  } catch (error) {
    console.error(`Error retrieving or parsing goals for user ${userId}:`, error);
    return []; // Return empty array on error to prevent crashes
  }
};

/**
 * Updates an existing goal in localStorage.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} goalId - The ID of the goal to update.
 * @param {object} updates - The fields to update.
 * @returns {object|null} The updated goal object, or null if not found.
 */
export const updateGoal = (userId, goalId, updates) => {
  if (!userId || !goalId) {
    throw new Error("User ID and Goal ID are required to update a goal.");
  }

  const goalsKey = `goals_data_${userId}`;
  let goals = [];

  try {
    const existingGoalsJson = localStorage.getItem(goalsKey);
    if (existingGoalsJson) {
      goals = JSON.parse(existingGoalsJson);
    }
  } catch (error) {
    console.error(`Error parsing existing goals for user ${userId}:`, error);
    throw new Error("Failed to load existing goals.");
  }

  const goalIndex = goals.findIndex(goal => goal.id === goalId);
  if (goalIndex === -1) {
    return null; // Goal not found
  }

  // Update the goal with new data
  goals[goalIndex] = {
    ...goals[goalIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Ensure date fields are properly formatted
  if (updates.deadline) {
    // Convert various date formats to YYYY-MM-DD
    if (typeof updates.deadline === 'string') {
      const date = new Date(updates.deadline);
      if (!isNaN(date.getTime())) {
        goals[goalIndex].deadline = date.toISOString().split('T')[0];
      }
    }
  }

  try {
    localStorage.setItem(goalsKey, JSON.stringify(goals));
    return goals[goalIndex];
  } catch (error) {
    console.error(`Error saving updated goals for user ${userId}:`, error);
    throw new Error("Failed to save updated goal to localStorage.");
  }
};

/**
 * Deletes a goal from localStorage.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} goalId - The ID of the goal to delete.
 * @returns {boolean} True if the goal was deleted, false if not found.
 */
export const deleteGoal = (userId, goalId) => {
  if (!userId || !goalId) {
    throw new Error("User ID and Goal ID are required to delete a goal.");
  }

  const goalsKey = `goals_data_${userId}`;
  let goals = [];

  try {
    const existingGoalsJson = localStorage.getItem(goalsKey);
    if (existingGoalsJson) {
      goals = JSON.parse(existingGoalsJson);
    }
  } catch (error) {
    console.error(`Error parsing existing goals for user ${userId}:`, error);
    throw new Error("Failed to load existing goals.");
  }

  const initialLength = goals.length;
  goals = goals.filter(goal => goal.id !== goalId);

  if (goals.length === initialLength) {
    return false; // Goal not found
  }

  try {
    localStorage.setItem(goalsKey, JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error(`Error saving goals after deletion for user ${userId}:`, error);
    throw new Error("Failed to save goals after deletion.");
  }
};

/**
 * Formats a date string to a readable format.
 *
 * @param {string} dateString - The date string in YYYY-MM-DD format.
 * @returns {string} Formatted date string.
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'No deadline';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Gets the number of days until a deadline.
 *
 * @param {string} deadline - The deadline date string.
 * @returns {number} Days until deadline (negative if overdue).
 */
export const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null;
  
  try {
    // Create a new date object from the deadline string
    const deadlineDate = new Date(deadline + 'T23:59:59'); // End of deadline day
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today to fix off-by-one error
    
    // Calculate difference in milliseconds and convert to days
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Use ceil instead of floor
    
    return diffDays;
  } catch (error) {
    return null;
  }
};

export function getGeminiApiKey() {
  return localStorage.getItem('gemini_api_key_global') || '';
}
