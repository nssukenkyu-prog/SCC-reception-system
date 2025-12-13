import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { Patient, Visit } from '@reception/shared';

// Find patient by LINE ID (auto-login)
export const getPatientByLineId = async (lineUserId: string): Promise<Patient | null> => {
    const q = query(collection(db, 'patients'), where('lineUserId', '==', lineUserId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { ...snapshot.docs[0].data(), patientId: snapshot.docs[0].id } as Patient;
};

// Check if patient exists by ID (manual input)
export const getPatientById = async (patientId: string): Promise<Patient | null> => {
    const patientRef = doc(db, 'patients', patientId);
    const snapshot = await getDoc(patientRef);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), patientId: snapshot.id } as Patient;
};

export const linkPatient = async (patientId: string, lineUserId: string, name: string): Promise<Patient> => {
    const patientRef = doc(db, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);

    if (!patientSnap.exists()) {
        // Create new patient with name
        const newPatient: Patient = {
            patientId,
            name: name,
            kana: name, // Fallback for name
            lineUserId,
            firebaseUid: auth.currentUser?.uid || null,
            linkedAt: serverTimestamp()
        };
        await setDoc(patientRef, newPatient);
        return newPatient;
    }

    const data = patientSnap.data() as Patient;

    // Allow re-linking or updating name if no lineUserId or if matching (though logic says if lineUserId exists, error)
    // Actually, user might change devices. This check was strict. 
    // For now, if lineUserId exists and is different, error.
    if (data.lineUserId && data.lineUserId !== lineUserId) {
        throw new Error('この診察券番号は既に他のLINEアカウントと連携されています。');
    }

    await updateDoc(patientRef, {
        lineUserId,
        name: name, // Update name as requested
        linkedAt: serverTimestamp()
    });

    return { ...data, lineUserId, name, patientId };
};

export const createVisit = async (patient: Patient): Promise<void> => {
    // Use JST for date consistency
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

    // Transaction to prevent double booking and ensure consistency
    await runTransaction(db, async (transaction) => {
        // Check for existing active visit
        const q = query(
            collection(db, 'visits'),
            where('patientId', '==', patient.patientId),
            where('date', '==', today),
            where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            throw new Error('既に受付済みです。');
        }

        const newVisitRef = doc(collection(db, 'visits'));
        const visit: Visit = {
            date: today,
            patientId: patient.patientId,
            name: patient.name,
            lineUserId: patient.lineUserId,
            status: 'active',
            arrivedAt: serverTimestamp(),
            createdBy: 'patient'
        };

        transaction.set(newVisitRef, visit);
    });
};
