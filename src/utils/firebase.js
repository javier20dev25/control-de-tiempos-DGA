// Firebase configuration boilerplate
// Replace with your actual config from Firebase Console
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

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
