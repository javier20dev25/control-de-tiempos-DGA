import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, limit, orderBy } from "firebase/firestore";

export const startShift = async (userEmail, role) => {
    try {
        const shiftData = {
            userEmail,
            role,
            startTime: serverTimestamp(),
            status: 'active'
        };
        const docRef = await addDoc(collection(db, "shifts"), shiftData);
        return docRef.id;
    } catch (e) {
        console.error("Error starting shift: ", e);
        throw e;
    }
};

export const endShift = async (shiftId) => {
    try {
        const shiftRef = doc(db, "shifts", shiftId);
        await updateDoc(shiftRef, {
            endTime: serverTimestamp(),
            status: 'completed'
        });
    } catch (e) {
        console.error("Error ending shift: ", e);
        throw e;
    }
};

export const getActiveShift = async (userEmail) => {
    try {
        const q = query(
            collection(db, "shifts"),
            where("userEmail", "==", userEmail),
            where("status", "==", "active"),
            orderBy("startTime", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const shiftDoc = querySnapshot.docs[0];
            return { id: shiftDoc.id, ...shiftDoc.data() };
        }
        return null;
    } catch (e) {
        console.error("Error getting active shift: ", e);
        return null;
    }
};
