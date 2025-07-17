import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      await login({ email, password });
      navigate('/goals-dashboard');
    } catch (err) {
      setError('Invalid email or password.');
    }
  };

  const onGoogleLogin = async () => {
    try {
      await handleGoogleSignIn();
      navigate('/goals-dashboard');
    } catch (err) {
      setError('Google Sign-In failed. Please try again or use email/password.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-xl border border-border shadow-xl p-8">
        <div className="text-center mb-8">
          <Icon name="Zap" size={48} className="text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-heading-bold text-text-primary">Welcome Back</h1>
          <p className="text-text-secondary">Sign in to continue your journey with Drift.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-body-medium text-text-primary mb-1">Email Address</label>
            <Input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-body-medium text-text-primary mb-1">Password</label>
            <Input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              required
            />
          </div>

          {error && <p className="text-sm text-error text-center">{error}</p>}

          <Button type="submit" variant="primary" className="w-full py-3 text-base" iconName="LogIn" iconPosition="left">
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-text-secondary">Or continue with</span>
          </div>
        </div>

        {isGoogleClientConfigured ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              className="w-full py-3 text-base"
              iconName="Google"
              onClick={onGoogleLogin}
            >
              Sign In with Google
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full py-3 text-base" iconName="Google" disabled>
            Sign In with Google (Not Configured)
          </Button>
        )}

        <p className="mt-8 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="font-body-medium text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
