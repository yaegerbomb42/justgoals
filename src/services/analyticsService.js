// Enhanced analytics service for productivity insights

import { firestore } from './firebaseClient';
import { getAuth } from 'firebase/auth';

const getUserAnalytics = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return {};
  const docRef = firestore.collection('users').doc(user.uid).collection('analytics').doc('dashboard');
  const doc = await docRef.get();
  if (!doc.exists) return {};
  return doc.data();
};

export default {
  getUserAnalytics,
}; 