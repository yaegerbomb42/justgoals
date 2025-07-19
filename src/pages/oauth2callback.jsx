import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import calendarSyncService from '../services/calendarSyncService';
import Icon from '../components/AppIcon';

const Oauth2Callback = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Linking your Google Calendar...');
  const navigate = useNavigate();

  useEffect(() => {
    const doOAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const redirectUri = window.location.origin + '/oauth2callback';
      if (error) {
        setStatus('error');
        setMessage('Google Calendar authorization failed: ' + error);
        return;
      }
      if (!code) {
        setStatus('error');
        setMessage('No authorization code found in URL.');
        return;
      }
      try {
        setStatus('loading');
        setMessage('Exchanging code for tokens...');
        await calendarSyncService.handleOAuthCallback(code, redirectUri);
        setStatus('success');
        setMessage('Google Calendar linked successfully! Redirecting...');
        setTimeout(() => navigate('/day'), 2000);
      } catch (e) {
        setStatus('error');
        setMessage('Failed to link Google Calendar. Please try again.');
      }
    };
    doOAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Icon name={status === 'success' ? 'CheckCircle' : status === 'error' ? 'XCircle' : 'Loader'} className="w-16 h-16 mb-4 text-primary-500 animate-spin" />
      <h2 className="text-xl font-bold mb-2">Google Calendar Sync</h2>
      <p className="text-text-secondary text-center max-w-md">{message}</p>
    </div>
  );
};

export default Oauth2Callback; 