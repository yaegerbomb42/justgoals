import React, { createContext, useState, useEffect, useContext } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { clearAllBackupTimers } from '../services/backupService';
import { auth, googleProvider } from '../services/firebaseClient';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import firestoreService from '../services/firestoreService';
import integrationService from '../services/integrationService';
import dailyActivityService from '../services/dailyActivityService';

const AuthContext = createContext(null);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "512069824767-99a7kv1b516d46o5en5ifjuhiim66dei.apps.googleusercontent.com";

export const AuthProviderComponent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Use Firebase Auth user with full metadata
        const userData = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          picture: firebaseUser.photoURL || undefined,
          photoURL: firebaseUser.photoURL,
          isGoogleUser: firebaseUser.providerData.some(p => p.providerId === 'google.com'),
          metadata: firebaseUser.metadata, // Include full Firebase metadata
          providerData: firebaseUser.providerData,
        };
        setUser(userData);
        
        // Track daily activity when user logs in or app loads
        dailyActivityService.trackDailyActivity(userData.id);
        
        // Sync data from Firestore to localStorage for offline fallback
        if (userData && userData.id) {
          firestoreService.robustSyncUserData(userData.id)
            .then(() => console.log('Robust user data sync complete'))
            .catch(error => console.error('Robust user data sync failed:', error));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will update user
    // After login, initialize user data if needed
    const user = auth.currentUser;
    if (user) {
      const userDoc = await firestoreService.getUserDoc(user.uid);
      if (!userDoc) {
        await firestoreService.initializeUserData(user.uid);
      }
    }
  };

  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Optionally update profile with name
    if (userCredential.user && name) {
      await userCredential.user.updateProfile({ displayName: name });
    }
    // onAuthStateChanged will update user
    // After signup, initialize user data
    if (userCredential.user) {
      await firestoreService.initializeUserData(userCredential.user.uid);
    }
  };

  const logout = async () => {
    await signOut(auth);
    integrationService.cleanup();
    clearAllBackupTimers();
    setUser(null);
  };

  const handleGoogleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged will update user
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    signup,
    handleGoogleSignIn,
    isGoogleClientConfigured: true,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }) => {
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};