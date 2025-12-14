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

// Check if patient exists by ID and Verify DOB
// Returns Patient if found and DOB matches.
// Returns null if ID not found.
// Throws error if ID found but DOB does not match.
export const verifyPatient = async (patientId: string, inputBirthDate: string): Promise<Patient | null> => {
    const patientRef = doc(db, 'patients', patientId);
    const snapshot = await getDoc(patientRef);

    if (!snapshot.exists()) {
        return null; // Not found -> New Patient Flow
    }

    const data = snapshot.data() as Patient;

    // Normalize dates for comparison (remove hyphens, etc)
    const normalizedDbDate = (data.birthDate || '').replace(/[-/]/g, '');
    const normalizedInputDate = inputBirthDate.replace(/[-/]/g, '');

    // If DB has no birthDate (legacy data), we might allow or fail? 
    // Secure approach: Require DOB match. Use default or prompt if legacy.
    // Assuming new data has DOB.
    if (normalizedDbDate !== normalizedInputDate) {
        throw new Error('生年月日が一致しません。');
    }

    return { ...data, patientId: snapshot.id };
};

export const linkPatient = async (patientId: string, lineUserId: string, name: string, birthDate: string): Promise<Patient> => {
    const patientRef = doc(db, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);

    if (!patientSnap.exists()) {
        // Create new patient with name AND birthDate
        const newPatient: Patient = {
            patientId,
            name: name,
            kana: name,
            birthDate: birthDate,
            lineUserId,
            firebaseUid: auth.currentUser?.uid || null,
            linkedAt: serverTimestamp()
        };
        await setDoc(patientRef, newPatient);
        return newPatient;
    }

    const data = patientSnap.data() as Patient;

    // Double check verification just in case
    const normalizedDbDate = (data.birthDate || '').replace(/[-/]/g, '');
    const normalizedInputDate = birthDate.replace(/[-/]/g, '');

    if (normalizedDbDate !== normalizedInputDate) {
        throw new Error('生年月日が一致しません（セキュリティ保護のため連携できません）。');
    }

    if (data.lineUserId && data.lineUserId !== lineUserId) {
        throw new Error('この診察券番号は既に他のLINEアカウントと連携されています。');
    }

    await updateDoc(patientRef, {
        lineUserId,
        name: name,
        birthDate: birthDate, // Ensure it's saved/updated
        linkedAt: serverTimestamp()
    });

    return { ...data, lineUserId, name, patientId, birthDate };
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
            lineUserId: patient.lineUserId || undefined,
            status: 'active',
            arrivedAt: serverTimestamp(),
            createdBy: 'patient'
        };

        transaction.set(newVisitRef, visit);
    });
};
