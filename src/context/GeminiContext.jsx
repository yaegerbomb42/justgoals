import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import geminiService from '../services/geminiService';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key_global') || '';
    setApiKey(storedKey);
  }, []);

  // Whenever the key changes, re-initialize and test connection
  useEffect(() => {
    const checkConnection = async () => {
      if (apiKey) {
        try {
          geminiService.initialize(apiKey);
          const result = await geminiService.testConnection(apiKey);
          setIsConnected(result.success);
          setConnectionError(result.success ? '' : result.message || 'Connection failed');
          setIsInitialized(true);
        } catch (e) {
          setIsConnected(false);
          setConnectionError(e.message || 'Unknown error');
          setIsInitialized(true);
        }
      } else {
        setIsConnected(false);
        setConnectionError('No API key set');
        setIsInitialized(true);
      }
    };
    checkConnection();
  }, [apiKey]);

  // Set API key and persist to localStorage
  const updateApiKey = useCallback((key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key_global', key);
  }, []);

  // Reset all Gemini state
  const resetGemini = useCallback(() => {
    setApiKey('');
    setIsConnected(false);
    setConnectionError('');
    setIsInitialized(false);
    localStorage.removeItem('gemini_api_key_global');
    geminiService.isInitialized = false;
  }, []);

  return (
    <GeminiContext.Provider value={{ apiKey, isConnected, connectionError, isInitialized, setApiKey: updateApiKey, resetGemini }}>
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => {
  const context = useContext(GeminiContext);
  if (!context) {
    throw new Error('useGemini must be used within a GeminiProvider');
  }
  return context;
}; 