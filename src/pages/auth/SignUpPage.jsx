import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';

const SignUpPage = () => {
  const navigate = useNavigate();
  const {
    signup,
    handleGoogleSignIn,
    isGoogleClientConfigured
  } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    try {
      await signup(email, password, name);
      navigate('/goals-dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign up. Please try again.');
    }
  };

  const onGoogleLogin = async () => {
    try {
      await handleGoogleSignIn();
      navigate('/goals-dashboard');
    } catch (err) {
      setError('Google Sign-Up failed. Please try again or use email/password.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-xl border border-border shadow-xl p-8">
        <div className="text-center mb-8">
          <Icon name="UserPlus" size={48} className="text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-heading-bold text-text-primary">Create Your Account</h1>
          <p className="text-text-secondary">Join Drift and start achieving your goals.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-body-medium text-text-primary mb-1">Full Name</label>
            <Input
              type="text"
              id="name"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              required
            />
          </div>
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
              placeholder="Create a strong password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-body-medium text-text-primary mb-1">Confirm Password</label>
            <Input
              type="password"
              id="confirmPassword"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full"
              required
            />
          </div>

          {error && <p className="text-sm text-error text-center">{error}</p>}

          <Button type="submit" variant="primary" className="w-full py-3 text-base" iconName="UserPlus" iconPosition="left">
            Create Account
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-text-secondary">Or sign up with</span>
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
              Sign Up with Google
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full py-3 text-base" iconName="Google" disabled>
            Sign Up with Google (Not Configured)
          </Button>
        )}

        <p className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-body-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
