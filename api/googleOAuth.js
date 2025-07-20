import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'OAuth credentials not configured' });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Google OAuth error:', errorData);
      return res.status(400).json({ error: 'Failed to exchange authorization code' });
    }

    const tokenData = await tokenResponse.json();

    // Return the tokens to the client
    res.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      id_token: tokenData.id_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
    });

  } catch (error) {
    console.error('OAuth handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 