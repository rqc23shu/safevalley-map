// firebase.js
// Firebase configuration and initialization for SafeValley Map

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace with your Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAQ2WDlm-C3b_pXujcaBRFC9mHbvWqbXbY",
  authDomain: "synoptic-d71d9.firebaseapp.com",
  projectId: "synoptic-d71d9",
  storageBucket: "synoptic-d71d9.firebasestorage.app",
  messagingSenderId: "317113970030",
  appId: "1:317113970030:web:c37a06cbf8a189845fe57f"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Export Firestore and Auth for use in the app
export { db, auth }; 