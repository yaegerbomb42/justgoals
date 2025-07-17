import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics'; // Uncomment if you want analytics

const firebaseConfig = {
  apiKey: "AIzaSyCUt6MbCZwcfP4AdZM1aw1fBRZwDzmosGE",
  authDomain: "goals-d50ab.firebaseapp.com",
  projectId: "goals-d50ab",
  storageBucket: "goals-d50ab.appspot.com",
  messagingSenderId: "512069824767",
  appId: "1:512069824767:web:4fd135b98c5e8c89789cca",
  // measurementId: "G-HRJZYXY3ME" // Uncomment if you want analytics
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account', scope: 'email profile' });
// const analytics = getAnalytics(app); // Uncomment if you want analytics

export { app, auth, firestore, googleProvider }; 