import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB8yfebZQjrlNQVLCJQIdQo5EryWzNmNQM",
    authDomain: "carbon-footprint-tracker-6c629.firebaseapp.com",
    projectId: "carbon-footprint-tracker-6c629",
    storageBucket: "carbon-footprint-tracker-6c629.firebasestorage.app",
    messagingSenderId: "403509523890",
    appId: "1:403509523890:web:7aa74fc1aa673e7043a0ab",
    measurementId: "G-5KEQEYNHZ8"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
