import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Firebase configuration for AnxieEase sensors project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: "anxieease-sensors.firebaseapp.com",
  databaseURL: "https://anxieease-sensors-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "anxieease-sensors",
  storageBucket: "anxieease-sensors.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id"
};

// Initialize Firebase
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  
  // Connect to emulator in development if environment variable is set
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true') {
    try {
      connectDatabaseEmulator(database, 'localhost', 9000);
      console.log('Connected to Firebase Database Emulator');
    } catch (error) {
      console.log('Firebase emulator connection failed:', error.message);
    }
  }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  
  // Create mock database object for development
  database = {
    ref: () => ({
      on: () => {},
      off: () => {},
      once: () => Promise.resolve({ val: () => null }),
      set: () => Promise.resolve(),
      push: () => Promise.resolve({ key: 'mock-key' }),
      remove: () => Promise.resolve(),
      update: () => Promise.resolve()
    })
  };
}

export { app, database };
export default firebaseConfig;