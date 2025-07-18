// Calendar sync service for two-way integration with Google Calendar

class CalendarSyncService {
  constructor() {
    this.googleCalendarApi = 'https://www.googleapis.com/calendar/v3';
    this.syncSettings = {
      enabled: false,
      calendarId: 'primary',
      syncDirection: 'both', // 'both', 'to_calendar', 'from_calendar'
      autoSync: true,
      syncInterval: 15, // minutes
      includeCompleted: false,
      includeMilestones: true,
      includeFocusSessions: false,
      defaultEventDuration: 60 // minutes
    };
    
    this.syncHistory = [];
    this.lastSyncTime = null;
  }

  // Initialize calendar sync
  async initialize(userId) {
    if (!userId) return false;

    try {
      // Load sync settings
      await this.loadSettings(userId);
      
      // Check if Google Calendar API is available
      if (this.syncSettings.enabled) {
        const isAuthorized = await this.checkGoogleAuth();
        if (!isAuthorized) {
          console.log('Google Calendar not authorized');
          return false;
        }
        
        // Start auto-sync if enabled
        if (this.syncSettings.autoSync) {
          this.startAutoSync(userId);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing calendar sync:', error);
      return false;
    }
  }

  // Load sync settings
  async loadSettings(userId) {
    if (!userId) return;

    try {
      const firestoreService = (await import('./firestoreService')).default;
      
      try {
        const settings = await firestoreService.getCalendarSyncSettings(userId);
        this.syncSettings = { ...this.syncSettings, ...settings };
      } catch (error) {
        console.warn('Firestore calendar sync settings fetch failed, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const settingsKey = `calendar_sync_settings_${userId}`;
        const savedSettings = localStorage.getItem(settingsKey);
        if (savedSettings) {
          this.syncSettings = { ...this.syncSettings, ...JSON.parse(savedSettings) };
        }
      }
    } catch (error) {
      console.error('Error loading calendar sync settings:', error);
    }
  }

  // Save sync settings
  async saveSettings(userId, settings) {
    if (!userId) return false;

    try {
      const firestoreService = (await import('./firestoreService')).default;
      
      try {
        await firestoreService.saveCalendarSyncSettings(userId, settings);
      } catch (error) {
        console.warn('Firestore calendar sync settings save failed, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const settingsKey = `calendar_sync_settings_${userId}`;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
      }
      
      this.syncSettings = { ...this.syncSettings, ...settings };
      return true;
    } catch (error) {
      console.error('Error saving calendar sync settings:', error);
      return false;
    }
  }

  // Check Google Calendar authorization
  async checkGoogleAuth() {
    try {
      const token = await this.getGoogleAccessToken();
      if (!token) return false;

      // Test API call
      const response = await fetch(`${this.googleCalendarApi}/users/me/calendarList`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error checking Google Calendar auth:', error);
      return false;
    }
  }

  // Get Google access token (checks localStorage for demo, real app would use OAuth)
  async getGoogleAccessToken() {
    try {
      const token = localStorage.getItem('google_access_token');
      if (token) return token;
    } catch (e) {
      console.warn('CalendarSyncService: Failed to get Google access token:', e);
    }
    // In a real app, integrate with Google OAuth flow here
    return null;
  }

  // Start auto-sync
  startAutoSync(userId) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.syncCalendar(userId);
    }, this.syncSettings.syncInterval * 60 * 1000);
  }

  // Stop auto-sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Main sync function
  async syncCalendar(userId) {
    if (!userId || !this.syncSettings.enabled) return false;

    try {
      console.log('Starting calendar sync...');
      
      const userData = await this.getUserData(userId);
      if (!userData) return false;

      let syncResults = {
        toCalendar: { success: 0, failed: 0, events: [] },
        fromCalendar: { success: 0, failed: 0, events: [] }
      };

      // Sync to Google Calendar
      if (this.syncSettings.syncDirection === 'both' || this.syncSettings.syncDirection === 'to_calendar') {
        syncResults.toCalendar = await this.syncToGoogleCalendar(userId, userData);
      }

      // Sync from Google Calendar
      if (this.syncSettings.syncDirection === 'both' || this.syncSettings.syncDirection === 'from_calendar') {
        syncResults.fromCalendar = await this.syncFromGoogleCalendar(userId);
      }

      // Log sync results
      this.logSyncResult(userId, syncResults);
      
      // Update last sync time
      this.lastSyncTime = new Date().toISOString();
      
      console.log('Calendar sync completed:', syncResults);
      return true;
    } catch (error) {
      console.error('Error during calendar sync:', error);
      return false;
    }
  }

  // Sync app data to Google Calendar
  async syncToGoogleCalendar(userId, userData) {
    const results = { success: 0, failed: 0, events: [] };
    
    try {
      const token = await this.getGoogleAccessToken();
      if (!token) {
        throw new Error('No Google access token available');
      }

      // Convert milestones to calendar events
      if (this.syncSettings.includeMilestones) {
        const milestoneEvents = this.convertMilestonesToEvents(userData.milestones);
        
        for (const event of milestoneEvents) {
          try {
            const success = await this.createGoogleCalendarEvent(token, event);
            if (success) {
              results.success++;
              results.events.push(event);
            } else {
              results.failed++;
            }
          } catch (error) {
            console.error('Error creating milestone event:', error);
            results.failed++;
          }
        }
      }

      // Convert focus sessions to calendar events
      if (this.syncSettings.includeFocusSessions) {
        const focusEvents = this.convertFocusSessionsToEvents(userData.focusHistory);
        
        for (const event of focusEvents) {
          try {
            const success = await this.createGoogleCalendarEvent(token, event);
            if (success) {
              results.success++;
              results.events.push(event);
            } else {
              results.failed++;
            }
          } catch (error) {
            console.error('Error creating focus session event:', error);
            results.failed++;
          }
        }
      }

    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      results.failed++;
    }

    return results;
  }

  // Sync from Google Calendar to app
  async syncFromGoogleCalendar(userId) {
    const results = { success: 0, failed: 0, events: [] };
    
    try {
      const token = await this.getGoogleAccessToken();
      if (!token) {
        throw new Error('No Google access token available');
      }

      // Get events from Google Calendar
      const calendarEvents = await this.getGoogleCalendarEvents(token);
      
      // Convert calendar events to app data
      const convertedEvents = this.convertCalendarEventsToAppData(calendarEvents);
      
      // Save to app
      for (const event of convertedEvents) {
        try {
          const success = await this.saveEventToApp(userId, event);
          if (success) {
            results.success++;
            results.events.push(event);
          } else {
            results.failed++;
          }
        } catch (error) {
          console.error('Error saving calendar event to app:', error);
          results.failed++;
        }
      }

    } catch (error) {
      console.error('Error syncing from Google Calendar:', error);
      results.failed++;
    }

    return results;
  }

  // Convert milestones to calendar events
  convertMilestonesToEvents(milestones) {
    return milestones
      .filter(milestone => {
        if (!milestone.dueDate) return false;
        if (!this.syncSettings.includeCompleted && milestone.completed) return false;
        return true;
      })
      .map(milestone => ({
        summary: `🎯 ${milestone.title}`,
        description: milestone.description || `Milestone: ${milestone.title}`,
        start: {
          dateTime: new Date(milestone.dueDate).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(new Date(milestone.dueDate).getTime() + this.syncSettings.defaultEventDuration * 60 * 1000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        colorId: milestone.completed ? '9' : '4', // Green if completed, red if pending
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'email', minutes: 60 }
          ]
        },
        extendedProperties: {
          private: {
            source: 'drift_app',
            type: 'milestone',
            id: milestone.id
          }
        }
      }));
  }

  // Convert focus sessions to calendar events
  convertFocusSessionsToEvents(focusHistory) {
    return focusHistory
      .filter(session => session.elapsed > 0)
      .map(session => ({
        summary: `⏰ Focus Session${session.goal ? ` - ${session.goal.title}` : ''}`,
        description: `Focus session: ${Math.round(session.elapsed / (1000 * 60))} minutes${session.goal ? `\nGoal: ${session.goal.title}` : ''}`,
        start: {
          dateTime: new Date(session.startTime).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(session.startTime + session.elapsed).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        colorId: '2', // Blue for focus sessions
        extendedProperties: {
          private: {
            source: 'drift_app',
            type: 'focus_session',
            id: session.id
          }
        }
      }));
  }

  // Create Google Calendar event
  async createGoogleCalendarEvent(token, event) {
    try {
      const response = await fetch(`${this.googleCalendarApi}/calendars/${this.syncSettings.calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      return response.ok;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      return false;
    }
  }

  // Get events from Google Calendar
  async getGoogleCalendarEvents(token) {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${this.googleCalendarApi}/calendars/${this.syncSettings.calendarId}/events?` +
        `timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar events');
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error getting Google Calendar events:', error);
      return [];
    }
  }

  // Convert calendar events to app data
  convertCalendarEventsToAppData(calendarEvents) {
    return calendarEvents
      .filter(event => {
        // Filter out events created by the app
        return !event.extendedProperties?.private?.source === 'drift_app';
      })
      .map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        location: event.location,
        attendees: event.attendees?.map(a => a.email) || [],
        source: 'google_calendar'
      }));
  }

  // Save event to app
  async saveEventToApp(userId, event) {
    try {
      const firestoreService = (await import('./firestoreService')).default;
      
      // Save as a special type of milestone
      const milestoneData = {
        title: event.title,
        description: event.description,
        dueDate: event.startTime,
        completed: false,
        priority: 'medium',
        category: 'calendar',
        source: 'google_calendar',
        externalId: event.id
      };

      await firestoreService.saveMilestone(userId, milestoneData);
      return true;
    } catch (error) {
      console.error('Error saving event to app:', error);
      return false;
    }
  }

  // Get user data for sync
  async getUserData(userId) {
    if (!userId) return null;

    try {
      const firestoreService = (await import('./firestoreService')).default;
      
      try {
        const [milestones, focusHistory] = await Promise.all([
          firestoreService.getMilestones(userId),
          firestoreService.getFocusSessionHistory(userId)
        ]);

        return {
          milestones: milestones || [],
          focusHistory: focusHistory || []
        };
      } catch (error) {
        console.warn('Firestore user data fetch failed, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const milestonesKey = `milestones_data_${userId}`;
        const focusHistoryKey = `focus_session_history_${userId}`;

        return {
          milestones: JSON.parse(localStorage.getItem(milestonesKey) || '[]'),
          focusHistory: JSON.parse(localStorage.getItem(focusHistoryKey) || '[]')
        };
      }
    } catch (error) {
      console.error('Error getting user data for calendar sync:', error);
      return null;
    }
  }

  // Log sync result
  logSyncResult(userId, results) {
    const syncResult = {
      timestamp: new Date().toISOString(),
      userId,
      results,
      totalSuccess: results.toCalendar.success + results.fromCalendar.success,
      totalFailed: results.toCalendar.failed + results.fromCalendar.failed
    };

    this.syncHistory.push(syncResult);
    
    // Keep only last 50 sync results
    if (this.syncHistory.length > 50) {
      this.syncHistory.splice(0, this.syncHistory.length - 50);
    }

    // Save to localStorage
    const historyKey = `calendar_sync_history_${userId}`;
    localStorage.setItem(historyKey, JSON.stringify(this.syncHistory));
  }

  // Get sync history
  getSyncHistory(userId) {
    const historyKey = `calendar_sync_history_${userId}`;
    const history = localStorage.getItem(historyKey);
    return history ? JSON.parse(history) : [];
  }

  // Get sync status
  getSyncStatus() {
    return {
      enabled: this.syncSettings.enabled,
      lastSyncTime: this.lastSyncTime,
      autoSync: this.syncSettings.autoSync,
      syncDirection: this.syncSettings.syncDirection
    };
  }

  // Manual sync trigger
  async manualSync(userId) {
    console.log('Manual sync triggered');
    return await this.syncCalendar(userId);
  }

  // Disconnect calendar sync
  async disconnect(userId) {
    try {
      this.stopAutoSync();
      this.syncSettings.enabled = false;
      await this.saveSettings(userId, this.syncSettings);
      return true;
    } catch (error) {
      console.error('Error disconnecting calendar sync:', error);
      return false;
    }
  }
}

// Create singleton instance
const calendarSyncService = new CalendarSyncService();

export default calendarSyncService; 