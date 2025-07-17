const DATA_KEYS_TO_BACKUP = [
  'goals_data', // User ID will be appended
  'journal_entries', // User ID will be appended
  'focus_session_stats', // User ID will be appended
  'focus_session_history', // User ID will be appended
  'app_settings' // User ID will be appended
];

const LAST_BACKUP_TIMESTAMP_KEY_PREFIX = 'last_backup_ts_';
const USER_BACKUP_DATA_KEY_PREFIX = 'app_backup_';

let backupTimers = {}; // Store timers per user: { userId: timerId }

const getUserIdSpecificKey = (baseKey, userId) => `${baseKey}_${userId}`;

export const performBackup = (userId) => {
  if (!userId) {
    console.warn('BackupService: User ID is required to perform a backup.');
    return false;
  }

  console.log(`BackupService: Performing backup for user ${userId}...`);
  const backupData = {};
  let dataFound = false;

  DATA_KEYS_TO_BACKUP.forEach(baseKey => {
    const userSpecificKey = getUserIdSpecificKey(baseKey, userId);
    try {
      const item = localStorage.getItem(userSpecificKey);
      if (item !== null) {
        backupData[baseKey] = JSON.parse(item); // Store under baseKey in backup
        dataFound = true;
      }
    } catch (error) {
      console.error(`BackupService: Error reading or parsing ${userSpecificKey} for backup:`, error);
    }
  });

  if (!dataFound) {
    console.log(`BackupService: No data found to backup for user ${userId}.`);
    return false;
  }

  try {
    const backupStorageKey = `${USER_BACKUP_DATA_KEY_PREFIX}${userId}`;
    localStorage.setItem(backupStorageKey, JSON.stringify({
      timestamp: new Date().toISOString(),
      data: backupData
    }));
    localStorage.setItem(`${LAST_BACKUP_TIMESTAMP_KEY_PREFIX}${userId}`, new Date().toISOString());
    console.log(`BackupService: Backup successful for user ${userId} to key ${backupStorageKey}`);
    return true;
  } catch (error) {
    console.error(`BackupService: Error saving backup for user ${userId}:`, error);
    return false;
  }
};

const clearUserBackupTimer = (userId) => {
  if (backupTimers[userId]) {
    clearTimeout(backupTimers[userId]);
    delete backupTimers[userId];
    console.log(`BackupService: Cleared scheduled backup for user ${userId}`);
  }
};

export const scheduleBackup = (userId, frequency) => {
  if (!userId) return;
  clearUserBackupTimer(userId);

  let intervalMs;
  switch (frequency) {
    case 'daily':
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case 'weekly':
      intervalMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case 'monthly':
      intervalMs = 30 * 24 * 60 * 60 * 1000; // Approx.
      break;
    default:
      console.warn(`BackupService: Unknown backup frequency "${frequency}". Auto backup not scheduled.`);
      return;
  }

  console.log(`BackupService: Scheduling next backup for user ${userId} with frequency ${frequency} (in ${intervalMs}ms)`);

  backupTimers[userId] = setTimeout(() => {
    console.log(`BackupService: Automatic backup triggered for user ${userId} by schedule.`);
    performBackup(userId);
    // Reschedule for the next interval
    scheduleBackup(userId, frequency);
  }, intervalMs);
};

export const manageAutoBackup = (userId, autoBackupEnabled, frequency) => {
  if (!userId) {
    console.warn('BackupService: User ID required to manage auto backup.');
    return;
  }
  console.log(`BackupService: Managing auto backup for user ${userId}. Enabled: ${autoBackupEnabled}, Frequency: ${frequency}`);
  if (autoBackupEnabled) {
    // Before scheduling, check if a backup is due
    const lastBackupTsKey = `${LAST_BACKUP_TIMESTAMP_KEY_PREFIX}${userId}`;
    const lastBackupTimestamp = localStorage.getItem(lastBackupTsKey);
    let needsImmediateBackup = true;

    if (lastBackupTimestamp) {
      const lastBackupDate = new Date(lastBackupTimestamp);
      const nowDate = new Date();
      let nextBackupDate = new Date(lastBackupDate);

      if (frequency === 'daily') nextBackupDate.setDate(lastBackupDate.getDate() + 1);
      else if (frequency === 'weekly') nextBackupDate.setDate(lastBackupDate.getDate() + 7);
      else if (frequency === 'monthly') nextBackupDate.setMonth(lastBackupDate.getMonth() + 1);
      else { // Unknown frequency, don't assume
          needsImmediateBackup = false;
      }

      if (nowDate < nextBackupDate) {
        needsImmediateBackup = false;
        // Calculate remaining time and schedule if needed, or rely on the full interval scheduleBackup
        const remainingTime = nextBackupDate.getTime() - nowDate.getTime();
        console.log(`BackupService: Next backup for user ${userId} not due yet. Due in approx ${remainingTime / (1000 * 60 * 60)} hours.`);
         // Reschedule based on remaining time to align with the original schedule
        clearUserBackupTimer(userId); // Clear any existing full interval timer
        backupTimers[userId] = setTimeout(() => {
            console.log(`BackupService: Scheduled backup (after due check) triggered for user ${userId}.`);
            performBackup(userId);
            scheduleBackup(userId, frequency); // Full interval reschedule after this one
        }, remainingTime > 0 ? remainingTime : 1000); // Ensure positive timeout
        console.log(`BackupService: Backup for user ${userId} specifically scheduled for remaining time.`);

      } else {
         console.log(`BackupService: Backup for user ${userId} is overdue. Performing now.`);
      }
    }

    if (needsImmediateBackup) {
      console.log(`BackupService: Performing initial or overdue backup for user ${userId}.`);
      performBackup(userId);
    }
    // Always (re)schedule based on the full frequency from the last (or just performed) backup time.
    // The specific scheduling for remainingTime handles the "catch-up".
    // If needsImmediateBackup was true, performBackup sets a new last_backup_ts.
    // Then this scheduleBackup will schedule correctly from that new timestamp.
    // If needsImmediateBackup was false, the specific remainingTime timer is already set.
    // However, we need a consistent way to schedule.
    // Let's simplify: if immediate backup is needed, do it. Then always schedule normally.
    // The `scheduleBackup` function itself will use the *full* interval from "now".
    // The check for "due" is more about potentially running one *now* if overdue.

    // Revised logic:
    // If an immediate backup was done (either initial or overdue), it updated the last backup timestamp.
    // Now, schedule the *next* one from this point.
    // If no immediate backup was done because it wasn't due, the specific remainingTime timer is already set.
    // To avoid double scheduling if remainingTime timer was set:
    if (needsImmediateBackup) { // Only set a full schedule if we just backed up or it's the very first time.
        scheduleBackup(userId, frequency);
    } else {
        // If not immediate backup, ensure the specific remainingTime schedule is active.
        // The code above already sets a specific timer if not due.
        console.log(`BackupService: User ${userId} backup is not due, specific timer already set or will be.`);
    }


  } else {
    clearUserBackupTimer(userId);
  }
};

// Potentially, on app load, iterate through all users who have auto-backup enabled
// and call manageAutoBackup for them if settings are stored centrally or can be found.
// For now, this will be called when settings change or user logs in.

export const clearAllBackupTimers = () => {
  console.log("BackupService: Clearing ALL active backup timers.");
  for (const uid in backupTimers) {
    clearTimeout(backupTimers[uid]);
  }
  backupTimers = {}; // Reset the timers object
};

export const getBackupData = (userId) => {
  if (!userId) return null;
  const backupStorageKey = `${USER_BACKUP_DATA_KEY_PREFIX}${userId}`;
  const backupJson = localStorage.getItem(backupStorageKey);
  if (backupJson) {
    try {
      return JSON.parse(backupJson);
    } catch (e) {
      console.error("Error parsing backup data from localStorage", e);
      return null;
    }
  }
  return null;
};

// TODO: Add restoreBackup function if needed by UI
// export const restoreBackup = (userId, backupDataToRestore) => { ... }

export const restoreBackup = (userId, backupDataToRestore) => {
  if (!userId || !backupDataToRestore) {
    console.warn('BackupService: User ID and backup data are required to restore a backup.');
    return false;
  }

  console.log(`BackupService: Restoring backup for user ${userId}...`);
  
  try {
    // Validate backup data structure
    if (!backupDataToRestore.data || !backupDataToRestore.timestamp) {
      console.error('BackupService: Invalid backup data structure.');
      return false;
    }

    let restoredCount = 0;
    const { data } = backupDataToRestore;

    // Restore each data type
    DATA_KEYS_TO_BACKUP.forEach(baseKey => {
      if (data[baseKey]) {
        const userSpecificKey = getUserIdSpecificKey(baseKey, userId);
        try {
          localStorage.setItem(userSpecificKey, JSON.stringify(data[baseKey]));
          restoredCount++;
          console.log(`BackupService: Restored ${baseKey} for user ${userId}`);
        } catch (error) {
          console.error(`BackupService: Error restoring ${baseKey} for user ${userId}:`, error);
        }
      }
    });

    if (restoredCount > 0) {
      console.log(`BackupService: Successfully restored ${restoredCount} data types for user ${userId}`);
      return true;
    } else {
      console.warn(`BackupService: No data was restored for user ${userId}`);
      return false;
    }
  } catch (error) {
    console.error(`BackupService: Error during backup restoration for user ${userId}:`, error);
    return false;
  }
};
