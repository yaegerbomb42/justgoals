import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';
import * as backupService from '../../../services/backupService';
import { useAchievements } from '../../../context/AchievementContext';

const DataManagementSection = ({ 
  autoBackup, 
  onAutoBackupChange, 
  backupFrequency, 
  onBackupFrequencyChange, 
  onExportData, 
  onImportData, 
  onResetAllData 
}) => {
  const { user } = useAuth();
  const { lastSync } = useAchievements() || {};
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const backupFrequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleAutoBackupChange = (value) => {
    onAutoBackupChange(value);
  };

  const handleBackupFrequencyChange = (value) => {
    onBackupFrequencyChange(value);
  };

  const handleExportData = async () => {
    if (!user || !user.id) {
      console.error('No user found for data export');
      return;
    }

    setIsExporting(true);
    try {
      // Get all user data
      const userData = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        goals: JSON.parse(localStorage.getItem(`goals_data_${user.id}`) || '[]'),
        milestones: JSON.parse(localStorage.getItem(`milestones_data_${user.id}`) || '[]'),
        journalEntries: JSON.parse(localStorage.getItem(`journal_entries_${user.id}`) || '[]'),
        focusSessionStats: JSON.parse(localStorage.getItem(`focus_session_stats_${user.id}`) || '{}'),
        focusSessionHistory: JSON.parse(localStorage.getItem(`focus_session_history_${user.id}`) || '[]'),
        appSettings: JSON.parse(localStorage.getItem(`app_settings_${user.id}`) || '{}')
      };

      // Create and download file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `yaeger-goals-backup-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Data export completed successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file || !user || !user.id) {
      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent);

      // Validate imported data structure
      if (!importedData.userId || !importedData.exportDate) {
        throw new Error('Invalid backup file format');
      }

      // Confirm import with user
      const confirmed = window.confirm(
        `This will replace your current data with the backup from ${new Date(importedData.exportDate).toLocaleDateString()}. This action cannot be undone. Continue?`
      );

      if (!confirmed) {
        return;
      }

      // Import data
      if (importedData.goals) {
        localStorage.setItem(`goals_data_${user.id}`, JSON.stringify(importedData.goals));
      }
      if (importedData.milestones) {
        localStorage.setItem(`milestones_data_${user.id}`, JSON.stringify(importedData.milestones));
      }
      if (importedData.journalEntries) {
        localStorage.setItem(`journal_entries_${user.id}`, JSON.stringify(importedData.journalEntries));
      }
      if (importedData.focusSessionStats) {
        localStorage.setItem(`focus_session_stats_${user.id}`, JSON.stringify(importedData.focusSessionStats));
      }
      if (importedData.focusSessionHistory) {
        localStorage.setItem(`focus_session_history_${user.id}`, JSON.stringify(importedData.focusSessionHistory));
      }
      if (importedData.appSettings) {
        localStorage.setItem(`app_settings_${user.id}`, JSON.stringify(importedData.appSettings));
      }

      console.log('Data import completed successfully');
      window.location.reload(); // Refresh to show imported data
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError('Failed to import data. Please check that the file is a valid backup.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleResetData = () => {
    onResetAllData();
    setShowResetConfirmation(false);
  };

  const handleFileImport = (event) => {
    handleImportData(event);
  };

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center">
          <Icon name="Database" size={16} color="#FFFFFF" />
        </div>
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary">Data Management</h3>
          <p className="text-sm text-text-secondary">Backup, export, and manage your goal data</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Auto Backup */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm font-body-medium text-text-primary">
                Automatic Backup
              </label>
              <p className="text-xs text-text-secondary">
                Automatically backup your data to local storage
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => handleAutoBackupChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-surface-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {autoBackup && (
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Backup Frequency
              </label>
              <select
                value={backupFrequency}
                onChange={(e) => handleBackupFrequencyChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {backupFrequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Data Export/Import */}
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Data Export & Import</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleExportData}
              loading={isExporting}
              iconName="Download"
              iconPosition="left"
              fullWidth
            >
              Export Data
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                iconName="Upload"
                iconPosition="left"
                fullWidth
                loading={isImporting}
              >
                Import Data
              </Button>
            </div>
          </div>
          {importError && (
            <p className="text-xs text-error mt-2">{importError}</p>
          )}
          <p className="text-xs text-text-secondary mt-2">
            Export your data as JSON or import from a previous backup
          </p>
          <div className="text-xs text-text-secondary mt-2">
            Last synced: {lastSync ? lastSync.toLocaleString() : 'Never synced'}
          </div>
        </div>

        {/* Reset Data */}
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Reset Data</h4>
          {!showResetConfirmation ? (
            <Button
              variant="danger"
              onClick={() => setShowResetConfirmation(true)}
              iconName="Trash2"
              iconPosition="left"
            >
              Reset All Data
            </Button>
          ) : (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-4">
                <Icon name="AlertTriangle" size={20} color="#EF4444" />
                <div>
                  <h5 className="text-sm font-body-medium text-error mb-1">Confirm Data Reset</h5>
                  <p className="text-xs text-text-secondary">
                    This action will permanently delete all your goals, milestones, journal entries, and settings. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleResetData}
                  iconName="Trash2"
                  iconPosition="left"
                >
                  Yes, Reset Everything
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirmation(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-heading-medium text-text-primary mb-2">Data Security</h4>
          <ul className="text-xs text-text-secondary space-y-1 font-caption">
            <li>• All data is stored locally on your device</li>
            <li>• Regular backups help prevent data loss</li>
            <li>• Export your data before major updates</li>
            <li>• Imported data will merge with existing data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataManagementSection;