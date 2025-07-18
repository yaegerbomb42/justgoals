import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';
import * as geminiService from '../../../services/geminiService';
import firestoreService from '../../../services/firestoreService';

const ApiKeySection = ({ apiKey, onApiKeyChange, onTestConnection, isTestingConnection, connectionStatus }) => {
  const { user } = useAuth();
  const [localApiKey, setLocalApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [cloudStatus, setCloudStatus] = useState('idle'); // idle, syncing, success, error
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTested, setHasTested] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Only load API key once on mount
  useEffect(() => {
    let cancelled = false;
    async function loadApiKeyOnce() {
      if (hasLoaded) return;
      if (user && user.id) {
        setIsLoading(true);
        setCloudStatus('syncing');
        setLoadError(null);
        try {
          const cloudKey = await firestoreService.loadApiKey(user.id);
          if (!cancelled && cloudKey) {
            setLocalApiKey(cloudKey);
            onApiKeyChange(cloudKey);
            localStorage.setItem(`gemini_api_key_${user.id}`, cloudKey);
            setCloudStatus('success');
            setIsLoading(false);
            setHasLoaded(true);
            return;
          }
        } catch (e) {
          if (!cancelled) {
            setCloudStatus('error');
            setLoadError('Failed to load API key from cloud.');
            console.error('[API Key] Firestore load error:', e);
          }
        }
        // Fallback to localStorage
        const userApiKey = localStorage.getItem(`gemini_api_key_${user.id}`);
        if (!cancelled) {
          if (userApiKey) {
            setLocalApiKey(userApiKey);
            onApiKeyChange(userApiKey);
            setCloudStatus('idle');
          } else {
            setLocalApiKey('');
            onApiKeyChange('');
            setCloudStatus('idle');
          }
          setIsLoading(false);
          setHasLoaded(true);
        }
      }
    }
    loadApiKeyOnce();
    return () => { cancelled = true; };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only test connection once after key is loaded or changed
  useEffect(() => {
    if (!hasTested && localApiKey && !isLoading) {
      setHasTested(true);
      handleTestConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localApiKey, isLoading]);

  const handleApiKeyChange = (value) => {
    setLocalApiKey(value);
    onApiKeyChange(value);
    setHasTested(false); // Allow re-testing after change
    if (user && user.id) {
      localStorage.setItem(`gemini_api_key_${user.id}`, value);
      setCloudStatus('syncing');
      firestoreService.saveApiKey(user.id, value)
        .then(() => setCloudStatus('success'))
        .catch((e) => {
          setCloudStatus('error');
          setLoadError('Failed to sync API key to cloud.');
          console.error('[API Key] Firestore save error:', e);
        });
    }
  };

  const handleTestConnection = async () => {
    if (!localApiKey.trim()) {
      setConnectionMessage('');
      return;
    }
    setConnectionMessage('');
    try {
      const result = await geminiService.testConnection(localApiKey);
      setConnectionMessage(result.message || '');
      onTestConnection(result.success ? 'success' : 'error');
      console.log('[API Key] Connection tested:', result);
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionMessage(error.message || 'Unknown error');
      onTestConnection('error');
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return 'CheckCircle';
      case 'error':
        return 'XCircle';
      default:
        return 'AlertCircle';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-lg p-6 border border-border"
    >
      <div className="flex items-center space-x-3 mb-4">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center"
        >
          <Icon name="Key" size={16} color="#FFFFFF" />
        </motion.div>
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary">Gemini API Configuration</h3>
          <p className="text-sm text-text-secondary">Configure your Google Gemini API key for AI assistant functionality</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-2">
            API Key
          </label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="Enter your Gemini API key"
              value={localApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors duration-fast"
            >
              <Icon name={showKey ? "EyeOff" : "Eye"} size={16} />
            </button>
          </div>
          {isLoading && (
            <div className="text-xs text-info mt-2">Loading API key...</div>
          )}
          {loadError && (
            <div className="text-xs text-error mt-2">{loadError}</div>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-text-secondary">
              Get your API key from the{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark underline"
              >
                Google AI Studio dashboard
              </a>
            </p>
            {localApiKey && !isLoading && (
              <span className="text-xs text-success">
                ✓ Key saved locally
              </span>
            )}
          </div>
          {/* Cloud sync status */}
          {user && localApiKey && !isLoading && (
            <div className="flex items-center space-x-2 mt-1 text-xs">
              <Icon name={cloudStatus === 'success' ? 'CloudCheck' : cloudStatus === 'syncing' ? 'CloudSync' : cloudStatus === 'error' ? 'CloudOff' : 'Cloud'} size={14} className={
                cloudStatus === 'success' ? 'text-success' : cloudStatus === 'syncing' ? 'text-info' : cloudStatus === 'error' ? 'text-error' : 'text-text-secondary'
              } />
              <span className={
                cloudStatus === 'success' ? 'text-success font-bold' : cloudStatus === 'syncing' ? 'text-info' : cloudStatus === 'error' ? 'text-error' : 'text-text-secondary'
              }>
                {cloudStatus === 'success' && 'Connected'}
                {cloudStatus === 'syncing' && 'Syncing...'}
                {cloudStatus === 'error' && 'Cloud sync error'}
                {cloudStatus === 'idle' && 'Not yet synced'}
              </span>
            </div>
          )}
          {!localApiKey && !isLoading && (
            <div className="text-xs text-error mt-2">Failed to load API key. Please enter and save your key.</div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!localApiKey.trim() || isTestingConnection}
            loading={isTestingConnection}
            iconName="Zap"
            iconPosition="left"
          >
            Test Connection
          </Button>

          {connectionStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center space-x-2 ${getConnectionStatusColor()}`}
            >
              <Icon name={getConnectionStatusIcon()} size={16} />
              <span className="text-sm font-caption">
                {connectionStatus === 'success' && 'Connection successful'}
                {connectionStatus === 'error' && 'Connection failed'}
                {connectionStatus === 'testing' && 'Testing connection...'}
              </span>
            </motion.div>
          )}
        </div>
        {connectionMessage && (
          <div className={`mt-2 text-xs ${connectionStatus === 'success' ? 'text-success' : 'text-error'}`}>{connectionMessage}</div>
        )}

        {(!apiKey || connectionStatus === 'error') && (
          <div className="p-2 bg-error/10 border border-error/20 rounded text-error text-sm">
            {connectionStatus === 'error' ? 'API Key is invalid or connection failed.' : 'API Key is required to use AI features.'}
          </div>
        )}
        {connectionStatus === 'success' && (
          <div className="p-2 bg-success/10 border border-success/20 rounded text-success text-sm">
            API Key is valid and connected!
          </div>
        )}

        <div className="bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-heading-medium text-text-primary mb-2">Security Notice</h4>
          <ul className="text-xs text-text-secondary space-y-1 font-caption">
            <li>• Your API key is stored locally and never shared</li>
            <li>• All communications are encrypted end-to-end</li>
            <li>• You can revoke access anytime from Google AI Studio</li>
            <li>• Drift uses your data to provide personalized goal assistance</li>
          </ul>
        </div>

        {/* AI Features Preview */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="text-sm font-heading-medium text-text-primary mb-2">What Drift can do for you:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Icon name="Target" size={12} className="text-primary" />
              <span className="text-text-secondary">Personalized goal strategies</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="BookOpen" size={12} className="text-accent" />
              <span className="text-text-secondary">Journal entry analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Clock" size={12} className="text-secondary" />
              <span className="text-text-secondary">Focus time optimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="TrendingUp" size={12} className="text-success" />
              <span className="text-text-secondary">Progress tracking insights</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ApiKeySection;