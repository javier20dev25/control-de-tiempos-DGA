import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, limit, orderBy } from "firebase/firestore";

export const isPositionOccupied = async (role) => {
    try {
        const q = query(
            collection(db, "shifts"),
            where("role", "==", role),
            where("status", "==", "active"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data().userEmail;
        }
        return null;
    } catch (e) {
        console.error("Error checking position occupancy: ", e);
        return null;
    }
};

export const startShift = async (userEmail, role) => {
    try {
        const occupiedBy = await isPositionOccupied(role);
        if (occupiedBy && occupiedBy !== userEmail) {
            throw new Error(`Esta posición ya está ocupada por ${occupiedBy}. El funcionario anterior debe cerrar su sesión.`);
        }

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
