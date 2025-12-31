import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';

const LoginPage = () => {
  const navigate = useNavigate();
  const {
    login,
    handleGoogleSignIn,
    isGoogleClientConfigured
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/goals-dashboard');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await handleGoogleSignIn();
      navigate('/goals-dashboard');
    } catch (err) {
      setError('Google Sign-In failed. Please try again or use email/password.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: 'Target', text: 'Set and track meaningful goals' },
    { icon: 'Sparkles', text: 'AI-powered insights with Drift' },
    { icon: 'TrendingUp', text: 'Visualize your progress' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/30 to-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-accent/30 to-primary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-xl">
                <Icon name="Target" size={28} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-text-primary">
                Just<span className="gradient-text">Goals</span>
              </h1>
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-bold text-text-primary mb-4 leading-tight">
              Turn your dreams<br />
              into <span className="gradient-text">achievements</span>
            </h2>
            
            <p className="text-lg text-text-secondary mb-8 max-w-md">
              Your personal AI companion for goal setting, habit building, and continuous growth.
            </p>
            
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-surface-700/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/30">
                    <Icon name={feature.icon} size={20} className="text-primary" />
                  </div>
                  <span className="text-text-secondary">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <Icon name="Target" size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                Just<span className="gradient-text">Goals</span>
              </h1>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
              <p className="text-text-secondary">Sign in to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon="Mail"
                required
              />
              
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon="Lock"
                required
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-error/10 border border-error/30 rounded-xl flex items-center space-x-2"
                >
                  <Icon name="AlertCircle" size={16} className="text-error" />
                  <span className="text-sm text-error">{error}</span>
                </motion.div>
              )}

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                size="lg"
                loading={isLoading}
                iconName="LogIn" 
                iconPosition="right"
                glow
              >
                Sign In
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-surface text-sm text-text-muted">or continue with</span>
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              size="lg"
              onClick={onGoogleLogin}
              disabled={!isGoogleClientConfigured || isLoading}
              className="mb-6"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isGoogleClientConfigured ? 'Continue with Google' : 'Google (Not Configured)'}
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
