// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB8yfebZQjrlNQVLCJQIdQo5EryWzNmNQM",
  authDomain: "carbon-footprint-tracker-6c629.firebaseapp.com",
  projectId: "carbon-footprint-tracker-6c629",
  storageBucket: "carbon-footprint-tracker-6c629.firebasestorage.app",
  messagingSenderId: "403509523890",
  appId: "1:403509523890:web:7aa74fc1aa673e7043a0ab",
  measurementId: "G-5KEQEYNHZ8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);