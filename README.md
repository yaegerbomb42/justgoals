# JustGoals - AI Powered Goal Achievement Platform

A comprehensive web application for setting, tracking, and achieving personal goals with AI assistance.

## Features

- **AI-Powered Goal Management**: Create and track goals with intelligent insights
- **Daily Planning**: Generate personalized daily plans using AI
- **Focus Mode**: Distraction-free work sessions with timer
- **Habit Tracking**: Build and maintain positive habits with streak tracking
- **Journal & Reflection**: AI-assisted journaling and progress tracking
- **Analytics Dashboard**: Comprehensive insights into your progress
- **Achievement System**: Gamified progress tracking with badges
- **Drift AI Assistant**: Intelligent chat assistant for goal guidance

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd justgoals
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
   VITE_GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Google OAuth Setup (Optional)

To enable Google Calendar integration:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Calendar API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5173/oauth2callback` (for development)
     - `https://yourdomain.com/oauth2callback` (for production)

4. **Set Environment Variables**
   - Copy the Client ID and Client Secret to your `.env` file
   - The Client Secret is used in the Vercel serverless function

5. **Deploy OAuth Handler**
   - The OAuth token exchange is handled by `/api/googleOAuth.js`
   - Deploy this to Vercel or your preferred serverless platform

## API Keys Required

### Gemini API Key (Required for AI Features)
- **Purpose**: Powers all AI features including Drift assistant, daily planning, goal suggestions, and intelligent insights
- **Why it's needed**: The app uses Google's Gemini AI to provide personalized goal strategies, daily planning, and intelligent chat assistance
- **Get your API key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Cost**: Free tier available with generous limits

### Google OAuth (Optional - for Calendar Integration)
- **Purpose**: Enables two-way Google Calendar sync for the day planner
- **Why it's optional**: The app works perfectly without calendar integration
- **Setup**: See Google OAuth setup instructions above
- **Cost**: Free with Google Cloud Platform

## Why These APIs Are Needed

### Gemini AI (Required)
The app's core value comes from AI-powered features:
- **Drift Assistant**: Intelligent chat that helps with goal planning and motivation
- **Daily Planning**: AI generates personalized daily schedules based on your goals
- **Goal Insights**: AI analyzes your progress and suggests improvements
- **Smart Suggestions**: AI provides context-aware recommendations

Without the Gemini API key, these AI features won't work, but you can still use basic goal tracking and focus mode.

### Google Calendar (Optional)
- **Syncs your day planner events** to Google Calendar
- **Imports Google Calendar events** into your daily plan
- **Adds reminders** for your planned activities
- **Works with any Google account** - no special setup needed

## For Developers: Making Google Calendar Auth General

The Google Calendar integration is designed to work for any user:

1. **Single OAuth Setup**: One Google Cloud project handles all users
2. **User-Specific Tokens**: Each user gets their own access tokens
3. **No User Limits**: Works with unlimited users
4. **Automatic Setup**: Users just click "Link Google Calendar" and authorize

### Environment Variables for Production
```env
# Required for AI features
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional for Google Calendar (one setup for all users)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run electron` - Run Electron app
- `npm run package` - Package Electron app

### Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React context providers
├── pages/              # Page components
├── services/           # API and external service integrations
├── styles/             # Global styles and Tailwind config
└── utils/              # Utility functions
```

## Deployment

### Web Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Set up environment variables in your hosting platform

### Vercel Deployment

1. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Vite project

2. **Set up Environment Variables in Vercel**
   - In your Vercel project dashboard, go to "Settings" > "Environment Variables"
   - Add the following variables:
   
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
   VITE_GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
   ```
   
   - Set the environment to "Production" (and optionally "Preview" for testing)
   - Click "Save"

3. **Deploy the OAuth Handler**
   - The `/api/googleOAuth.js` file will be automatically deployed as a serverless function
   - Make sure your Google OAuth redirect URI includes your Vercel domain:
     - `https://your-project.vercel.app/oauth2callback`

4. **Update Google OAuth Settings**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" > "Credentials"
   - Edit your OAuth 2.0 Client ID
   - Add your Vercel domain to "Authorized redirect URIs":
     - `https://your-project.vercel.app/oauth2callback`

### Electron App
1. Run `npm run package` to create distributable
2. Find the packaged app in the `out` directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
