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
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, updateDoc, deleteDoc, where, Timestamp } from "firebase/firestore";
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
        // Use containerId as the document ID for easy referencing across views
        const docId = record.containerId + '_' + record.timestamp;
        await setDoc(doc(db, "records", docId), {
            ...record,
            serverTimestamp: Timestamp.now()
        });
        return docId;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const subscribeToRecords = (callback) => {
    // Optimization: Only fetch records from the last 48 hours to keep the app fast.
    // This covers any pending work from previous shifts.
    const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
    
    const q = query(
        collection(db, "records"), 
        where("timestamp", ">=", fortyEightHoursAgo),
        orderBy("timestamp", "desc")
    );

    return onSnapshot(q, (querySnapshot) => {
        const records = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Backward compatibility
            const normalized = {
                docId: docSnap.id,
                ...data,
                containerId: data.containerId || data.id || '',
                status: data.status || (data.t3 ? 'finalizado' : data.t2 ? 'en_recinto' : 'en_transito'),
            };
            records.push(normalized);
        });
        callback(records);
    }, (error) => {
        console.error("Snapshot error:", error);
    });
};
