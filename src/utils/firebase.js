// Firebase configuration boilerplate
// Replace with your actual config from Firebase Console
export const firebaseConfig = {
  apiKey: "AIzaSyDfIuryf7nO5x1QXrDSbdIHigbRsnlLW0Y",
  authDomain: "monitoreodga-dcd21.firebaseapp.com",
  projectId: "monitoreodga-dcd21",
  storageBucket: "monitoreodga-dcd21.firebasestorage.app",
  messagingSenderId: "496564929095",
  appId: "1:496564929095:web:806fc1202d2dae34326762",
  measurementId: "G-5SNW23SV5Z"
};

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);

// Explicitly set persistent sessions to survive tab closures
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const googleProvider = new GoogleAuthProvider();

// Data Persistence Layer - Firebase Implementation
export const saveRecord = async (record) => {
    try {
        await addDoc(collection(db, "records"), {
            ...record,
            serverTimestamp: new Date()
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};

export const subscribeToRecords = (callback) => {
    const q = query(collection(db, "records"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const records = [];
        querySnapshot.forEach((doc) => {
            records.push({ id: doc.id, ...doc.data() });
        });
        callback(records);
    });
};
