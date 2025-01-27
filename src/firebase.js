import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Import Realtime Database

const firebaseConfig = {
    apiKey: "AIzaSyC2MyuCuwK1RhNByof6-EaTliPP9N00GIs",
    authDomain: "carpooling-c05f1.firebaseapp.com",
    projectId: "carpooling-c05f1",
    storageBucket: "carpooling-c05f1.appspot.com", // Corrected storageBucket
    messagingSenderId: "739968647263",
    appId: "1:739968647263:web:a2b32efc22d0beb75ddbea",
    measurementId: "G-MZ8G0PNQMX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);       // For authentication
export const db = getDatabase(app);    // For Realtime Database
