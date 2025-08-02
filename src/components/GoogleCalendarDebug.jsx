import React, { useState, useEffect } from 'react';
import calendarSyncService from '../services/calendarSyncService';

const GoogleCalendarDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = () => {
    const info = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      hasClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientIdValid: import.meta.env.VITE_GOOGLE_CLIENT_ID?.includes('googleusercontent.com'),
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      hasApiKey: !!import.meta.env.VITE_GOOGLE_API_KEY,
      apiKeyValid: import.meta.env.VITE_GOOGLE_API_KEY?.startsWith('AIza'),
      redirectUri: window.location.origin + '/oauth2callback',
      currentUrl: window.location.href,
      userAgent: navigator.userAgent
    };
    
    setDebugInfo(info);
    console.log('Google Calendar Debug Info:', info);
  };

  const testOAuthUrl = () => {
    try {
      const redirectUri = window.location.origin + '/oauth2callback';
      const authUrl = calendarSyncService.getGoogleAuthUrl(redirectUri);
      console.log('OAuth URL generated successfully:', authUrl);
      setDebugInfo(prev => ({ ...prev, oauthUrl: authUrl, oauthUrlGenerated: true }));
    } catch (error) {
      console.error('OAuth URL generation failed:', error);
      setDebugInfo(prev => ({ ...prev, oauthError: error.message, oauthUrlGenerated: false }));
    }
  };

  const testTokenCheck = async () => {
    setIsLoading(true);
    try {
      const token = await calendarSyncService.getGoogleAccessToken();
      const isAuthorized = await calendarSyncService.checkGoogleAuth();
      
      setDebugInfo(prev => ({
        ...prev,
        hasToken: !!token,
        tokenPrefix: token?.substring(0, 20) + '...',
        isAuthorized,
        tokenCheckComplete: true
      }));
      
      console.log('Token check complete:', { hasToken: !!token, isAuthorized });
    } catch (error) {
      console.error('Token check failed:', error);
      setDebugInfo(prev => ({
        ...prev,
        tokenError: error.message,
        tokenCheckComplete: true
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('google_id_token');
    localStorage.removeItem('google_token_data');
    console.log('Tokens cleared');
    checkEnvironment();
  };

  return (
    <div className="p-6 bg-surface border border-border rounded-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-text-primary">Google Calendar Debug</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2 text-text-primary">Environment Variables</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Client ID: <span className={debugInfo.hasClientId ? 'text-success' : 'text-error'}>{debugInfo.hasClientId ? '✅ Set' : '❌ Missing'}</span></div>
            <div>Client ID Valid: <span className={debugInfo.clientIdValid ? 'text-success' : 'text-error'}>{debugInfo.clientIdValid ? '✅ Valid' : '❌ Invalid'}</span></div>
            <div>API Key: <span className={debugInfo.hasApiKey ? 'text-success' : 'text-error'}>{debugInfo.hasApiKey ? '✅ Set' : '❌ Missing'}</span></div>
            <div>API Key Valid: <span className={debugInfo.apiKeyValid ? 'text-success' : 'text-error'}>{debugInfo.apiKeyValid ? '✅ Valid' : '❌ Invalid'}</span></div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-text-primary">OAuth Configuration</h3>
          <div className="space-y-2 text-sm">
            <div>Redirect URI: <code className="bg-surface-700 px-2 py-1 rounded">{debugInfo.redirectUri}</code></div>
            <div>Current URL: <code className="bg-surface-700 px-2 py-1 rounded">{debugInfo.currentUrl}</code></div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-text-primary">Token Status</h3>
          <div className="space-y-2 text-sm">
            <div>Has Token: <span className={debugInfo.hasToken ? 'text-success' : 'text-warning'}>{debugInfo.hasToken ? '✅ Yes' : '❌ No'}</span></div>
            {debugInfo.hasToken && <div>Token: <code className="bg-surface-700 px-2 py-1 rounded">{debugInfo.tokenPrefix}</code></div>}
            <div>Authorized: <span className={debugInfo.isAuthorized ? 'text-success' : 'text-warning'}>{debugInfo.isAuthorized ? '✅ Yes' : '❌ No'}</span></div>
          </div>
        </div>

        {debugInfo.oauthError && (
          <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm">
            OAuth Error: {debugInfo.oauthError}
          </div>
        )}

        {debugInfo.tokenError && (
          <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm">
            Token Error: {debugInfo.tokenError}
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={testOAuthUrl}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600 transition-colors"
          >
            Test OAuth URL
          </button>
          
          <button
            onClick={testTokenCheck}
            disabled={isLoading}
            className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Check Tokens'}
          </button>
          
          <button
            onClick={clearTokens}
            className="px-4 py-2 bg-error text-white rounded hover:bg-error-600 transition-colors"
          >
            Clear Tokens
          </button>
          
          <button
            onClick={checkEnvironment}
            className="px-4 py-2 bg-surface-700 text-text-primary rounded hover:bg-surface-600 transition-colors"
          >
            Refresh
          </button>
        </div>

        {debugInfo.oauthUrl && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-text-primary">Generated OAuth URL</h3>
            <div className="p-3 bg-surface-700 rounded text-xs break-all">
              {debugInfo.oauthUrl}
            </div>
            <button
              onClick={() => window.open(debugInfo.oauthUrl, '_blank')}
              className="mt-2 px-4 py-2 bg-success text-white rounded hover:bg-success-600 transition-colors"
            >
              Open OAuth URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarDebug; 