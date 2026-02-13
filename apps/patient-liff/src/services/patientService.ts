import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { Patient, Visit } from '@reception/shared';

// Find patient by LINE ID (auto-login)
export const getPatientByLineId = async (lineUserId: string): Promise<Patient | null> => {
    const q = query(collection(db, 'patients'), where('lineUserId', '==', lineUserId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { ...snapshot.docs[0].data(), patientId: snapshot.docs[0].id } as Patient;
};

// Check if patient exists AND name matches (Blind Verification)
export const verifyPatientNameMatch = async (patientId: string, inputName: string): Promise<Patient> => {
    const patientRef = doc(db, 'patients', patientId);
    const snapshot = await getDoc(patientRef);

    if (!snapshot.exists()) {
        throw new Error('診察券番号または氏名が正しくありません。');
    }

    const data = snapshot.data() as Patient;

    // Normalize: Remove all white spaces (half-width ' ' and full-width '　')
    const normalize = (str: string) => (str || '').replace(/[\s\u3000]+/g, '');

    if (normalize(data.name) !== normalize(inputName)) {
        throw new Error('診察券番号または氏名が正しくありません。');
    }

    return { ...data, patientId: snapshot.id };
};

export const linkPatient = async (patientId: string, lineUserId: string, name: string): Promise<Patient> => {
    const patientRef = doc(db, 'patients', patientId);
    const snapshot = await getDoc(patientRef);

    // Case 1: Patient exists -> Verify and Link
    if (snapshot.exists()) {
        const patient = snapshot.data() as Patient;

        // Normalize: Remove all white spaces
        const normalize = (str: string) => (str || '').replace(/[\s\u3000]+/g, '');

        if (normalize(patient.name) !== normalize(name)) {
            throw new Error('診察券番号または氏名が正しくありません。');
        }

        if (patient.lineUserId && patient.lineUserId !== lineUserId) {
            throw new Error('この診察券番号は既に他のLINEアカウントと連携されています。');
        }

        await updateDoc(patientRef, {
            lineUserId,
            // SECURITY: Save the firebaseUid to claim ownership of this document if not already set?
            // Usually for existing patients, we might not want to overwrite ownership if it was set by staff?
            // But for LINE link, we do want to associate.
            firebaseUid: auth.currentUser?.uid,
            linkedAt: serverTimestamp()
        });

        return { ...patient, lineUserId, patientId };
    }

    // Case 2: Patient does NOT exist -> Create New
    else {
        const newPatient: Patient = {
            patientId,
            name,
            kana: '', // Optional or empty for now
            lineUserId,
            firebaseUid: auth.currentUser?.uid,
            linkedAt: serverTimestamp(),
            // Set a default birthDate or leave undefined? Patient type has it optional?
            // Checking shared/index.ts: birthDate?: string
        };

        // We use setDoc with a specific ID (patientId)
        await setDoc(patientRef, newPatient);

        return newPatient;
    }
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
            where('status', '==', 'active'),
            where('firebaseUid', '==', auth.currentUser?.uid)
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
            // SECURITY: Save firebaseUid for access control
            firebaseUid: auth.currentUser?.uid,
            status: 'active',
            arrivedAt: serverTimestamp(),
            createdBy: 'patient'
        };

        transaction.set(newVisitRef, visit);
    });
};
