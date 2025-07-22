import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';

const ProfileSection = () => {
  const { user, updateUserProfile } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Initialize from user data or settings
    if (user?.displayName) {
      setDisplayName(user.displayName);
    } else if (settings?.profile?.displayName) {
      setDisplayName(settings.profile.displayName);
    } else {
      // Extract name from email if available
      const emailName = user?.email?.split('@')[0];
      if (emailName) {
        setDisplayName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      }
    }
  }, [user, settings]);

  const handleSave = async () => {
    if (!displayName.trim()) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Save to settings context
      await updateSettings({
        ...settings,
        profile: {
          ...settings.profile,
          displayName: displayName.trim()
        }
      });

      // Also try to update Firebase Auth profile if possible
      if (updateUserProfile) {
        try {
          await updateUserProfile({ displayName: displayName.trim() });
        } catch (authError) {
          console.log('Auth profile update failed, but settings saved:', authError);
        }
      }

      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage('Error saving profile. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayInitial = () => {
    if (displayName) return displayName[0].toUpperCase();
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return '?';
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Icon name="User" className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold text-text-primary">Profile Settings</h2>
      </div>
      
      <div className="space-y-6">
        {/* Profile Preview */}
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
              {getDisplayInitial()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {displayName || user?.displayName || 'User'}
              </h3>
              <p className="text-sm text-text-secondary">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Display Name Setting */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Display Name
          </label>
          <p className="text-xs text-text-secondary mb-3">
            This name will appear in your profile and throughout the app instead of "User".
          </p>
          <div className="flex space-x-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              maxLength={50}
            />
            <Button
              onClick={handleSave}
              disabled={isSaving || !displayName.trim() || displayName.trim() === (user?.displayName || settings?.profile?.displayName)}
              variant="default"
              size="md"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="Save" className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
          
          {saveMessage && (
            <div className={`mt-2 text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-text-secondary">Email:</span>
              <span className="text-sm text-text-primary">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-text-secondary">User ID:</span>
              <span className="text-xs text-text-secondary font-mono">{user?.uid?.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-text-secondary">Account Created:</span>
              <span className="text-sm text-text-primary">
                {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
