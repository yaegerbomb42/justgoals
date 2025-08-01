import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { geminiService } from '../../../services/geminiService';

const ApiKeySection = () => {
  const { user } = useAuth();
  const { settings, updateApiKey } = useSettings();
  const [apiKey, setApiKey] = useState(settings?.geminiApiKey || '');
  const [model, setModel] = useState('gemini-pro');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // null, 'success', 'error'
  const [message, setMessage] = useState('');

  // Load API key on mount and when settings change
  useEffect(() => {
    setApiKey(settings?.geminiApiKey || '');
    setIsLoading(false);
  }, [settings?.geminiApiKey]);

  const testConnection = async (keyToTest = null) => {
    const testKey = keyToTest || apiKey;
    if (!testKey?.trim()) {
      setConnectionStatus(null);
      setMessage('');
      return;
    }

    setIsTestingConnection(true);
    try {
      const result = await geminiService.testConnection(testKey);
      if (result.success) {
        setConnectionStatus('success');
        setMessage('Connected successfully!');
      } else {
        setConnectionStatus('error');
        setMessage(result.message || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setMessage(error.message || 'Connection failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleApiKeyChange = async (value) => {
    setApiKey(value);
    setConnectionStatus(null);
    setMessage('');
    updateApiKey(value);
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
    geminiService.setModel(e.target.value);
  };

  const handleSave = async () => {
    if (!apiKey?.trim()) {
      setMessage('API key cannot be empty.');
      setConnectionStatus('error');
      return;
    }

    try {
      await geminiService.initialize(apiKey, model);
      setMessage('API key saved and Gemini initialized successfully!');
      setConnectionStatus('success');
    } catch (error) {
      setMessage(`Failed to initialize Gemini: ${error.message}`);
      setConnectionStatus('error');
    }
  };

  const handleTestConnection = () => {
    setMessage('');
    setConnectionStatus(null);
    testConnection();
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
          <p className="text-sm text-text-secondary">Configure your Google Gemini API key to enable AI-powered features like Drift assistant and intelligent daily planning</p>
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
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="pr-12"
              disabled={isLoading}
              aria-label="Gemini API Key"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors duration-fast"
              aria-label={showKey ? "Hide API Key" : "Show API Key"}
            >
              <Icon name={showKey ? "EyeOff" : "Eye"} size={16} />
            </button>
          </div>
          
          {/* Why API Key is Needed */}
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="text-sm font-medium text-primary mb-2">Why is this API key needed?</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              The Gemini API key powers all AI features in JustGoals, including the Drift assistant, 
              intelligent daily planning, and personalized goal insights. Without it, you can still use 
              basic goal tracking and focus mode, but AI-powered features won't work.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!apiKey?.trim() || isTestingConnection}
            loading={isTestingConnection}
            iconName="Zap"
            iconPosition="left"
            aria-label="Test Gemini API Connection"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Button>

          {connectionStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 text-success"
              role="status"
              aria-live="polite"
            >
              <Icon name="CheckCircle" size={16} />
              <span className="text-sm font-caption">Connected</span>
            </motion.div>
          )}
          {connectionStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 text-error"
              role="status"
              aria-live="polite"
            >
              <Icon name="AlertCircle" size={16} />
              <span className="text-sm font-caption">Connection Failed</span>
            </motion.div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            connectionStatus === 'success' 
              ? 'bg-success/10 border border-success/20 text-success' 
              : 'bg-error/10 border border-error/20 text-error'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-heading-medium text-text-primary mb-2">What Drift can do:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Icon name="Target" size={12} className="text-primary" />
              <span className="text-text-secondary">Personalized goal strategies</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Calendar" size={12} className="text-accent" />
              <span className="text-text-secondary">Smart daily planning</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="MessageCircle" size={12} className="text-secondary" />
              <span className="text-text-secondary">Intelligent chat assistance</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="TrendingUp" size={12} className="text-success" />
              <span className="text-text-secondary">Progress insights</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ApiKeySection;