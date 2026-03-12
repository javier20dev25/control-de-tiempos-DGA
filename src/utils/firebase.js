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

export const getUserRole = async (email) => {
    if (email === 'sleytherjavier2025@gmail.com') return 'admin';
    try {
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", email), limit(1)));
        if (!userDoc.empty) {
            return userDoc.docs[0].data().role || 'inspector';
        }
    } catch (e) {
        console.error("Error getting user role:", e);
    }
    return 'inspector';
};

export const setUserRole = async (email, role) => {
    try {
        await setDoc(doc(db, "users", email), { email, role, updatedAt: serverTimestamp() });
    } catch (e) {
        console.error("Error setting user role:", e);
        throw e;
    }
};

export const getUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data());
        });
        return users;
    } catch (e) {
        console.error("Error getting users:", e);
        return [];
    }
};

// Data Persistence Layer - Firebase Implementation
export const saveRecord = async (record, userEmail) => {
    try {
        const docId = record.docId || (record.containerId + '_' + Date.now());
        const data = {
            ...record,
            updatedBy: userEmail,
            updatedAt: serverTimestamp()
        };
        
        if (!record.docId) {
            data.createdBy = userEmail;
            data.timestamp = Date.now();
        }

        await setDoc(doc(db, "records", docId), data, { merge: true });
        return docId;
    } catch (e) {
        console.error("Error saving document: ", e);
        throw e;
    }
};

export const subscribeToRecords = (userEmail, userRole, callback) => {
    // Optimization: Only fetch records from the last 8 days (192h).
    const eightDaysAgo = Date.now() - (192 * 60 * 60 * 1000);
    
    let q;
    if (userRole === 'admin') {
        q = query(
            collection(db, "records"), 
            where("timestamp", ">=", eightDaysAgo),
            orderBy("timestamp", "desc"),
            limit(1000)
        );
    } else {
        // Officials only see records they created OR that were assigned to them
        // Actually, user wants them to see ONLY THEIR data during turn.
        q = query(
            collection(db, "records"), 
            where("createdBy", "==", userEmail),
            where("timestamp", ">=", eightDaysAgo),
            orderBy("timestamp", "desc"),
            limit(500)
        );
    }

    return onSnapshot(q, (querySnapshot) => {
        const records = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
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
