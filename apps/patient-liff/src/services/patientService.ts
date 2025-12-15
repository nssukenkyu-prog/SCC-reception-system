import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
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
    // Re-verify strictly before linking
    const patient = await verifyPatientNameMatch(patientId, name);
    const patientRef = doc(db, 'patients', patientId);

    if (patient.lineUserId && patient.lineUserId !== lineUserId) {
        throw new Error('この診察券番号は既に他のLINEアカウントと連携されています。');
    }

    await updateDoc(patientRef, {
        lineUserId,
        linkedAt: serverTimestamp()
        // We don't update the name here, we trust the DB name is correct since it matched. 
        // Or we could update it if we wanted to sync format, but better to leave DB as source of truth.
    });

    return { ...patient, lineUserId };
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
