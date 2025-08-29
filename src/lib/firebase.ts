// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaveiUs-lAJ5FviUX6NDpFDplOR8aEEOA",
  authDomain: "projectdemo-test.firebaseapp.com",
  projectId: "projectdemo-test",
  storageBucket: "projectdemo-test.firebasestorage.app",
  messagingSenderId: "78974368021",
  appId: "1:78974368021:web:9b6ccce9aaf088cbe1111c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
// Ensure auth session persists across page reloads
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Non-fatal: fall back to default persistence if unavailable
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Mock user for development
export const mockUser = {
  id: 'mock-user-id',
  email: 'demo@example.com'
};

export default app;
