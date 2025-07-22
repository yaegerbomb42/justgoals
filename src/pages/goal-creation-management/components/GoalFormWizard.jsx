import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';
import { saveGoalCalendarEventId, getGoalCalendarEventId } from '../../../services/entityManagementService';

const GoalFormWizard = ({ onGoalSave, onStepChange, currentStep }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    customTags: [],
    targetDate: '',
    priority: 'medium',
    progressMode: 'auto',
    milestoneFrequency: 'weekly',
    timeTrackingEnabled: true,
    notificationsEnabled: true
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  const { user } = useAuth();
  const [googleAuthLoaded, setGoogleAuthLoaded] = useState(false);
  const [calendarList, setCalendarList] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [calendarSyncStatus, setCalendarSyncStatus] = useState('idle'); // idle, syncing, success, error
  const eventIdRef = useRef(null);
  const [calendarBanner, setCalendarBanner] = useState(null);

  const categories = [
    { id: 'career', name: 'Career & Professional', icon: 'Briefcase', color: '#6366F1' },
    { id: 'health', name: 'Health & Fitness', icon: 'Heart', color: '#10B981' },
    { id: 'education', name: 'Learning & Education', icon: 'BookOpen', color: '#8B5CF6' },
    { id: 'personal', name: 'Personal Development', icon: 'User', color: '#F59E0B' },
    { id: 'financial', name: 'Financial Goals', icon: 'DollarSign', color: '#EF4444' },
    { id: 'creative', name: 'Creative Projects', icon: 'Palette', color: '#EC4899' }
  ];

  const priorities = [
    { id: 'low', name: 'Low Priority', color: '#64748B' },
    { id: 'medium', name: 'Medium Priority', color: '#F59E0B' },
    { id: 'high', name: 'High Priority', color: '#EF4444' }
  ];

  const milestoneOptions = [
    { id: 'daily', name: 'Daily Check-ins' },
    { id: 'weekly', name: 'Weekly Milestones' },
    { id: 'biweekly', name: 'Bi-weekly Reviews' },
    { id: 'monthly', name: 'Monthly Targets' }
  ];

  const steps = [
    { id: 1, title: 'Basic Information', icon: 'FileText' },
    { id: 2, title: 'Category & Tags', icon: 'Tag' },
    { id: 3, title: 'Timeline & Priority', icon: 'Calendar' },
    { id: 4, title: 'Advanced Settings', icon: 'Settings' }
  ];

  // Load Google API
  useEffect(() => {
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          await window.gapi.client.init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly"
          });
          setGoogleAuthLoaded(true);
        });
      };
      document.body.appendChild(script);
    } else {
      setGoogleAuthLoaded(true);
    }
  }, []);

  // On mount, try to load eventId for this goal if editing
  useEffect(() => {
    if (user && formData.id) {
      getGoalCalendarEventId(user.id, formData.id).then(eventId => {
        if (eventId) eventIdRef.current = eventId;
      });
    }
  }, [user, formData.id]);

  // Fetch user's calendars
  const fetchCalendars = async () => {
    if (!window.gapi || !window.gapi.auth2) return;
    await window.gapi.auth2.getAuthInstance().signIn();
    const res = await window.gapi.client.calendar.calendarList.list();
    setCalendarList(res.result.items || []);
  };

  // Add or update event in Google Calendar
  const syncGoalToGoogleCalendar = async () => {
    setCalendarSyncStatus('syncing');
    try {
      await window.gapi.auth2.getAuthInstance().signIn();
      const event = {
        summary: formData.title,
        description: formData.description,
        start: { date: formData.targetDate },
        end: { date: formData.targetDate },
      };
      let response;
      if (eventIdRef.current) {
        // Update existing event
        response = await window.gapi.client.calendar.events.update({
          calendarId: selectedCalendar,
          eventId: eventIdRef.current,
          resource: event,
        });
      } else {
        // Create new event
        response = await window.gapi.client.calendar.events.insert({
          calendarId: selectedCalendar,
          resource: event,
        });
        eventIdRef.current = response.result.id;
        if (user && formData.id) {
          await saveGoalCalendarEventId(user.id, formData.id, eventIdRef.current);
        }
      }
      setCalendarSyncStatus('success');
      setCalendarBanner('Goal synced to Google Calendar!');
      window.open(response.result.htmlLink, '_blank');
    } catch (err) {
      setCalendarSyncStatus('error');
      setCalendarBanner('Google Calendar sync failed.');
      alert('Google Calendar sync failed: ' + (err.message || err));
    }
  };

  // Delete event from Google Calendar
  const deleteGoalFromGoogleCalendar = async () => {
    if (!eventIdRef.current) return;
    setCalendarSyncStatus('syncing');
    try {
      await window.gapi.auth2.getAuthInstance().signIn();
      await window.gapi.client.calendar.events.delete({
        calendarId: selectedCalendar,
        eventId: eventIdRef.current,
      });
      eventIdRef.current = null;
      if (user && formData.id) {
        await saveGoalCalendarEventId(user.id, formData.id, null);
      }
      setCalendarSyncStatus('success');
      setCalendarBanner('Event deleted from Google Calendar.');
      alert('Event deleted from Google Calendar.');
    } catch (err) {
      setCalendarSyncStatus('error');
      setCalendarBanner('Failed to delete event from Google Calendar.');
      alert('Failed to delete event: ' + (err.message || err));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.customTags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        customTags: [...prev.customTags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      customTags: prev.customTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Goal title is required';
        if (!formData.description.trim()) newErrors.description = 'Goal description is required';
        break;
      case 2:
        if (!formData.category) newErrors.category = 'Please select a category';
        break;
      case 3:
        if (!formData.targetDate) newErrors.targetDate = 'Target completion date is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    onStepChange(currentStep - 1);
  };

  const handleSave = () => {
    if (validateStep(currentStep)) {
      // Ensure goal starts with proper defaults and handle date properly
      const goalData = {
        ...formData,
        progress: 0, // Always start at 0 progress
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Handle targetDate properly in user's local timezone
        targetDate: formData.targetDate ? (() => {
          // Parse the date input as local date (YYYY-MM-DD)
          const localDate = new Date(formData.targetDate + 'T00:00:00');
          // Set to end of day in local timezone to avoid date shifting
          localDate.setHours(23, 59, 59, 999);
          return localDate.toISOString();
        })() : null,
        milestones: [],
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      onGoalSave(goalData);
    }
  };

  // Apple Calendar integration (ICS file)
  const downloadICS = () => {
    const title = formData.title || 'Goal';
    const description = formData.description || '';
    const date = formData.targetDate || new Date().toISOString().slice(0, 10);
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDESCRIPTION:${description}\nDTSTART;VALUE=DATE:${date.replace(/-/g, '')}\nDTEND;VALUE=DATE:${date.replace(/-/g, '')}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Goal Title *
              </label>
              <Input
                type="text"
                placeholder="Enter your goal title..."
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-error' : ''}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-error">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Goal Description *
              </label>
              <textarea
                placeholder="Describe your goal in detail..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 bg-surface border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-normal ${
                  errors.description ? 'border-error' : 'border-border'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error">{errors.description}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-3">
                Category *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleInputChange('category', category.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-normal text-left ${
                      formData.category === category.id
                        ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50 bg-surface'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <Icon name={category.icon} size={16} color="#FFFFFF" />
                      </div>
                      <span className="font-body-medium text-text-primary">
                        {category.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-error">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Custom Tags
              </label>
              <div className="flex space-x-2 mb-3">
                <Input
                  type="text"
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1"
                />
                <Button variant="outline" onClick={addTag} iconName="Plus">
                  Add
                </Button>
              </div>
              {formData.customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-error transition-colors duration-fast"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Target Completion Date *
              </label>
              <Input
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleInputChange('targetDate', e.target.value)}
                className={errors.targetDate ? 'border-error' : ''}
              />
              {errors.targetDate && (
                <p className="mt-1 text-sm text-error">{errors.targetDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-3">
                Priority Level
              </label>
              <div className="space-y-2">
                {priorities.map((priority) => (
                  <button
                    key={priority.id}
                    onClick={() => handleInputChange('priority', priority.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-normal text-left ${
                      formData.priority === priority.id
                        ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50 bg-surface'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: priority.color }}
                      />
                      <span className="font-body-medium text-text-primary">
                        {priority.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-3">
                Milestone Frequency
              </label>
              <div className="space-y-2">
                {milestoneOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleInputChange('milestoneFrequency', option.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-normal text-left ${
                      formData.milestoneFrequency === option.id
                        ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50 bg-surface'
                    }`}
                  >
                    <span className="font-body-medium text-text-primary">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-3">
                Progress Tracking Mode
              </label>
              <div className="space-y-3">
                <button
                  onClick={() => handleInputChange('progressMode', 'auto')}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-normal text-left ${
                    formData.progressMode === 'auto' ?'border-primary bg-primary/10' :'border-border hover:border-primary/50 bg-surface'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon name="Zap" size={20} color="#6366F1" />
                    <div>
                      <div className="font-body-medium text-text-primary">
                        Auto-determination via AI
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        Let Drift AI analyze your progress automatically
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleInputChange('progressMode', 'manual')}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-normal text-left ${
                    formData.progressMode === 'manual' ?'border-primary bg-primary/10' :'border-border hover:border-primary/50 bg-surface'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon name="User" size={20} color="#6366F1" />
                    <div>
                      <div className="font-body-medium text-text-primary">
                        Manual Control
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        Update progress manually as you complete tasks
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                <div>
                  <div className="font-body-medium text-text-primary">
                    Time Tracking
                  </div>
                  <div className="text-sm text-text-secondary">
                    Track time spent working on this goal
                  </div>
                </div>
                <button
                  onClick={() => handleInputChange('timeTrackingEnabled', !formData.timeTrackingEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-normal ${
                    formData.timeTrackingEnabled ? 'bg-primary' : 'bg-surface-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-normal ${
                      formData.timeTrackingEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                <div>
                  <div className="font-body-medium text-text-primary">
                    Notifications
                  </div>
                  <div className="text-sm text-text-secondary">
                    Receive reminders and progress updates
                  </div>
                </div>
                <button
                  onClick={() => handleInputChange('notificationsEnabled', !formData.notificationsEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-normal ${
                    formData.notificationsEnabled ? 'bg-primary' : 'bg-surface-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-normal ${
                      formData.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {googleAuthLoaded && (
                <>
                  <Button type="button" variant="secondary" onClick={fetchCalendars} aria-label="Fetch Google Calendars">Choose Google Calendar</Button>
                  {calendarList.length > 0 && (
                    <select value={selectedCalendar} onChange={e => setSelectedCalendar(e.target.value)} className="w-full p-2 rounded border mt-2">
                      {calendarList.map(cal => (
                        <option key={cal.id} value={cal.id}>{cal.summary}</option>
                      ))}
                    </select>
                  )}
                  <Button type="button" variant="secondary" onClick={syncGoalToGoogleCalendar} aria-label="Sync to Google Calendar">Sync to Google Calendar</Button>
                  {eventIdRef.current && (
                    <Button type="button" variant="danger" onClick={deleteGoalFromGoogleCalendar} aria-label="Remove from Google Calendar">Remove from Google Calendar</Button>
                  )}
                  {calendarSyncStatus === 'syncing' && <div className="text-xs text-info mt-1">Syncing...</div>}
                  {calendarSyncStatus === 'success' && <div className="text-xs text-success mt-1">Synced!</div>}
                  {calendarSyncStatus === 'error' && <div className="text-xs text-error mt-1">Sync Error</div>}
                </>
              )}
              {calendarBanner && (
                <div className={`p-2 rounded text-xs mb-2 ${calendarSyncStatus === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{calendarBanner}</div>
              )}
            </div>
            <div className="text-xs text-text-secondary mt-2">
              Use the buttons above to add this goal to your calendar. Google Calendar requires Google sign-in. Apple Calendar and others support .ics file import.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    if (calendarBanner) {
      const timeout = setTimeout(() => setCalendarBanner(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [calendarBanner]);

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-normal ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-600 text-text-secondary'
                }`}
              >
                {currentStep > step.id ? (
                  <Icon name="Check" size={16} />
                ) : (
                  <Icon name={step.icon} size={16} />
                )}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-body-medium text-text-primary">
                  {step.title}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors duration-normal ${
                  currentStep > step.id ? 'bg-primary' : 'bg-surface-600'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          iconName="ChevronLeft"
          iconPosition="left"
        >
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button
            variant="primary"
            onClick={handleNext}
            iconName="ChevronRight"
            iconPosition="right"
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSave}
            iconName="Save"
            iconPosition="left"
          >
            Save Goal
          </Button>
        )}
      </div>
    </div>
  );
};

export default GoalFormWizard;